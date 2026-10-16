// @ts-check
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import rehypeImages from "./src/lib/rehype-images.ts";

export default defineConfig({
  // URL publique : utilisée pour le sitemap et les URLs canoniques.
  site: process.env.SITE_URL ?? "http://localhost:4321",
  output: "static",
  trailingSlash: "always",
  build: { assets: "assets" },
  // Le site était un portail sous /aion2/ : les anciennes URL renvoient vers la racine.
  // En prod, Hono répond en 301 ; ces pages ne servent que pour un hébergement statique seul.
  redirects: {
    "/aion2": "/",
    "/aion2/guides": "/guides/",
    "/aion2/guides/[slug]": "/guides/[slug]",
    "/aion2/classes": "/classes/",
    "/aion2/serveurs": "/serveurs/",
  },
  integrations: [react(), sitemap({ filter: (page) => !new URL(page).pathname.startsWith("/aion2/") })],
  
  markdown: { rehypePlugins: [rehypeImages] },
  vite: { plugins: [tailwindcss()] },
});
