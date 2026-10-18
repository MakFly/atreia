import { getRequestListener } from "@hono/node-server";
import { createNewsApi } from "../server/src/news.ts";

/** Reuse the production handler inside the existing Astro development server. */
export default function newsDev() {
  return {
    name: "atreia-news-dev",
    apply: "serve",
    configureServer(server) {
      const app = createNewsApi();
      const listener = getRequestListener((request) => app.fetch(request));
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0]?.replace(/\/$/, "") === "/api/news") {
          void listener(req, res);
        } else next();
      });
    },
  };
}
