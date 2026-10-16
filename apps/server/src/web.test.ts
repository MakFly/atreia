import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { createLogger } from "./logger.ts";
import { mountWeb } from "./web.ts";

describe("Site statique", () => {
  it("sert les pages et applique le cache propre aux assets et aux images", async () => {
    const distDir = await mkdtemp(join(process.cwd(), ".web-test-"));
    try {
      await mkdir(join(distDir, "assets"));
      await mkdir(join(distDir, "images"));
      await writeFile(join(distDir, "assets/x.js"), "console.log(1);");
      await writeFile(join(distDir, "images/a.jpg"), "image");
      await writeFile(join(distDir, "index.html"), "<h1>Atreia</h1>");
      await writeFile(join(distDir, "404.html"), "<h1>Page introuvable</h1>");
      const app = new Hono();
      mountWeb(app, { distDir, log: createLogger("error") });

      const asset = await app.request("/assets/x.js");
      expect(asset.status).toBe(200);
      expect(asset.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
      expect(await asset.text()).toBe("console.log(1);");

      const image = await app.request("/images/a.jpg");
      expect(image.status).toBe(200);
      expect(image.headers.get("Cache-Control")).toBe("public, max-age=604800, stale-while-revalidate=86400");
      expect(await image.text()).toBe("image");

      const index = await app.request("/");
      expect(index.status).toBe(200);
      expect(await index.text()).toBe("<h1>Atreia</h1>");

      const missing = await app.request("/inconnu");
      expect(missing.status).toBe(404);
      expect(await missing.text()).toBe("<h1>Page introuvable</h1>");
    } finally {
      await rm(distDir, { recursive: true, force: true });
    }
  });
});
