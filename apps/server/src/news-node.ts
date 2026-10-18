import { getRequestListener } from "@hono/node-server";
import { createNewsApi } from "./news.ts";

const app = createNewsApi();
export default getRequestListener((request) => app.fetch(request));
