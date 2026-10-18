import { existsSync, readFileSync } from "node:fs";
import { basename, resolve, sep } from "node:path";
import type { Guide } from "@aion2/shared";

export class GuideImageError extends Error {
  constructor(detail: string) {
    super(detail);
    this.name = "GuideImageError";
  }
}

/** Cover and Markdown images. Fenced blocks are skipped, same as the table of contents. */
export function guideImageSources(guide: Pick<Guide, "cover" | "body">): string[] {
  const sources: string[] = [];
  if (guide.cover) sources.push(guide.cover.src);
  let fenced = false;
  for (const line of guide.body.split("\n")) {
    if (line.startsWith("```")) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    for (const match of line.matchAll(/!\[[^\]]*\]\(\s*<?([^)\s>]+)>?/g)) {
      if (match[1]) sources.push(match[1]);
    }
    for (const match of line.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) {
      if (match[1]) sources.push(match[1]);
    }
  }
  return sources;
}

type GuideImages = Pick<Guide, "slug" | "cover" | "body">;

/** Refuse a missing file, a repeated file, or a file already used by another slug. */
export function assertGuideImages(
  guide: GuideImages,
  options: { imagesDir: string; manifestPath: string; catalogue?: readonly GuideImages[] },
): void {
  const names = manifestFiles(options.manifestPath);
  const root = resolve(options.imagesDir);
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const src of guideImageSources(guide)) {
    if (seen.has(src)) {
      problems.push(`« ${src} » est déjà utilisé dans « ${guide.slug} »`);
      continue;
    }
    seen.add(src);
    const name = localImageName(src);
    if (!name || !names.has(name)) {
      problems.push(`« ${src} » n'est pas un fichier de public/images inscrit dans le manifest`);
      continue;
    }
    const full = resolve(root, name);
    if (!full.startsWith(`${root}${sep}`) || !existsSync(full)) {
      problems.push(`« ${src} » est inscrit dans le manifest mais le fichier est absent`);
    }
  }
  if (options.catalogue) {
    const taken = new Map<string, string>();
    for (const other of options.catalogue) {
      if (other.slug === guide.slug) continue;
      for (const src of guideImageSources(other)) {
        if (!taken.has(src)) taken.set(src, other.slug);
      }
    }
    for (const src of seen) {
      const owner = taken.get(src);
      if (owner) problems.push(`« ${src} » est déjà utilisé par « ${owner} »`);
    }
  }
  if (problems.length > 0) {
    throw new GuideImageError(`Guide « ${guide.slug} » : ${problems.join(" ; ")}.`);
  }
}

function localImageName(src: string): string | undefined {
  if (!src.startsWith("/images/")) return undefined;
  const name = src.slice("/images/".length);
  if (name === "" || name === "." || name === ".." || name !== basename(name)) return undefined;
  if (name.includes("?") || name.includes("#")) return undefined;
  return name;
}

function manifestFiles(manifestPath: string): Set<string> {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new GuideImageError(`Manifest illisible (${manifestPath}) : ${detail}`);
  }
  if (!Array.isArray(raw)) throw new GuideImageError(`Manifest illisible : ${manifestPath} n'est pas une liste.`);
  const names = new Set<string>();
  for (const entry of raw) {
    const file = entry && typeof entry === "object" && "file" in entry ? entry.file : undefined;
    if (typeof file !== "string" || file === "" || file !== basename(file)) {
      throw new GuideImageError(`Manifest illisible : entrée sans nom de fichier dans ${manifestPath}.`);
    }
    names.add(file);
  }
  return names;
}
