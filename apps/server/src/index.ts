import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createApi } from "./app.ts";
import { openGuideStore } from "@aion2/content";
import { writeGuideApiFetch } from "@aion2/shared";
import { loadEnv } from "./env.ts";
import { createLogger } from "./logger.ts";
import { redisVoteStore } from "./votes.ts";
import { mountAstro } from "./astro.ts";
import { mountWeb } from "./web.ts";

const env = loadEnv();
const log = createLogger(env.LOG_LEVEL);
process.env.GUIDES_DB = env.GUIDES_DB;
const guides = openGuideStore(env.GUIDES_DB);

const voteStore = env.VOTES_REDIS_URL ? redisVoteStore(env.VOTES_REDIS_URL) : undefined;
const app = new Hono({ strict: false });
app.route("/", createApi({ env, log, guides, voteStore }));
// Une route API inconnue ne doit jamais tomber sur le fallback SPA.
app.all("/api/*", (c) => c.json({ error: c.req.query("lang") === "fr" ? "Route inconnue" : "Unknown route" }, 404));

// Le rendu Astro relit les guides par cette API, sans deuxième connexion SQLite.
writeGuideApiFetch((request) => app.fetch(request));

if (!(await mountAstro(app, env.WEB_DIST_DIR, log))) mountWeb(app, { distDir: env.WEB_DIST_DIR, log });

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) =>
  log.info("listening", { port: info.port, guides: guides.size, env: env.NODE_ENV }),
);

// Close HTTP and Redis connections on service shutdown.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    log.info("shutdown", { signal });
    server.close(() => {
      guides.close();
      voteStore?.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
