import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { serveStatic } from "@hono/node-server/serve-static";
import type { Hono } from "hono";
import type { Logger } from "./logger.ts";

// Secours : un dist statique sans entrée serveur. En prod, mountAstro prend le relais.
export function mountWeb(app: Hono, { distDir, log }: { distDir: string; log: Logger }) {
  if (existsSync(distDir)) {
    const root = relative(process.cwd(), distDir);
    const notFoundPage = join(distDir, "404.html");
    app.use("/assets/*", async (c, next) => {
      await next();
      if (c.res.ok) c.header("Cache-Control", "public, max-age=31536000, immutable");
    });
    app.use("/images/*", async (c, next) => {
      await next();
      if (c.res.ok) c.header("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
    });
    // "/guides/x/" est servi depuis guides/x/index.html.
    app.use("*", serveStatic({ root }));
    app.notFound(async (c) => {
      const french = /^\/fr(?:\/|$)/.test(c.req.path);
      const localizedPage = [join(distDir, "fr/404.html"), join(distDir, "fr/404/index.html")].find(existsSync);
      const page = french && localizedPage ? localizedPage : notFoundPage;
      c.header("Content-Language", french ? "fr" : "en");
      return existsSync(page) ? c.html(await readFile(page, "utf8"), 404) : c.text(french ? "Page introuvable" : "Page not found", 404);
    });
  } else {
    log.warn("web dist absent, API seule", { dir: distDir });
  }
}
