import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const here = fileURLToPath(new URL(".", import.meta.url));
// src/ (dev) et dist/ (prod) sont tous deux à apps/server/<x>/ : la racine du repo est 3 niveaux au-dessus.
const repoRoot = resolve(here, "../../..");

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  CORS_ORIGINS: z
    .string()
    .default("")
    .transform((s) => s.split(",").map((o) => o.trim()).filter(Boolean)),
  CONTENT_DIR: z.string().default(resolve(repoRoot, "packages/content/guides")),
  WEB_DIST_DIR: z.string().default(resolve(repoRoot, "apps/web/dist")),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    // Échec au démarrage plutôt qu'en pleine requête.
    throw new Error(`Configuration invalide :\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}
