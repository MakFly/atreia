import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createApi } from "./app.ts";
import { loadGuides } from "./content.ts";
import { loadEnv } from "./env.ts";
import { createLogger } from "./logger.ts";
import { mountWeb } from "./web.ts";

const env = loadEnv();
const log = createLogger(env.LOG_LEVEL);
const guides = await loadGuides(env.CONTENT_DIR);

const app = new Hono();
app.route("/", createApi({ env, log, guides }));
// Une route API inconnue ne doit jamais tomber sur le fallback SPA.
app.all("/api/*", (c) => c.json({ error: "Route inconnue" }, 404));

mountWeb(app, { distDir: env.WEB_DIST_DIR, log });

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) =>
  log.info("listening", { port: info.port, guides: guides.size, env: env.NODE_ENV }),
);

// Arrêt propre pour les rolling updates (K8s envoie SIGTERM).
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    log.info("shutdown", { signal });
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
