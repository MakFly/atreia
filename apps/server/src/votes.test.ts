import { Hono } from "hono";
import { createApi } from "./app.ts";
import { loadEnv } from "./env.ts";
import { createLogger } from "./logger.ts";
import { describe, expect, it, vi } from "vitest";
import { classVoteRevision } from "@aion2/shared/browser";
import { createVotesApi, type VoteStore } from "./votes.ts";

const url = `http://localhost/api/class-votes/?class=gladiateur&revision=${classVoteRevision("gladiateur")}`;
const result = { agree: 2, disagree: 1, choice: "agree" as const };
function setup() {
  const store: VoteStore = { read: vi.fn().mockResolvedValue(result), cast: vi.fn().mockResolvedValue(result) };
  return { store, app: createVotesApi(() => store) };
}
const post = (body: string, origin = "http://localhost") => ({ method: "POST", headers: { origin, "content-type": "application/json", cookie: "atreia-voter=12345678-1234-1234-1234-123456789abc" }, body });

describe("Votes des classes", () => {
  it("lit les résultats privés sans cache et attribue un cookie de navigateur", async () => {
    const { app, store } = setup();
    const response = await app.request(url);
    expect(await response.json()).toEqual(result);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=Strict");
    expect(store.read).toHaveBeenCalledOnce();
  });

  it("transmet un avis valide avec le même identifiant et la révision courante", async () => {
    const { app, store } = setup();
    expect((await app.request(url, post('{"choice":"disagree"}'))).status).toBe(200);
    expect(store.cast).toHaveBeenCalledWith(expect.stringContaining(classVoteRevision("gladiateur")), "12345678-1234-1234-1234-123456789abc", "disagree");
  });

  it("refuse les origines étrangères, avis invalides, corps trop longs et anciennes révisions", async () => {
    const { app, store } = setup();
    expect((await app.request(url, post('{"choice":"agree"}', "https://other.example"))).status).toBe(403);
    expect((await app.request(url, post('{"choice":"unknown"}'))).status).toBe(400);
    expect((await app.request(url, post("{"))).status).toBe(400);
    expect((await app.request(url, post(" ".repeat(1025)))).status).toBe(413);
    expect((await app.request(url.replace("revision=", "revision=old-"), post('{"choice":"agree"}'))).status).toBe(409);
    expect(store.cast).not.toHaveBeenCalled();
  });

  it("renvoie une indisponibilité explicite sans simuler des votes", async () => {
    expect((await createVotesApi(() => undefined).request(url)).status).toBe(503);
    const { app, store } = setup();
    vi.mocked(store.read).mockRejectedValue(new Error("offline"));
    expect((await app.request(url)).status).toBe(503);
  });
});


describe("Votes montés dans le serveur Hono", () => {
  function mounted(site?: string) {
    const store: VoteStore = { read: vi.fn().mockResolvedValue(result), cast: vi.fn().mockResolvedValue(result) };
    const app = new Hono({ strict: false });
    app.route("/", createApi({
      env: loadEnv({ NODE_ENV: site ? "production" : "test", SITE_URL: site }),
      log: createLogger("error"),
      guides: { size: 0, list: () => [], load: () => [], get: () => undefined, close: () => {} },
      voteStore: store,
    }));
    return { app, store };
  }

  it("sert les deux formes de route sans cache public ni ETag", async () => {
    const { app } = mounted();
    for (const target of [url, url.replace("class-votes/", "class-votes")]) {
      const response = await app.request(target);
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(response.headers.get("etag")).toBeNull();
    }
    const response = await app.request(url, post('{"choice":"agree"}'));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("valide l’origine HTTPS publique derrière un reverse proxy HTTP", async () => {
    const { app, store } = mounted("https://atreia.example");
    const response = await app.request(url, post('{"choice":"agree"}', "https://atreia.example"));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Secure");
    expect((await app.request(url, post('{"choice":"disagree"}'))).status).toBe(403);
    expect(store.cast).toHaveBeenCalledOnce();
  });
});
