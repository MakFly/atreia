import { getRequestListener } from "@hono/node-server";
import { createPlayersApi } from "./players.ts";

const app = createPlayersApi();
export default getRequestListener((request) => app.fetch(request));
