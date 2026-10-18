import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { getCookie, setCookie } from "hono/cookie";
import { createClient } from "redis";
import { CLASS_KEYS, classVoteRevision, type ClassKey } from "@aion2/shared/browser";

export type Choice = "agree" | "disagree";
export type VoteResult = { agree: number; disagree: number; choice: Choice | null };
export interface VoteStore {
  read(key: string, voter: string): Promise<VoteResult>;
  cast(key: string, voter: string, choice: Choice): Promise<VoteResult>;
}

// Updating a previous opinion and its counters is one atomic Redis operation.
const CAST = `
local previous = redis.call('HGET', KEYS[1], ARGV[1])
if previous ~= ARGV[2] then
  if previous then redis.call('HINCRBY', KEYS[1], previous, -1) end
  redis.call('HINCRBY', KEYS[1], ARGV[2], 1)
  redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
end
return {redis.call('HGET', KEYS[1], 'agree') or '0', redis.call('HGET', KEYS[1], 'disagree') or '0', ARGV[2]}
`;

export function redisVoteStore(url: string): VoteStore & { close(): void } {
  const client = createClient({ url, socket: { connectTimeout: 2000, reconnectStrategy: false }, disableOfflineQueue: true });
  // Errors are handled by the request; never log a URL that can contain credentials.
  client.on("error", () => {});
  let pending: Promise<unknown> | undefined;
  async function connect() {
    if (client.isReady) return;
    pending ??= client.connect().finally(() => { pending = undefined; });
    await pending;
  }
  function result(values: unknown[]): VoteResult {
    const choice = values[2];
    return { agree: Number(values[0] ?? 0), disagree: Number(values[1] ?? 0), choice: choice === "agree" || choice === "disagree" ? choice : null };
  }
  return {
    async read(key, voter) {
      await connect();
      return result(await client.hmGet(key, ["agree", "disagree", `v:${voter}`]));
    },
    async cast(key, voter, choice) {
      await connect();
      // Per-browser throttle, including retries and changes of opinion.
      const rateKey = `atreia:class-votes:rate:${voter}`;
      const hits = await client.eval("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],60) end; return n", { keys: [rateKey], arguments: [] });
      if (Number(hits) > 30) throw new VoteRateLimit();
      return result(await client.eval(CAST, { keys: [key], arguments: [`v:${voter}`, choice] }) as unknown[]);
    },
    close() { if (client.isOpen) client.destroy(); },
  };
}
class VoteRateLimit extends Error {}

export function createVotesApi(getStore: () => VoteStore | undefined, options: { publicOrigin?: string } = {}) {
  const app = new Hono({ strict: false });
  app.use("*", async (c, next) => {
    c.header("Cache-Control", "private, no-store");
    c.header("Vary", "Cookie");
    await next();
  });
  app.use("*", bodyLimit({ maxSize: 1024, onError: (c) => c.json({ error: "Requête trop volumineuse" }, 413) }));
  app.all("/api/class-votes", async (c) => {
    if (c.req.method !== "GET" && c.req.method !== "POST") {
      c.header("Allow", "GET, POST");
      return c.json({ error: "Méthode non autorisée" }, 405);
    }
    const key = c.req.query("class") as ClassKey;
    if (!CLASS_KEYS.includes(key)) return c.json({ error: "Classe inconnue" }, 400);
    if (c.req.query("revision") !== classVoteRevision(key)) return c.json({ error: "Classement modifié. Recharge la page." }, 409);
    const publicOrigin = options.publicOrigin ? new URL(options.publicOrigin).origin : new URL(c.req.url).origin;
    if (c.req.method === "POST") {
      const origin = c.req.header("origin");
      if (!origin || origin !== publicOrigin) return c.json({ error: "Origine non autorisée" }, 403);
      if (!c.req.header("content-type")?.startsWith("application/json")) return c.json({ error: "Format non autorisé" }, 415);
    }
    const store = getStore();
    if (!store) return c.json({ error: "Votes indisponibles" }, 503);
    const cookie = getCookie(c, "atreia-voter");
    const voter = cookie && /^[0-9a-f-]{36}$/.test(cookie) ? cookie : randomUUID();
    setCookie(c, "atreia-voter", voter, { httpOnly: true, secure: publicOrigin.startsWith("https:"), sameSite: "Strict", path: "/", maxAge: 31536000 });
    const storageKey = `atreia:class-votes:${key}:${classVoteRevision(key)}`;
    if (c.req.method === "GET") return c.json(await store.read(storageKey, voter));
    let body: unknown;
    try { body = await c.req.json(); } catch { return c.json({ error: "JSON invalide" }, 400); }
    const choice = body && typeof body === "object" && "choice" in body ? body.choice : undefined;
    if (choice !== "agree" && choice !== "disagree") return c.json({ error: "Avis invalide" }, 400);
    return c.json(await store.cast(storageKey, voter, choice));
  });
  app.onError((error, c) => error instanceof VoteRateLimit
    ? c.json({ error: "Trop de demandes. Réessaie dans une minute." }, 429, { "Retry-After": "60" })
    : c.json({ error: "Votes temporairement indisponibles" }, 503));
  return app;
}

