import { describe, expect, it, vi } from "vitest";
import { createPlayersApi } from "./players.ts";

describe("Steam player count", () => {
  it("shares concurrent requests, caches for a minute, then refreshes", async () => {
    let now = 1_000_000;
    const request = vi.fn(async () => Response.json({ response: { result: 1, player_count: 246723 } }));
    const app = createPlayersApi(request as typeof fetch, () => now);
    const [first, parallel] = await Promise.all([app.request("/api/players/"), app.request("/api/players")]);
    expect(await first.json()).toEqual({ players: 246723, source: "steam", retrievedAt: new Date(now).toISOString() });
    expect(parallel.status).toBe(200);
    expect(request).toHaveBeenCalledTimes(1);
    expect(first.headers.get("cache-control")).toBe("no-store");
    now += 59_999;
    await app.request("/api/players");
    expect(request).toHaveBeenCalledTimes(1);
    now += 1;
    await app.request("/api/players");
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("accepts a real zero but rejects malformed or unsuccessful responses", async () => {
    for (const body of [null, {}, { response: { result: 42, player_count: 0 } }, { response: { result: 1, player_count: "123" } }, { response: { result: 1, player_count: -1 } }]) {
      const app = createPlayersApi((async () => Response.json(body)) as typeof fetch);
      expect((await app.request("/api/players")).status).toBe(503);
    }
    const app = createPlayersApi((async () => Response.json({ response: { result: 1, player_count: 0 } })) as typeof fetch);
    expect((await (await app.request("/api/players")).json()).players).toBe(0);
  });

  it("reports upstream failures without returning a stale count as current, and recovers", async () => {
    let now = 1_000_000;
    let fail = false;
    const request = vi.fn(async () => {
      if (fail) throw new Error("network unavailable");
      return Response.json({ response: { result: 1, player_count: 123 } });
    });
    const app = createPlayersApi(request as typeof fetch, () => now);
    expect((await app.request("/api/players")).status).toBe(200);
    now += 60_000;
    fail = true;
    const response = await app.request("/api/players");
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).not.toHaveProperty("players");
    fail = false;
    expect((await app.request("/api/players")).status).toBe(200);
  });
});
