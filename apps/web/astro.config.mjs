// @ts-check
import { unified } from "@astrojs/markdown-remark";
import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import votesDev from "./votes-dev.mjs";
import playersDev from "./players-dev.mjs";
import newsDev from "./news-dev.mjs";
import rehypeImages from "./src/lib/rehype-images.ts";

// Astro 7 charge un objet de configuration sans lui transmettre la commande.
const isBuild = process.argv.slice(2).includes("build");
const site = process.env.SITE_URL?.trim();
if (isBuild) {
  let valid = false;
  try {
    const url = new URL(site ?? "");
    valid = /^https?:\/\//i.test(site ?? "") && Boolean(url.hostname);
  } catch {
    // Une URL relative ou absente ne convient pas aux liens publics.
  }
  if (!valid) {
    throw new Error(
      "SITE_URL est obligatoire pour astro build et doit être une URL absolue HTTP(S), par exemple https://atreia.fr.",
    );
  }
}

export default defineConfig({
  // URL publique : utilisée pour le sitemap et les URLs canoniques.
  site: site || "http://localhost:4321",
  output: "server",
  adapter: node({ mode: "middleware" }),
  session: false,
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
  integrations: [react()],
  markdown: { processor: unified({ rehypePlugins: [rehypeImages] }) },
  vite: {
    plugins: [tailwindcss(), votesDev(), playersDev(), newsDev()],
    ssr: { noExternal: [/@aion2\//] },
    // Mermaid tire dayjs en CommonJS. Sans prébundle, l'import default casse
    // et le bloc reste du code coloré. On le force au démarrage.
    optimizeDeps: { include: ["mermaid"] },
  },
});
