import { describe, expect, it, vi } from "vitest";
import { createNewsApi } from "./news.ts";

const publication = (title = "New Daeva Pass products", id = "6abbb6c82c2d9c52e6c7a441") => ({
  id, title, summary: "", timestamps: { postedAt: "2026-09-30T07:00:00Z", updatedAt: "2026-10-01T07:00:00Z" },
});
const event = (entryUrl = "/fr-fr/eventon/board/event_notice/view?articleId=50000029") => ({
  idx: 63356, itemTitle: "[Événement] Un bonbon ou un sort !", itemStart: "2026-10-14T06:30:01Z", itemEnd: "2026-11-04T06:00:00Z",
  marketingEntrySet: [{ entryDevice: "NORMAL", entryUrl }],
});
function upstream(url: string) {
  if (url.includes("promotion.plaync.com")) return { content: [event()], totalElements: 1 };
  return { contentList: [publication(url.includes("update_") ? "Patch notes" : undefined)], hasMore: false };
}

describe("official AION 2 news", () => {
  it("merges real source formats, classifies overlapping topics and preserves event dates", async () => {
    const app = createNewsApi((async (input) => Response.json(upstream(String(input)))) as typeof fetch);
    const response = await app.request("/api/news/?lang=fr");
    const feed = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-language")).toBe("fr");
    expect(feed.partial).toBe(false);
    expect(feed.items.map((item: { source: string }) => item.source)).toEqual(["events", "announcements", "updates"]);
    expect(feed.items[0]).toMatchObject({ date: "2026-10-14T06:30:01.000Z", endsAt: "2026-11-04T06:00:00.000Z", topics: ["event"] });
    expect(feed.items[1]).toMatchObject({ title: "New Daeva Pass products", topics: ["pass", "shop"], url: "https://aion2.plaync.com/fr-fr/board/notice/view?articleId=6abbb6c82c2d9c52e6c7a441" });
    expect(feed.items[2].topics).toEqual(["patch"]);
  });

  it("shares concurrent requests, separates locales and refreshes after five minutes", async () => {
    let now = Date.parse("2026-10-16T12:00:00Z");
    const request = vi.fn(async (input) => Response.json(upstream(String(input))));
    const app = createNewsApi(request as typeof fetch, () => now);
    await Promise.all([app.request("/api/news?lang=fr"), app.request("/api/news?lang=fr")]);
    expect(request).toHaveBeenCalledTimes(3);
    await app.request("/api/news?lang=en");
    expect(request).toHaveBeenCalledTimes(6);
    expect(request.mock.calls.some(([url]) => String(url).includes("COUNTRY_US"))).toBe(true);
    now += 299_999;
    await app.request("/api/news?lang=fr");
    expect(request).toHaveBeenCalledTimes(6);
    now++;
    await app.request("/api/news?lang=fr");
    expect(request).toHaveBeenCalledTimes(9);
    expect((await app.request("/api/news?lang=xx")).status).toBe(400);
    expect(request).toHaveBeenCalledTimes(9);
  });

  it("paginates announcements with cursors, bounds the window and removes duplicates", async () => {
    const cursors: string[] = [];
    const request = vi.fn(async (input) => {
      const url = String(input);
      if (!url.includes("notice_")) return Response.json(upstream(url));
      const cursor = new URL(url).searchParams.get("previousArticleId")!;
      cursors.push(cursor);
      const row = publication(`Page ${cursors.length}`, `6abbb6c82c2d9c52e6c7a44${cursors.length}`);
      return Response.json({ contentList: [publication(), row], hasMore: true });
    });
    const app = createNewsApi(request as typeof fetch);
    const feed = await (await app.request("/api/news")).json();
    expect(cursors).toEqual(["0", "6abbb6c82c2d9c52e6c7a441", "6abbb6c82c2d9c52e6c7a442"]);
    expect(feed.items.filter((item: { source: string }) => item.source === "announcements")).toHaveLength(3);
    expect(request).toHaveBeenCalledTimes(5);
  });

  it("keeps failed sources explicitly stale, recovers, then expires old entries after a day", async () => {
    let now = Date.parse("2026-10-16T12:00:00Z");
    let failure = "";
    const app = createNewsApi((async (input) => {
      if (failure === "all" || failure === "updates" && String(input).includes("update_")) throw new Error("offline");
      return Response.json(upstream(String(input)));
    }) as typeof fetch, () => now);
    const original = await (await app.request("/api/news")).json();
    now += 300_000;
    failure = "updates";
    const partial = await (await app.request("/api/news")).json();
    expect(partial.partial).toBe(true);
    expect(partial.sources.find((source: { id: string }) => source.id === "updates")).toMatchObject({ state: "stale", syncedAt: original.checkedAt });
    expect(partial.items).toHaveLength(3);
    now += 60_000;
    failure = "";
    expect((await (await app.request("/api/news")).json()).partial).toBe(false);
    now += 86_400_001;
    failure = "all";
    expect((await app.request("/api/news")).status).toBe(503);
  });

  it("rejects broken payloads and external event links without inventing an empty successful feed", async () => {
    for (const body of [null, {}, { contentList: [{}], hasMore: false }, { content: [event("https://evil.example/")], totalElements: 1 }]) {
      const app = createNewsApi((async () => Response.json(body)) as typeof fetch);
      expect((await app.request("/api/news")).status).toBe(503);
    }
    const app = createNewsApi((async (input) => Response.json(String(input).includes("promotion") ? { content: [], totalElements: 0 } : { contentList: [], hasMore: false })) as typeof fetch);
    const feed = await (await app.request("/api/news")).json();
    expect(feed).toMatchObject({ items: [], partial: false });
  });
});
