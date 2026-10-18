import { Hono } from "hono";
import type { NewsSourceId, NewsTopic, OfficialNewsFeed, OfficialNewsItem } from "@aion2/shared/browser";

const COMMUNITY = "https://api-global-community.plaync.com/aion2_global/board";
const SITE = "https://aion2.plaync.com";
const CACHE_MS = 300_000;
const MAX_STALE_MS = 86_400_000;
type Locale = "fr" | "en";
type Row = Record<string, any>;
type Snapshot = { items: OfficialNewsItem[]; syncedAt: string };
const sourceIds: NewsSourceId[] = ["announcements", "updates", "events"];

/** Never render upstream HTML. Classification uses only the title and short summary. */
function text(value: unknown): string {
  if (typeof value !== "string") return "";
  const entities: Record<string, string> = { nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" };
  return value.replace(/<[^>]*>/g, " ").replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (match, entity: string) => {
    if (!entity.startsWith("#")) return entities[entity.toLowerCase()] ?? match;
    const number = entity[1]?.toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return number > 0 && number <= 0x10ffff && !(number >= 0xd800 && number <= 0xdfff) ? String.fromCodePoint(number) : "";
  }).replace(/[\u200b-\u200f\ufeff]/g, "").replace(/\s+/g, " ").trim();
}
function iso(value: unknown): string | undefined {
  if (typeof value !== "string" || !/(?:Z|[+-]\d\d:\d\d)$/.test(value) || !Number.isFinite(Date.parse(value))) return;
  return new Date(value).toISOString();
}
function topics(title: string, summary: string, source: NewsSourceId): NewsTopic[] {
  const search = `${title} ${summary}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const result: NewsTopic[] = [];
  if (source === "updates" || /\bpatch\b|notes? de (?:version|mise a jour)/.test(search)) result.push("patch");
  if (source === "events" || /\bevents?\b|\bevenements?\b/.test(search)) result.push("event");
  if (/\bdaeva\s+pass\b|\bbattle\s+pass\b|\bpass(?:e)?\s+(?:daeva|de combat)\b/.test(search)) result.push("pass");
  if (/\bshop\b|\bboutique\b|\bproducts?\b|\bproduits?\b|\bskins?\b/.test(search)) result.push("shop");
  if (/\bmaintenance\b/.test(search)) result.push("maintenance");
  return result.length ? result : ["notice"];
}
function boardItem(row: Row, source: "announcements" | "updates", locale: Locale): OfficialNewsItem | undefined {
  const title = text(row.title).slice(0, 500);
  const date = iso(row.timestamps?.publishedAt) ?? iso(row.timestamps?.postedAt);
  if (typeof row.id !== "string" || !/^[a-f0-9]{24}$/.test(row.id) || !title || !date) return;
  const board = source === "updates" ? "update" : "notice";
  return {
    id: `${source}:${row.id}`, title, date,
    url: `${SITE}/${locale === "fr" ? "fr-fr" : "en-us"}/board/${board}/view?articleId=${row.id}`,
    updatedAt: iso(row.timestamps?.updatedAt), source,
    topics: topics(title, text(row.summary), source),
  };
}
function eventItem(row: Row): OfficialNewsItem | undefined {
  const title = text(row.itemTitle).slice(0, 500);
  const date = iso(row.itemStart);
  const endsAt = iso(row.itemEnd);
  const entry = Array.isArray(row.marketingEntrySet) && row.marketingEntrySet.find((item: Row) => item.entryDevice === "NORMAL");
  if (!Number.isSafeInteger(row.idx) || !title || !date || !endsAt || endsAt <= date || typeof entry?.entryUrl !== "string") return;
  let url: URL;
  try { url = new URL(entry.entryUrl, SITE); } catch { return; }
  if (url.origin !== SITE || url.username || url.password) return;
  const summary = Array.isArray(row.marketingItemAdditionSet)
    ? row.marketingItemAdditionSet.find((item: Row) => item.additionType === "description")?.additionData : "";
  return { id: `events:${row.idx}`, title, date, endsAt, url: url.href, source: "events", topics: topics(title, text(summary), "events") };
}

/** Bounded official sources, five-minute cache, per-source stale fallback for at most a day. */
export function createNewsApi(request: typeof fetch = fetch, now = Date.now) {
  const snapshots = new Map<string, Snapshot>();
  const feeds = new Map<Locale, { expires: number; feed: OfficialNewsFeed }>();
  const pending = new Map<Locale, Promise<OfficialNewsFeed>>();

  async function json(url: string, signal: AbortSignal): Promise<Row> {
    const response = await request(url, { signal, headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Official feed unavailable");
    const data = await response.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid official feed");
    return data;
  }
  async function load(source: NewsSourceId, locale: Locale): Promise<OfficialNewsItem[]> {
    // One deadline covers pagination too, keeping the request bounded.
    const signal = AbortSignal.timeout(7_000);
    if (source === "events") {
      const region = locale === "fr" ? "fr-fr" : "en-us";
      const tags = `MKT_PROMOTION,DOMAIN_AION2_GLOBAL,COUNTRY_${locale === "fr" ? "FR" : "US"},`;
      const data = await json(`https://promotion.plaync.com/${region}/eventon/item?${new URLSearchParams({ tag: tags, status: "RUNNING", pageSize: "30", page: "1" })}`, signal);
      if (!Array.isArray(data.content) || typeof data.totalElements !== "number") throw new Error("Invalid event list");
      const items = data.content.filter((row: unknown) => row && typeof row === "object").map(eventItem).filter((item: OfficialNewsItem | undefined): item is OfficialNewsItem => Boolean(item));
      if (data.content.length && !items.length) throw new Error("Unusable event list");
      return items;
    }
    const board = `${source === "updates" ? "update" : "notice"}_${locale}`;
    let cursor = "0";
    const items: OfficialNewsItem[] = [];
    for (let page = 0; page < (source === "announcements" ? 3 : 1); page++) {
      const query = new URLSearchParams({ isVote: "true", moreSize: "25", moreDirection: "BEFORE", previousArticleId: cursor });
      const data = await json(`${COMMUNITY}/${board}/article/search/moreArticle?${query}`, signal);
      if (!Array.isArray(data.contentList) || typeof data.hasMore !== "boolean") throw new Error("Invalid board list");
      const rows = data.contentList.filter((row: unknown) => row && typeof row === "object");
      const valid = rows.map((row: Row) => boardItem(row, source, locale)).filter((item: OfficialNewsItem | undefined): item is OfficialNewsItem => Boolean(item));
      if (data.contentList.length && !valid.length) throw new Error("Unusable board list");
      items.push(...valid);
      if (!data.hasMore || !rows.length) break;
      const next = rows.at(-1)?.id;
      if (typeof next !== "string" || !/^[a-f0-9]{24}$/.test(next) || next === cursor) throw new Error("Invalid pagination");
      cursor = next;
    }
    return items;
  }
  function sourceUrl(source: NewsSourceId, locale: Locale) {
    const prefix = `${SITE}/${locale === "fr" ? "fr-fr" : "en-us"}`;
    return source === "events" ? `${prefix}/eventon` : `${prefix}/board/${source === "updates" ? "update" : "notice"}/list`;
  }
  async function refresh(locale: Locale): Promise<OfficialNewsFeed> {
    const cached = feeds.get(locale);
    if (cached && now() < cached.expires) return cached.feed;
    if (pending.has(locale)) return pending.get(locale)!;
    const work = (async () => {
      const results = await Promise.allSettled(sourceIds.map((source) => load(source, locale)));
      const items: OfficialNewsItem[] = [];
      const sources = results.map((result, index): OfficialNewsFeed["sources"][number] => {
        const id = sourceIds[index]!;
        const key = `${locale}:${id}`;
        if (result.status === "fulfilled") snapshots.set(key, { items: result.value, syncedAt: new Date(now()).toISOString() });
        let snapshot = snapshots.get(key);
        if (snapshot && now() - Date.parse(snapshot.syncedAt) > MAX_STALE_MS) snapshot = undefined;
        if (snapshot) items.push(...snapshot.items);
        return { id, url: sourceUrl(id, locale), syncedAt: snapshot?.syncedAt ?? null, state: result.status === "fulfilled" ? "live" : snapshot ? "stale" : "unavailable" };
      });
      const feed: OfficialNewsFeed = {
        checkedAt: new Date(now()).toISOString(), partial: sources.some((source) => source.state !== "live"), sources,
        items: [...new Map(items.map((item) => [item.url, item])).values()].sort((a, b) => b.date.localeCompare(a.date)),
      };
      feeds.set(locale, { feed, expires: now() + (feed.partial ? 60_000 : CACHE_MS) });
      return feed;
    })();
    pending.set(locale, work);
    try { return await work; } finally { pending.delete(locale); }
  }
  const app = new Hono({ strict: false });
  app.get("/api/news", async (c) => {
    c.header("Cache-Control", "no-store");
    const lang = c.req.query("lang") ?? "en";
    if (lang !== "en" && lang !== "fr") return c.json({ error: "Unsupported language. Use en or fr." }, 400);
    c.header("Content-Language", lang);
    const feed = await refresh(lang);
    if (feed.sources.every((source) => source.state === "unavailable")) return c.json({ error: "Official news unavailable" }, 503);
    return c.json(feed);
  });
  return app;
}
