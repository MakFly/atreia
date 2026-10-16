export interface NavLink {
  href: string;
  label: string;
}

/** Barre du jeu AION 2 (équivalent de la barre « Home / Getting Started / Build Guides… » de la référence). */
export const MAIN_NAV: NavLink[] = [
  { href: "/", label: "Accueil" },
  { href: "/guides/bien-demarrer/", label: "Bien démarrer" },
  { href: "/guides/", label: "Guides" },
  { href: "/classes/", label: "Tier list" },
  { href: "/guides/farm-kinah/", label: "Kinah" },
  { href: "/serveurs/", label: "Serveurs" },
  { href: "/guides/annuaire-ressources/", label: "Ressources" },
];

export const isActive = (href: string, current: string) =>
  href === "/" ? current === "/" : current === href.split("#")[0];
