export const GRADES = ["S", "A", "B", "C"] as const;
export type Grade = (typeof GRADES)[number];

export type Role = "tank" | "dps-melee" | "dps-distance" | "soin" | "soutien";

export const ROLES: Record<Role, string> = {
  tank: "Tank",
  "dps-melee": "DPS mêlée",
  "dps-distance": "DPS distance",
  soin: "Soins",
  soutien: "Soutien",
};

export interface ClassInfo {
  name: string;
  role: Role;
  weapon: string;
  pitch: string;
  /** Notes sourcées uniquement ; absentes tant qu'on n'a pas de source fiable pour le global */
  grades?: { pve: Grade; pvp: Grade; farm: Grade; debutant: Grade } | undefined;
  gradesSource?: { name: string; url: string; asOf: string } | undefined;
  guide?: string | undefined;
}

/** Les 8 classes d'AION 2. Noms FR à vérifier sur le client global. */
export const CLASSES = {
  gladiateur: { name: "Gladiateur", role: "dps-melee", weapon: "Arme à deux mains", pitch: "Combattant de zone robuste, à l'aise au contact de plusieurs cibles." },
  templier: { name: "Templier", role: "tank", weapon: "Épée et bouclier", pitch: "Le tank de référence : il encaisse et garde l'attention des boss." },
  assassin: {
    name: "Assassin",
    role: "dps-melee",
    weapon: "Deux dagues",
    pitch: "Gros burst mono-cible depuis le dos de la cible, mais peu d'AoE.",
    grades: { pve: "S", pvp: "S", farm: "B", debutant: "A" },
    gradesSource: { name: "Aion 2 Meta", url: "https://aion2-meta.com/guides/assassin/", asOf: "2026-10-12" },
    guide: "rush-assassin-clerc",
  },
  rodeur: { name: "Rôdeur", role: "dps-distance", weapon: "Arc", pitch: "DPS à distance mobile, avec contrôles et pièges." },
  sorcier: { name: "Sorcier", role: "dps-distance", weapon: "Grimoire", pitch: "Dégâts magiques élevés à distance, fragile au contact." },
  spiritualiste: { name: "Spiritualiste", role: "dps-distance", weapon: "Orbe", pitch: "Invoque des esprits et use ses cibles avec des effets dans la durée." },
  clerc: {
    name: "Clerc",
    role: "soin",
    weapon: "Masse",
    pitch: "Le healer principal : soins de groupe, boucliers et résurrection.",
    guide: "rush-assassin-clerc",
  },
  chantre: { name: "Chantre", role: "soutien", weapon: "Bâton", pitch: "Support hybride : buffs de groupe et soins d'appoint." },
} as const satisfies Record<string, ClassInfo>;

export type ClassKey = keyof typeof CLASSES;
export const CLASS_KEYS = Object.keys(CLASSES) as [ClassKey, ...ClassKey[]];
