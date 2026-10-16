import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { createApi } from "./app.ts";
import { loadGuides } from "./content.ts";
import { loadEnv } from "./env.ts";
import { createLogger } from "./logger.ts";

const env = loadEnv();
const log = createLogger(env.LOG_LEVEL);
const guides = await loadGuides(env.CONTENT_DIR);

const app = new Hono();
app.route("/", createApi({ env, log, guides }));
// Une route API inconnue ne doit jamais tomber sur le fallback SPA.
app.all("/api/*", (c) => c.json({ error: "Route inconnue" }, 404));

// En prod, le même process sert le site Astro (HTML statique) : une seule image, un seul port.
if (existsSync(env.WEB_DIST_DIR)) {
  const root = relative(process.cwd(), env.WEB_DIST_DIR);
  const notFoundPage = join(env.WEB_DIST_DIR, "404.html");
  app.use(
    "/assets/*",
    serveStatic({
      root,
      onFound: (_path, c) => c.header("Cache-Control", "public, max-age=31536000, immutable"),
    }),
  );
  // "/guides/x/" est servi depuis guides/x/index.html.
  app.use("*", serveStatic({ root }));
  app.notFound(async (c) =>
    existsSync(notFoundPage) ? c.html(await readFile(notFoundPage, "utf8"), 404) : c.text("Page introuvable", 404),
  );
} else {
  log.warn("web dist absent, API seule", { dir: env.WEB_DIST_DIR });
}

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
