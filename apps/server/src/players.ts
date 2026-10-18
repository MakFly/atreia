import { Hono } from "hono";

export const STEAM_PLAYERS_URL = "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=3393110";
const CACHE_MS = 60_000;
type Sample = { players: number; retrievedAt: string; source: "steam" };

/** Steam-only concurrency. Its upstream cache may outlive our polling interval. */
export function createPlayersApi(request: typeof fetch = fetch, now = Date.now) {
  let cached: Sample | undefined;
  let expires = 0;
  let pending: Promise<Sample> | undefined;

  async function sample(): Promise<Sample> {
    if (cached && now() < expires) return cached;
    if (pending) return pending;
    pending = (async () => {
      const response = await request(STEAM_PLAYERS_URL, { signal: AbortSignal.timeout(5_000) });
      if (!response.ok) throw new Error("Steam unavailable");
      const data = await response.json() as { response?: { result?: unknown; player_count?: unknown } } | null;
      const count = data?.response?.player_count;
      if (data?.response?.result !== 1 || typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) {
        throw new Error("Invalid Steam count");
      }
      cached = { players: count, retrievedAt: new Date(now()).toISOString(), source: "steam" };
      expires = now() + CACHE_MS;
      return cached;
    })();
    try { return await pending; }
    finally { pending = undefined; }
  }

  const api = new Hono({ strict: false });
  api.get("/api/players", async (c) => {
    try {
      const result = await sample();
      // The in-process cache owns freshness; browsers revalidate on each poll.
      c.header("Cache-Control", "no-store");
      return c.json(result);
    } catch {
      c.header("Cache-Control", "no-store");
      return c.json({ error: "Player count unavailable" }, 503);
    }
  });
  return api;
}
