/** English is the default; French pages live under /fr/. */
export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function getLocale(pathname: string): Locale {
  return /^\/fr(?:\/|$)/.test(pathname) ? "fr" : "en";
}

/** Localize site page URLs, leaving assets, API calls and external URLs intact. */
export function localizePath(path: string, locale: Locale): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const match = /^([^?#]*)(.*)$/.exec(path)!;
  const pathname = match[1]!.replace(/^\/fr(?=\/|$)/, "") || "/";
  if (/^\/(?:api|assets|images)(?:\/|$)/.test(pathname) || /\.[a-z0-9]+$/i.test(pathname)) return path;
  return (locale === "fr" ? `/fr${pathname === "/" ? "/" : pathname}` : pathname) + match[2];
}

export function ui(locale: Locale, english: string, french: string): string {
  return locale === "fr" ? french : english;
}

export const dateLocale = (locale: Locale) => locale === "fr" ? "fr-FR" : "en-GB";

export const categoryLabels = {
  en: { actu: "News", "bien-demarrer": "Getting started", classes: "Classes and progression", kinah: "Kinah and economy", ressources: "Resources" },
  fr: { actu: "Actualités", "bien-demarrer": "Bien démarrer", classes: "Classes et progression", kinah: "Kinah et économie", ressources: "Ressources" },
} as const;
