/** Same-process hook. The Hono server registers its fetch here so Astro SSR
 * calls the guide API without opening SQLite or a socket to itself. */
export const GUIDE_API_FETCH = "__atreiaGuideApiFetch";

export type GuideApiFetch = (request: Request) => Response | Promise<Response>;

export function readGuideApiFetch(): GuideApiFetch | undefined {
  const value = (globalThis as Record<string, unknown>)[GUIDE_API_FETCH];
  return typeof value === "function" ? (value as GuideApiFetch) : undefined;
}

export function writeGuideApiFetch(fetchImpl: GuideApiFetch): void {
  (globalThis as Record<string, unknown>)[GUIDE_API_FETCH] = fetchImpl;
}
