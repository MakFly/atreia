import { EU_SERVERS, toMeta } from "@aion2/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { etag } from "hono/etag";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import type { GuideStore } from "@aion2/content";
import type { Env } from "./env.ts";
import { createVotesApi, type VoteStore } from "./votes.ts";
import type { Logger } from "./logger.ts";
import { createNewsApi } from "./news.ts";
import { createPlayersApi } from "./players.ts";

type AppEnv = { Variables: { requestId: string } };

export function createApi(deps: { env: Env; log: Logger; guides: GuideStore; voteStore?: VoteStore }) {
  const { env, log, guides } = deps;
  const api = new Hono<AppEnv>({ strict: false });

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
  api.route("/", createPlayersApi());
  api.route("/", createNewsApi());
  // Mount before guide cache middleware: voting responses are always private.
  api.route("/", createVotesApi(() => deps.voteStore, {
    publicOrigin: env.NODE_ENV === "production" ? env.SITE_URL : undefined,
  }));
  api.use("/api/*", cors({ origin: env.CORS_ORIGINS, allowMethods: ["GET"] }));
  api.use("/api/*", etag());
  api.use("/api/*", async (c, next) => {
    await next();
    if (c.res.ok) c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  });

  // Ancien préfixe du portail multi-jeux : redirection permanente vers la racine, query string conservée.
  // Les barres obliques de tête sont fusionnées : "/aion2//x.com" ne doit pas devenir une URL externe.
  api.get("/aion2/*", (c) => {
    const url = new URL(c.req.url);
    const path = `/${url.pathname.replace(/^\/aion2\/*/, "")}`;
    return c.redirect(`${path}${url.search}`, 301);
  });
  api.get("/aion2", (c) => c.redirect("/", 301));

  // Liveness : le process répond. Readiness : le contenu est chargé.
  api.get("/health", (c) => c.json({ status: "ok" }));
  api.get("/ready", (c) =>
    guides.size > 0 ? c.json({ status: "ready", guides: guides.size }) : c.json({ status: "empty" }, 503),
  );

  api.use("/api/*", async (c, next) => {
    const language = c.req.query("lang");
    if (language && language !== "en" && language !== "fr") {
      return c.json({ error: "Unsupported language. Use en or fr." }, 400);
    }
    c.header("Content-Language", language === "fr" ? "fr" : "en");
    await next();
  });

  api.get("/api/guides", (c) => {
    const category = c.req.query("category");
    const locale = c.req.query("lang") === "fr" ? "fr" : "en";
    const items = guides.load(locale)
      .filter((guide) => !category || guide.category === category)
      .map((guide) => ({ ...toMeta(guide), toc: guide.toc }));
    return c.json({ items, total: items.length });
  });

  api.get("/api/guides/:slug{[a-z0-9-]{1,80}}", (c) => {
    const guide = guides.get(c.req.param("slug"), c.req.query("lang") === "fr" ? "fr" : "en");
    return guide ? c.json(guide) : c.json({ error: c.req.query("lang") === "fr" ? "Guide introuvable" : "Guide not found" }, 404);
  });

  api.get("/api/servers", (c) => c.json(c.req.query("lang") === "fr" ? EU_SERVERS : {
    ...EU_SERVERS, note: "MetaBot lists 46 EU servers as of 16 October 2026: a second wave has opened since this snapshot.",
  }));

  api.notFound((c) => c.json({ error: c.req.query("lang") === "fr" ? "Route inconnue" : "Unknown route" }, 404));
  api.onError((err, c) => {
    log.error("unhandled", { requestId: c.get("requestId"), err: err.message, stack: err.stack });
    return c.json({ error: c.req.query("lang") === "fr" ? "Erreur interne" : "Internal error", requestId: c.get("requestId") }, 500);
  });

  return api;
}
