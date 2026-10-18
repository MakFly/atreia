import {
  CATEGORIES,
  readGuideApiFetch,
  type Category,
  type Guide,
  type GuideMeta,
  type TocEntry,
} from "@aion2/shared/browser";
import { categoryLabels, localizePath, type Locale } from "./i18n";

type GuideListItem = GuideMeta & { toc: TocEntry[] };

function apiOrigin(): string {
  const configured = process.env["GUIDES_API_ORIGIN"];
  if (configured) return configured.replace(/\/$/, "");
  const port = process.env["PORT"] ?? "8787";
  return `http://127.0.0.1:${port}`;
}

/** Production calls the Hono app in-process. Development calls the API process. */
async function apiGet(path: string): Promise<Response> {
  const direct = readGuideApiFetch();
  if (direct) return direct(new Request(`http://atreia.internal${path}`));
  return fetch(`${apiOrigin()}${path}`);
}

async function apiJson<T>(path: string): Promise<T> {
  const response = await apiGet(path);
  if (!response.ok) throw new Error(`Guide API ${response.status} for ${path}`);
  return response.json() as Promise<T>;
}

export async function getGuide(slug: string, locale: Locale = "en"): Promise<Guide | undefined> {
  const response = await apiGet(`/api/guides/${encodeURIComponent(slug)}?lang=${locale}`);
  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error(`Guide API ${response.status} for ${slug}`);
  return response.json() as Promise<Guide>;
}

export async function allGuides(locale: Locale = "en"): Promise<GuideMeta[]> {
  const body = await apiJson<{ items: GuideListItem[] }>(`/api/guides?lang=${locale}`);
  return body.items;
}

export async function searchGuides(
  locale: Locale = "en",
): Promise<{ slug: string; title: string; category: Category; text: string }[]> {
  const body = await apiJson<{ items: GuideListItem[] }>(`/api/guides?lang=${locale}`);
  return body.items.map((guide) => ({
    slug: guide.slug,
    title: guide.title,
    category: guide.category,
    text: [guide.summary, ...guide.tags, ...guide.toc.map((entry) => entry.text)].join(" "),
  }));
}

export async function guidesByCategory(
  locale: Locale = "en",
): Promise<{ key: Category; label: string; guides: GuideMeta[] }[]> {
  const items = await allGuides(locale);
  return (Object.keys(CATEGORIES) as Category[]).map((key) => ({
    key,
    label: categoryLabels[locale][key],
    guides: items.filter((guide) => guide.category === key),
  }));
}

export const guideHref = (slug: string, locale: Locale = "en") => localizePath(`/guides/${slug}/`, locale);
