import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { createApi } from "./app.ts";
import { loadGuides } from "./content.ts";
import { loadEnv } from "./env.ts";
import { createLogger } from "./logger.ts";

const env = loadEnv({ NODE_ENV: "test", LOG_LEVEL: "error" });
const guides = await loadGuides(fileURLToPath(new URL("../../../packages/content/guides", import.meta.url)));
const app = createApi({ env, log: createLogger("error"), guides });

describe("API", () => {
  it("expose health et ready", async () => {
    expect((await app.request("/health")).status).toBe(200);
    expect((await app.request("/ready")).status).toBe(200);
  });

  it("liste les guides et filtre par catégorie", async () => {
    const all = (await (await app.request("/api/guides")).json()) as { total: number };
    const actu = (await (await app.request("/api/guides?category=actu")).json()) as {
      items: { category: string }[];
    };
    expect(all.total).toBeGreaterThan(0);
    expect(actu.items.every((g) => g.category === "actu")).toBe(true);
  });

  it("renvoie 404 sur un slug inconnu ou invalide", async () => {
    expect((await app.request("/api/guides/inconnu")).status).toBe(404);
    expect((await app.request("/api/guides/..%2Fetc")).status).toBe(404);
  });
});
