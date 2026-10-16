import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { serveStatic } from "@hono/node-server/serve-static";
import type { Hono } from "hono";
import type { Logger } from "./logger.ts";

// En prod, le même process sert le site Astro (HTML statique) : une seule image, un seul port.
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
    app.notFound(async (c) =>
      existsSync(notFoundPage) ? c.html(await readFile(notFoundPage, "utf8"), 404) : c.text("Page introuvable", 404),
    );
  } else {
    log.warn("web dist absent, API seule", { dir: distDir });
  }
}
