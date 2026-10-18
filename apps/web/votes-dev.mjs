import { fileURLToPath } from "node:url";
import { getRequestListener } from "@hono/node-server";
import { loadEnv } from "vite";
import { createVotesApi, redisVoteStore } from "../server/src/votes.ts";
import { loadEnv as validateEnv } from "../server/src/env.ts";

/** Serve the same vote handler locally as the Hono server, without another server. */
export default function votesDev() {
  return {
    name: "atreia-votes-dev",
    apply: "serve",
    configureServer(server) {
      const envDir = fileURLToPath(new URL("../../", import.meta.url));
      const vars = loadEnv(server.config.mode, envDir, "VOTES_");
      const { VOTES_REDIS_URL } = validateEnv({ ...vars, ...process.env });
      let store;
      const app = createVotesApi(() => {
        if (!VOTES_REDIS_URL) return undefined;
        return store ??= redisVoteStore(VOTES_REDIS_URL);
      });
      const listener = getRequestListener((request) => app.fetch(request));
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0]?.replace(/\/$/, "") === "/api/class-votes") {
          void listener(req, res);
        } else next();
      });
      server.httpServer?.once("close", () => store?.close());
    },
  };
}
