import GithubSlugger from "github-slugger";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { CLASS_KEYS, GRADES } from "./classes.ts";
import { CATEGORIES, type Category, type Guide, type TocEntry } from "./meta.ts";

const categoryKeys = Object.keys(CATEGORIES) as [Category, ...Category[]];

export const guideFrontmatterSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  category: z.enum(categoryKeys),
  // Certains parseurs YAML (Astro) renvoient un Date : on normalise en "AAAA-MM-JJ".
  updated: z.preprocess((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v), z.iso.date()),
  /** "publie" = lisible, "a-venir" = section prévue, contenu en préparation */
  status: z.enum(["publie", "a-venir"]).default("publie"),
  faction: z.enum(["elyos", "asmodien", "les-deux"]).default("les-deux"),
  tags: z.array(z.string()).default([]),
  /** 3 à 5 points affichés en tête du guide et sur l'accueil */
  highlights: z.array(z.string()).max(5).default([]),
  order: z.number().int().default(100),
  /** Classes concernées : vignette et liens depuis la page Classes */
  classes: z.array(z.enum(CLASS_KEYS)).default([]),
  /** Notes affichées en tête du guide, façon fiche de build */
  ratings: z.array(z.object({ label: z.string(), grade: z.enum(GRADES) })).default([]),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  /** Version du jeu couverte, affichée dans le bandeau */
  patch: z.string().default("Saison 1 globale"),
  /** Illustration de vignette et d'en-tête, servie depuis apps/web/public (sources dans assets/manifest.json) */
  cover: z.object({ src: z.string().startsWith("/"), alt: z.string().min(1) }).optional(),
});

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class GuideParseError extends Error {
  constructor(slug: string, detail: string) {
    super(`Guide « ${slug} » invalide : ${detail}`);
    this.name = "GuideParseError";
  }
}

/** Parse un fichier Markdown avec frontmatter YAML. Lève GuideParseError si le contenu est invalide. */
export function parseGuide(slug: string, raw: string): Guide {
  if (!SLUG.test(slug)) throw new GuideParseError(slug, "slug non conforme (kebab-case attendu)");
  const match = FRONTMATTER.exec(raw);
  if (!match?.[1]) throw new GuideParseError(slug, "frontmatter YAML manquant");

  const result = guideFrontmatterSchema.safeParse(parseYaml(match[1]));
  if (!result.success) throw new GuideParseError(slug, z.prettifyError(result.error));

  const body = raw.slice(match[0].length).trim();
  const words = body.split(/\s+/).filter(Boolean).length;

  return {
    ...result.data,
    slug,
    body,
    toc: extractToc(body),
    readingMinutes: Math.max(1, Math.round(words / 220)),
  };
}

/** Même algorithme de slug que rehype-slug, pour que les ancres du sommaire correspondent. */
export function extractToc(markdown: string): TocEntry[] {
  const slugger = new GithubSlugger();
  const toc: TocEntry[] = [];
  let inFence = false;

  for (const line of markdown.split("\n")) {
    if (line.startsWith("```")) inFence = !inFence;
    if (inFence) continue;
    const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m?.[1] || !m[2]) continue;
    const text = stripInlineMarkdown(m[2]);
    const id = slugger.slug(text);
    const depth = m[1].length;
    if (depth === 2 || depth === 3) toc.push({ depth, text, id });
  }
  return toc;
}

function stripInlineMarkdown(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .trim();
}

