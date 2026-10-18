import { getRequestListener } from "@hono/node-server";
import { createPlayersApi } from "../server/src/players.ts";

/** Reuse the production handler inside the existing Astro development server. */
export default function playersDev() {
  return {
    name: "atreia-players-dev",
    apply: "serve",
    configureServer(server) {
      const app = createPlayersApi();
      const listener = getRequestListener((request) => app.fetch(request));
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0]?.replace(/\/$/, "") === "/api/players") {
          void listener(req, res);
        } else next();
      });
    },
  };
}
