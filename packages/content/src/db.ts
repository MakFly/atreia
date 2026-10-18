import { existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { guideFrontmatterSchema, type Guide, type GuideMeta, sortGuides, toMeta, type TocEntry } from "@aion2/shared";

export type ContentLocale = "en" | "fr";

export interface GuideStore {
  list(locale?: ContentLocale): GuideMeta[];
  load(locale?: ContentLocale): Guide[];
  get(slug: string, locale?: ContentLocale): Guide | undefined;
  readonly size: number;
  close(): void;
}

export interface GuideEdition {
  locale: ContentLocale;
  guide: Guide;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS guides (
  locale TEXT NOT NULL CHECK (locale IN ('en', 'fr')),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL,
  updated TEXT NOT NULL,
  status TEXT NOT NULL,
  faction TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  highlights_json TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  classes_json TEXT NOT NULL,
  ratings_json TEXT NOT NULL,
  pros_json TEXT NOT NULL,
  cons_json TEXT NOT NULL,
  patch TEXT NOT NULL,
  cover_json TEXT,
  body TEXT NOT NULL,
  toc_json TEXT NOT NULL,
  reading_minutes INTEGER NOT NULL,
  PRIMARY KEY (locale, slug)
)`;

const COLUMNS = [
  "locale", "slug", "title", "summary", "category", "updated", "status", "faction",
  "tags_json", "highlights_json", "sort_order", "classes_json", "ratings_json",
  "pros_json", "cons_json", "patch", "cover_json", "body", "toc_json", "reading_minutes",
] as const;

const INSERT = `INSERT INTO guides (${COLUMNS.join(", ")}) VALUES (${COLUMNS.map(() => "?").join(", ")})`;
const UPDATE = COLUMNS.filter((column) => column !== "locale" && column !== "slug")
  .map((column) => `${column} = excluded.${column}`)
  .join(", ");
const UPSERT = `${INSERT} ON CONFLICT(locale, slug) DO UPDATE SET ${UPDATE}`;

interface GuideRow {
  locale: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  updated: string;
  status: string;
  faction: string;
  tags_json: string;
  highlights_json: string;
  sort_order: number;
  classes_json: string;
  ratings_json: string;
  pros_json: string;
  cons_json: string;
  patch: string;
  cover_json: string | null;
  body: string;
  toc_json: string;
  reading_minutes: number;
}

/** Absolute path of the catalogue. A relative GUIDES_DB is resolved from the working directory. */
export function resolveGuidesDb(explicit?: string): string {
  const candidates = [
    explicit,
    process.env.GUIDES_DB,
    resolve(process.cwd(), "packages/content/guides.sqlite"),
    resolve(process.cwd(), "../../packages/content/guides.sqlite"),
    resolve(process.cwd(), "../../../packages/content/guides.sqlite"),
  ].filter((value): value is string => Boolean(value));
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(`Base des guides introuvable. Définis GUIDES_DB. Chemins essayés : ${candidates.join(", ")}`);
  }
  return resolve(found);
}

/** Replace the file with these editions. Both languages are required for every slug. */
export function createGuideDatabase(file: string, editions: GuideEdition[]): void {
  if (existsSync(file)) unlinkSync(file);
  const db = new DatabaseSync(file);
  try {
    db.exec("PRAGMA journal_mode = DELETE");
    db.exec(SCHEMA);
    db.exec("BEGIN IMMEDIATE");
    try {
      const insert = db.prepare(INSERT);
      for (const edition of editions) insert.run(...bind(edition.locale, edition.guide));
      assertCatalogue(db);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  } catch (error) {
    db.close();
    if (existsSync(file)) unlinkSync(file);
    throw error;
  }
  db.close();
}

/** Insert or replace one edition. The server still refuses a catalogue missing its pair. */
export function writeGuide(file: string, locale: ContentLocale, guide: Guide): void {
  const db = new DatabaseSync(file);
  try {
    db.exec("PRAGMA journal_mode = DELETE");
    db.exec("PRAGMA busy_timeout = 5000");
    db.exec(SCHEMA);
    db.prepare(UPSERT).run(...bind(locale, guide));
  } finally {
    db.close();
  }
}

/** Open the catalogue for reading. Invalid rows and missing translations fail immediately. */
export function openGuideStore(file = resolveGuidesDb()): GuideStore {
  if (!existsSync(file)) throw new Error(`Base des guides introuvable : ${file}`);
  const db = new DatabaseSync(file, { readOnly: true });
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec("PRAGMA query_only = ON");
  assertCatalogue(db);

  const byLocale = db.prepare("SELECT * FROM guides WHERE locale = ?");
  const bySlug = db.prepare("SELECT * FROM guides WHERE locale = ? AND slug = ?");
  const count = db.prepare("SELECT COUNT(DISTINCT slug) AS total FROM guides");

  return {
    load(locale = "en") {
      return sortGuides(readRows(byLocale.all(locale)));
    },
    list(locale = "en") {
      return this.load(locale).map(toMeta);
    },
    get(slug, locale = "en") {
      const row = bySlug.get(locale, slug);
      return row ? readGuide(row as unknown as GuideRow) : undefined;
    },
    get size() {
      const row = count.get() as unknown as { total: number | bigint } | undefined;
      return Number(row?.total ?? 0);
    },
    close() {
      db.close();
    },
  };
}

function bind(locale: ContentLocale, guide: Guide): SQLInputValue[] {
  return [
    locale,
    guide.slug,
    guide.title,
    guide.summary,
    guide.category,
    guide.updated,
    guide.status,
    guide.faction,
    JSON.stringify(guide.tags),
    JSON.stringify(guide.highlights),
    guide.order,
    JSON.stringify(guide.classes),
    JSON.stringify(guide.ratings),
    JSON.stringify(guide.pros),
    JSON.stringify(guide.cons),
    guide.patch,
    guide.cover ? JSON.stringify(guide.cover) : null,
    guide.body,
    JSON.stringify(guide.toc),
    guide.readingMinutes,
  ];
}

function assertCatalogue(db: DatabaseSync): void {
  const rows = db.prepare("SELECT locale, slug FROM guides").all() as { locale: string; slug: string }[];
  const en = new Set(rows.filter((row) => row.locale === "en").map((row) => row.slug));
  const fr = new Set(rows.filter((row) => row.locale === "fr").map((row) => row.slug));
  for (const slug of new Set([...en, ...fr])) {
    if (!en.has(slug) || !fr.has(slug)) throw new Error(`Missing EN/FR guide translation: ${slug}`);
  }
  readRows(db.prepare("SELECT * FROM guides").all());
}

function readRows(rows: unknown[]): Guide[] {
  return rows.map((row) => readGuide(row as GuideRow));
}

function readGuide(row: GuideRow, fallback = row.locale): Guide {
  let tags: unknown;
  let highlights: unknown;
  let classes: unknown;
  let ratings: unknown;
  let pros: unknown;
  let cons: unknown;
  let cover: unknown;
  let toc: unknown;
  try {
    tags = JSON.parse(row.tags_json);
    highlights = JSON.parse(row.highlights_json);
    classes = JSON.parse(row.classes_json);
    ratings = JSON.parse(row.ratings_json);
    pros = JSON.parse(row.pros_json);
    cons = JSON.parse(row.cons_json);
    cover = row.cover_json ? JSON.parse(row.cover_json) : undefined;
    toc = JSON.parse(row.toc_json);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Guide « ${row.slug} » (${fallback}) illisible : ${detail}`);
  }

  const parsed = guideFrontmatterSchema.safeParse({
    title: row.title,
    summary: row.summary,
    category: row.category,
    updated: row.updated,
    status: row.status,
    faction: row.faction,
    tags,
    highlights,
    order: row.sort_order,
    classes,
    ratings,
    pros,
    cons,
    patch: row.patch,
    ...(cover ? { cover } : {}),
  });
  if (!parsed.success) {
    throw new Error(`Guide « ${row.slug} » (${fallback}) illisible : ${parsed.error.message}`);
  }
  return { ...parsed.data, slug: row.slug, body: row.body, toc: readToc(toc, row.slug, fallback), readingMinutes: row.reading_minutes };
}

function readToc(value: unknown, slug: string, locale: string): TocEntry[] {
  if (!Array.isArray(value)) throw new Error(`Guide « ${slug} » (${locale}) illisible : sommaire invalide`);
  return value.map((entry) => {
    if (!entry || typeof entry !== "object") throw new Error(`Guide « ${slug} » (${locale}) illisible : sommaire invalide`);
    const { depth, text, id } = entry as TocEntry;
    if ((depth !== 2 && depth !== 3) || typeof text !== "string" || typeof id !== "string") {
      throw new Error(`Guide « ${slug} » (${locale}) illisible : sommaire invalide`);
    }
    return { depth, text, id };
  });
}
