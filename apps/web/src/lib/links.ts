/**
 * Résout un chemin interne ("/aion2/guides/x/") côté client.
 * <html data-root data-index> vaut "/" et "" en prod ; l'export d'aperçu les réécrit en chemins relatifs.
 */
export function resolveHref(path: string): string {
  if (typeof document === "undefined") return path;
  const root = document.documentElement.dataset.root ?? "/";
  const index = document.documentElement.dataset.index ?? "";
  const [p = "", query = ""] = path.replace(/^\//, "").split("?");
  return root + p + (p === "" || p.endsWith("/") ? index : "") + (query ? `?${query}` : "");
}
