/** Public, text-only contract for the official Global AION 2 feed. */
export const NEWS_TOPICS = ["patch", "event", "pass", "shop", "maintenance", "notice"] as const;
export type NewsTopic = typeof NEWS_TOPICS[number];
export type NewsSourceId = "announcements" | "updates" | "events";
export interface OfficialNewsItem {
  id: string;
  title: string;
  url: string;
  date: string;
  updatedAt?: string;
  endsAt?: string;
  source: NewsSourceId;
  topics: NewsTopic[];
}
export interface OfficialNewsFeed {
  items: OfficialNewsItem[];
  checkedAt: string;
  partial: boolean;
  sources: {
    id: NewsSourceId;
    url: string;
    state: "live" | "stale" | "unavailable";
    syncedAt: string | null;
  }[];
}
