#!/usr/bin/env bun
// Lists (and optionally downloads) AION 2 images from verified sources:
//   official  NC community API behind aion2.plaync.com (notice, update, movie_clip boards)
//   steam     Steam store assets of app 3393110 (header, capsule, background, screenshots)
//   commons   Wikimedia Commons search, with the license of every file
//
// Usage:
//   bun fetch.ts official [--board notice,update,movie_clip] [--lang fr] [--limit 10]
//   bun fetch.ts steam
//   bun fetch.ts commons --query "Aion NCSoft" [--limit 20]
//   add --out <dir> to download the files and merge them into <dir>/manifest.json

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";

const COMMUNITY_API = "https://api-global-community.plaync.com/aion2_global";
const STEAM_APP_ID = 3393110;
const NC_CREDIT = "© NC Corporation. All Rights Reserved.";
const NC_LICENSE = "NC AION2 fan content guidelines (not free)";
const LOCALES: Record<string, string> = {
  fr: "fr-fr", en: "en-us", de: "de-de", es: "es-es", pt: "pt-br", ja: "ja-jp",
};

type Image = {
  url: string;
  source: "official" | "steam" | "commons";
  title: string;
  page: string;
  date?: string;
  license: string;
  credit: string;
  width?: number;
  height?: number;
};

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    board: { type: "string", default: "notice,update,movie_clip" },
    lang: { type: "string", default: "fr" },
    limit: { type: "string", default: "10" },
    query: { type: "string", default: "Aion NCSoft" },
    out: { type: "string" },
  },
});

const limit = Number(values.limit);

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": "atreia-image-skill/1.0" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return (await res.json()) as T;
}

async function official(): Promise<Image[]> {
  const lang = values.lang!;
  const locale = LOCALES[lang] ?? "en-us";
  const out: Image[] = [];
  for (const board of values.board!.split(",")) {
    const list = await getJson<{ contentList: any[] }>(
      `${COMMUNITY_API}/board/${board}_${lang}/article?size=${limit}`,
    );
    for (const item of list.contentList) {
      const detail = await getJson<any>(`${COMMUNITY_API}/board/${board}_${lang}/article/${item.id}`);
      const pattern: string | undefined = detail.article?.categoryBoard?.boardUrlPattern;
      const page = pattern
        ? pattern.replace("{articleId}", item.id)
        : `https://aion2.plaync.com/${locale}/board/${board}/view?articleId=${item.id}`;
      // Full-size files only: "download_thumbnail" is the same file, resized.
      const body = JSON.stringify(detail.article?.content ?? "");
      const urls = new Set(body.match(/https:\/\/fizz-download\.playnccdn\.com\/lg\/file\/AION\/download\/[\w-]+/g));
      for (const u of item.thumbnailUrlList ?? []) {
        // Video posts only carry a YouTube thumbnail: take the largest variant.
        if (u.includes("img.youtube.com")) urls.add(u.replace(/\/0\.jpg$/, "/maxresdefault.jpg"));
      }
      for (const url of urls) {
        out.push({
          url, source: "official", title: item.title.trim(), page,
          date: item.timestamps?.postDateTime?.slice(0, 10), license: NC_LICENSE, credit: NC_CREDIT,
        });
      }
    }
  }
  return out;
}

async function steam(): Promise<Image[]> {
  const data = (await getJson<any>(`https://store.steampowered.com/api/appdetails?appids=${STEAM_APP_ID}`))[
    STEAM_APP_ID
  ].data;
  const page = `https://store.steampowered.com/app/${STEAM_APP_ID}/`;
  const base = { source: "steam" as const, page, license: NC_LICENSE, credit: NC_CREDIT };
  const out: Image[] = [
    { ...base, url: data.header_image, title: "Steam header" },
    { ...base, url: data.capsule_image, title: "Steam capsule" },
    { ...base, url: data.background_raw, title: "Steam page background" },
  ];
  for (const s of data.screenshots ?? []) {
    out.push({ ...base, url: s.path_full, title: `Steam screenshot ${s.id}`, width: 1920, height: 1080 });
  }
  return out.filter((i) => i.url);
}

async function commons(): Promise<Image[]> {
  const params = new URLSearchParams({
    action: "query", format: "json", generator: "search", gsrsearch: values.query!,
    gsrnamespace: "6", gsrlimit: String(limit), prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata", origin: "*",
  });
  const data = await getJson<any>(`https://commons.wikimedia.org/w/api.php?${params}`);
  const strip = (s?: string) => (s ?? "").replace(/<[^>]+>/g, "").trim();
  return Object.values<any>(data.query?.pages ?? {})
    .map((p) => ({ p, info: p.imageinfo?.[0] }))
    .filter(({ info }) => info?.mime?.startsWith("image/"))
    .map(({ p, info }) => {
      const meta = info.extmetadata ?? {};
      return {
        url: info.url, source: "commons" as const, title: p.title, page: info.descriptionurl,
        date: strip(meta.DateTimeOriginal?.value).slice(0, 10) || undefined,
        license: strip(meta.LicenseShortName?.value) || "unknown",
        credit: `${strip(meta.Artist?.value) || "unknown author"}, ${strip(meta.LicenseShortName?.value)}, via Wikimedia Commons`,
        width: info.width, height: info.height,
      };
    });
}

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg" };

async function download(images: Image[], dir: string) {
  await mkdir(dir, { recursive: true });
  const manifestPath = join(dir, "manifest.json");
  const manifest: (Image & { file: string })[] = existsSync(manifestPath)
    ? JSON.parse(await readFile(manifestPath, "utf8"))
    : [];
  const known = new Set(manifest.map((m) => m.url));
  for (const img of images) {
    if (known.has(img.url)) continue;
    const res = await fetch(img.url, { headers: { "User-Agent": "atreia-image-skill/1.0" } });
    const type = res.headers.get("content-type")?.split(";")[0] ?? "";
    if (!res.ok || !EXT[type]) {
      console.error(`skip ${res.status} ${type} ${img.url}`);
      continue;
    }
    const hash = createHash("sha1").update(img.url).digest("hex").slice(0, 10);
    const file = `${img.source}-${hash}.${EXT[type]}`;
    await writeFile(join(dir, file), new Uint8Array(await res.arrayBuffer()));
    manifest.push({ ...img, file });
    known.add(img.url);
    console.error(`saved ${file}  ${img.title}`);
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.error(`manifest: ${manifestPath} (${manifest.length} entries)`);
}

const sources = { official, steam, commons };
const name = positionals[0] as keyof typeof sources;
if (!sources[name]) {
  console.error("usage: bun fetch.ts <official|steam|commons> [--board ..] [--lang fr] [--limit 10] [--query ..] [--out dir]");
  process.exit(1);
}
const images = await sources[name]();
if (values.out) await download(images, values.out);
else console.log(JSON.stringify(images, null, 2));
