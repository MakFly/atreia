import { EU_SERVERS } from "@aion2/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { etag } from "hono/etag";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import type { GuideStore } from "./content.ts";
import type { Env } from "./env.ts";
import type { Logger } from "./logger.ts";

type AppEnv = { Variables: { requestId: string } };

export function createApi(deps: { env: Env; log: Logger; guides: GuideStore }) {
  const { env, log, guides } = deps;
  const api = new Hono<AppEnv>();

  api.use(requestId());
  api.use(async (c, next) => {
    const start = performance.now();
    await next();
    log.info("request", {
      requestId: c.get("requestId"),
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Math.round(performance.now() - start),
    });
  });
  api.use(secureHeaders());
  api.use("/api/*", cors({ origin: env.CORS_ORIGINS, allowMethods: ["GET"] }));
  api.use("/api/*", etag());
  api.use("/api/*", async (c, next) => {
    await next();
    if (c.res.ok) c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  });

  // Liveness : le process répond. Readiness : le contenu est chargé.
  api.get("/health", (c) => c.json({ status: "ok" }));
  api.get("/ready", (c) =>
    guides.size > 0 ? c.json({ status: "ready", guides: guides.size }) : c.json({ status: "empty" }, 503),
  );

  api.get("/api/guides", (c) => {
    const category = c.req.query("category");
    const items = guides.list().filter((g) => !category || g.category === category);
    return c.json({ items, total: items.length });
  });

  api.get("/api/guides/:slug{[a-z0-9-]{1,80}}", (c) => {
    const guide = guides.get(c.req.param("slug"));
    return guide ? c.json(guide) : c.json({ error: "Guide introuvable" }, 404);
  });

  api.get("/api/servers", (c) => c.json(EU_SERVERS));

  api.notFound((c) => c.json({ error: "Route inconnue" }, 404));
  api.onError((err, c) => {
    log.error("unhandled", { requestId: c.get("requestId"), err: err.message, stack: err.stack });
    return c.json({ error: "Erreur interne", requestId: c.get("requestId") }, 500);
  });

  return api;
}
