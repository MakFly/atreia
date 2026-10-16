export interface NavLink {
  href: string;
  label: string;
}

/** Barre du jeu AION 2 (équivalent de la barre « Home / Getting Started / Build Guides… » de la référence). */
export const MAIN_NAV: NavLink[] = [
  { href: "/aion2/", label: "Accueil" },
  { href: "/aion2/guides/bien-demarrer/", label: "Bien démarrer" },
  { href: "/aion2/guides/", label: "Guides" },
  { href: "/aion2/classes/", label: "Tier list" },
  { href: "/aion2/guides/farm-kinah/", label: "Kinah" },
  { href: "/aion2/serveurs/", label: "Serveurs" },
  { href: "/aion2/guides/annuaire-ressources/", label: "Ressources" },
];

export const isActive = (href: string, current: string) =>
  href === "/" ? current === "/" : current === href.split("#")[0];
