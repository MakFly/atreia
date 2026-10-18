import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseGuide, type Guide } from "@aion2/shared";
import { openGuideStore, resolveGuidesDb, writeGuide, type ContentLocale } from "../src/db.ts";
import { assertGuideImages } from "../src/images.ts";

const [locale, file] = process.argv.slice(2);
if ((locale !== "en" && locale !== "fr") || !file) {
  console.error("Usage: bun packages/content/scripts/put-guide.ts <en|fr> <fichier.md>");
  process.exit(1);
}

const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
const imagesDir = resolve(repoRoot, "apps/web/public/images");

try {
  const slug = basename(file, ".md");
  const guide = parseGuide(slug, await readFile(resolve(file), "utf8"));
  const db = resolveGuidesDb();
  const store = openGuideStore(db);
  const catalogue: Guide[] = [];
  try {
    for (const edition of ["fr", "en"] as const) {
      for (const meta of store.list(edition)) {
        const existing = store.get(meta.slug, edition);
        if (existing) catalogue.push(existing);
      }
    }
  } finally {
    store.close();
  }
  assertGuideImages(guide, { imagesDir, manifestPath: resolve(imagesDir, "manifest.json"), catalogue });
  writeGuide(db, locale as ContentLocale, guide);
  console.log(`${locale}/${guide.slug} écrit dans ${db}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
