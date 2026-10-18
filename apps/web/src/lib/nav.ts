import { localizePath, type Locale } from "@/lib/i18n";

export interface NavLink {
  href: string;
  label: string;
}

/** Barre du jeu AION 2 (équivalent de la barre « Home / Getting Started / Build Guides… » de la référence). */
export const MAIN_NAV: NavLink[] = [
  { href: "/", label: "Accueil" },
  { href: "/actualites/", label: "Actualités" },
  { href: "/guides/bien-demarrer/", label: "Bien démarrer" },
  { href: "/guides/", label: "Guides" },
  { href: "/classes/", label: "Tier list" },
  { href: "/guides/farm-kinah/", label: "Kinah" },
  { href: "/serveurs/", label: "Serveurs" },
  { href: "/guides/annuaire-ressources/", label: "Ressources" },
];

const EN_NAV: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/actualites/", label: "News" },
  { href: "/guides/bien-demarrer/", label: "Getting started" },
  { href: "/guides/", label: "Guides" },
  { href: "/classes/", label: "Tier list" },
  { href: "/guides/farm-kinah/", label: "Kinah" },
  { href: "/serveurs/", label: "Servers" },
  { href: "/guides/annuaire-ressources/", label: "Resources" },
];

export function getMainNav(locale: Locale = "en"): NavLink[] {
  return (locale === "fr" ? MAIN_NAV : EN_NAV).map((link) => ({
    ...link,
    href: localizePath(link.href, locale),
  }));
}

export const isActive = (href: string, current: string) =>
  href === "/" ? current === "/" : current === href.split("#")[0];
