import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const here = fileURLToPath(new URL(".", import.meta.url));
// src/ (dev) et dist/ (prod) sont tous deux à apps/server/<x>/ : la racine du repo est 3 niveaux au-dessus.
const repoRoot = resolve(here, "../../..");

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SITE_URL: z.string().url().regex(/^https?:\/\//).optional(),
  VOTES_REDIS_URL: z.string().url().regex(/^rediss?:\/\//).optional(),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  CORS_ORIGINS: z
    .string()
    .default("")
    .transform((s) => s.split(",").map((o) => o.trim()).filter(Boolean)),
  GUIDES_DB: z.string().default("packages/content/guides.sqlite").transform((value) => resolve(repoRoot, value)),
  WEB_DIST_DIR: z.string().default(resolve(repoRoot, "apps/web/dist")),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(source?: NodeJS.ProcessEnv): Env {
  // Load the root file for self-hosted Node processes started from a workspace.
  // Explicit sources keep tests isolated; exported variables always take priority.
  const envFile = resolve(repoRoot, ".env");
  const values = source ?? {
    ...(existsSync(envFile) ? parseEnv(readFileSync(envFile, "utf8")) : {}),
    ...process.env,
  };
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    // Échec au démarrage plutôt qu'en pleine requête.
    throw new Error(`Configuration invalide :\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}
