import { describe, expect, it } from "vitest";
import { callNodeHandler } from "./astro.ts";

describe("handler Astro", () => {
  it("renvoie le corps et les en-têtes écrits par le middleware", async () => {
    const response = await callNodeHandler((req, res) => {
      expect(req.url).toBe("/guides/bien-demarrer/?lang=fr");
      res.setHeader("content-language", "fr");
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.write("<p>");
      res.end("ok</p>");
    }, new Request("http://127.0.0.1:8787/guides/bien-demarrer/?lang=fr"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(response.headers.get("content-language")).toBe("fr");
    expect(await response.text()).toBe("<p>ok</p>");
  });

  it("répond 404 quand le middleware passe la main", async () => {
    const response = await callNodeHandler((_req, _res, next) => {
      next?.();
    }, new Request("http://127.0.0.1:8787/inconnu"));
    expect(response.status).toBe(404);
  });
});
