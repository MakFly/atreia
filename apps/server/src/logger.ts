import type { Env } from "./env.ts";

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof LEVELS;

export type Logger = Record<Level, (msg: string, fields?: Record<string, unknown>) => void>;

/** Logs JSON sur stdout (une ligne par événement), prêts pour Loki / Cloud Logging. */
export function createLogger(minLevel: Env["LOG_LEVEL"]): Logger {
  const write = (level: Level) => (msg: string, fields: Record<string, unknown> = {}) => {
    if (LEVELS[level] < LEVELS[minLevel]) return;
    const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...fields });
    (level === "error" ? process.stderr : process.stdout).write(line + "\n");
  };
  return { debug: write("debug"), info: write("info"), warn: write("warn"), error: write("error") };
}
