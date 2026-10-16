// @ts-check
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  // URL publique : utilisée pour le sitemap et les URLs canoniques.
  site: process.env.SITE_URL ?? "http://localhost:4321",
  output: "static",
  trailingSlash: "always",
  build: { assets: "assets" },
  integrations: [react(), mdx(), sitemap()],
  
  vite: { plugins: [tailwindcss()] },
});
