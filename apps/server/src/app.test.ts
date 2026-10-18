import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { createApi } from "./app.ts";
import { openGuideStore } from "@aion2/content";
import { loadEnv } from "./env.ts";
import { createLogger } from "./logger.ts";

const env = loadEnv({ NODE_ENV: "test", LOG_LEVEL: "error" });
const guides = openGuideStore(fileURLToPath(new URL("../../../packages/content/guides.sqlite", import.meta.url)));
const app = createApi({ env, log: createLogger("error"), guides });

describe("API", () => {
  it("expose health et ready", async () => {
    expect((await app.request("/health")).status).toBe(200);
    expect((await app.request("/ready")).status).toBe(200);
  });

  it("liste les guides et filtre par catégorie", async () => {
    const all = (await (await app.request("/api/guides")).json()) as {
      total: number;
      items: { slug: string; toc: { depth: number; text: string }[] }[];
    };
    const actu = (await (await app.request("/api/guides?category=actu")).json()) as {
      items: { category: string }[];
    };
    const started = all.items.find((guide) => guide.slug === "bien-demarrer");
    expect(all.total).toBeGreaterThan(0);
    expect(actu.items.every((g) => g.category === "actu")).toBe(true);
    expect(started?.toc.length).toBeGreaterThan(0);
    expect(started?.toc.every((entry) => entry.text.length > 0 && (entry.depth === 2 || entry.depth === 3))).toBe(true);
  });

  it("relit le catalogue en appelant l'API du même processus", async () => {
    const site = new Hono();
    site.get("/page", async (c) => {
      const inner = await app.fetch(new Request("http://atreia.internal/api/guides?lang=fr"));
      const body = await inner.json() as { total: number };
      return c.json({ total: body.total });
    });
    const page = await site.request("/page");
    expect(page.status).toBe(200);
    expect(((await page.json()) as { total: number }).total).toBeGreaterThan(0);
  });

  it("renvoie 404 sur un slug inconnu ou invalide", async () => {
    expect((await app.request("/api/guides/inconnu")).status).toBe(404);
    expect((await app.request("/api/guides/..%2Fetc")).status).toBe(404);
  });

  it("redirige l'ancien préfixe /aion2 vers la racine en 301, sans sortir du site", async () => {
    const at = async (path: string) => (await app.request(path)).headers.get("location");
    expect((await app.request("/aion2/guides/farm-kinah/")).status).toBe(301);
    expect(await at("/aion2/guides/farm-kinah/?ref=x")).toBe("/guides/farm-kinah/?ref=x");
    expect(await at("/aion2")).toBe("/");
    expect(await at("/aion2/")).toBe("/");
    expect(await at("/aion2//evil.example/")).toBe("/evil.example/");
  });
});

describe("EN/FR content", () => {
  it("defaults to English and exposes the matching French guide explicitly", async () => {
    const request = async (path: string) => {
      const response = await app.request(path);
      return { response, body: await response.json() as { title: string; slug: string; body: string } };
    };
    const en = await request("/api/guides/bien-demarrer");
    const fr = await request("/api/guides/bien-demarrer?lang=fr");
    expect(en.response.headers.get("Content-Language")).toBe("en");
    expect(fr.response.headers.get("Content-Language")).toBe("fr");
    expect(en.body.slug).toBe(fr.body.slug);
    expect(en.body.title).not.toBe(fr.body.title);
    expect(en.body.body).not.toBe(fr.body.body);
  });

  it("exposes the same complete catalogue in each language and rejects unsupported languages", async () => {
    const en = await (await app.request("/api/guides")).json() as { items: { slug: string }[] };
    const fr = await (await app.request("/api/guides?lang=fr")).json() as { items: { slug: string }[] };
    expect(en.items.map((g) => g.slug).sort()).toEqual(fr.items.map((g) => g.slug).sort());
    expect((await app.request("/api/guides?lang=de")).status).toBe(400);
  });
});
