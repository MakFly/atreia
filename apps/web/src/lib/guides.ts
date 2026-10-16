import { CATEGORIES, type Category, type GuideMeta, sortGuides } from "@aion2/shared/browser";
import { type CollectionEntry, getCollection } from "astro:content";

export type GuideEntry = CollectionEntry<"guides">;

const WORDS_PER_MINUTE = 220;

export function toMeta(entry: GuideEntry): GuideMeta {
  const words = (entry.body ?? "").split(/\s+/).filter(Boolean).length;
  return { ...entry.data, slug: entry.id, readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)) };
}

export async function allGuides(): Promise<GuideMeta[]> {
  return sortGuides((await getCollection("guides")).map(toMeta));
}

export async function guidesByCategory(): Promise<{ key: Category; label: string; guides: GuideMeta[] }[]> {
  const guides = await allGuides();
  return (Object.keys(CATEGORIES) as Category[]).map((key) => ({
    key,
    label: CATEGORIES[key].label,
    guides: guides.filter((g) => g.category === key),
  }));
}

export const guideHref = (slug: string) => `/guides/${slug}/`;
