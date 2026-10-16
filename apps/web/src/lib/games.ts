/** Jeux couverts par le portail. Chaque jeu est une section sous /<slug>/. */
export interface Game {
  slug: string;
  name: string;
  tagline: string;
  href: string;
}

export const GAMES: readonly Game[] = [
  {
    slug: "aion2",
    name: "AION 2",
    tagline: "Guides, classes, serveurs EU et farm de Kinah.",
    href: "/aion2/",
  },
];
