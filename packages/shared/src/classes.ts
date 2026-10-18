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
  grades?: { pve: Grade; pvp: Grade; solo: Grade } | undefined;
  gradesSource?: { name: string; url: string; asOf: string } | undefined;
  guide?: string | undefined;
}

/** Editorial rankings of global-client kits, not measured damage rankings. */
export const CLASS_GRADES_SOURCE = {
  name: "MetaBot",
  url: "https://metabot.gg/en/aion-2/guides/best-class-tier-list",
  asOf: "2026-10-15",
};

/** Les 8 classes d'AION 2. Noms FR à vérifier sur le client global. */
export const CLASSES = {
  gladiateur: { name: "Gladiateur", role: "dps-melee", weapon: "Arme à deux mains", pitch: "Combattant de zone robuste, à l'aise au contact de plusieurs cibles.", grades: { pve: "A", pvp: "A", solo: "S" }, gradesSource: CLASS_GRADES_SOURCE, guide: "gladiateur" },
  templier: { name: "Templier", role: "tank", weapon: "Épée et bouclier", pitch: "Le tank de référence : il encaisse et garde l'attention des boss.", grades: { pve: "S", pvp: "A", solo: "A" }, gradesSource: CLASS_GRADES_SOURCE, guide: "templier" },
  assassin: {
    name: "Assassin",
    role: "dps-melee",
    weapon: "Deux dagues",
    pitch: "Gros burst mono-cible depuis le dos de la cible, mais peu d'AoE.",
    grades: { pve: "B", pvp: "S", solo: "B" },
    gradesSource: CLASS_GRADES_SOURCE,
    guide: "rush-assassin-clerc",
  },
  rodeur: { name: "Rôdeur", role: "dps-distance", weapon: "Arc", pitch: "DPS à distance mobile, avec contrôles et pièges.", grades: { pve: "A", pvp: "A", solo: "A" }, gradesSource: CLASS_GRADES_SOURCE, guide: "rodeur" },
  sorcier: { name: "Sorcier", role: "dps-distance", weapon: "Grimoire", pitch: "Dégâts magiques élevés à distance, fragile au contact.", grades: { pve: "A", pvp: "S", solo: "A" }, gradesSource: CLASS_GRADES_SOURCE, guide: "sorcier" },
  spiritualiste: { name: "Spiritualiste", role: "dps-distance", weapon: "Orbe", pitch: "Invoque des esprits et use ses cibles avec des effets dans la durée.", grades: { pve: "B", pvp: "A", solo: "S" }, gradesSource: CLASS_GRADES_SOURCE, guide: "spiritualiste" },
  clerc: {
    name: "Clerc",
    role: "soin",
    weapon: "Masse",
    pitch: "Le healer principal : soins de groupe, boucliers et résurrection.",
    grades: { pve: "S", pvp: "B", solo: "B" },
    gradesSource: CLASS_GRADES_SOURCE,
    guide: "rush-assassin-clerc",
  },
  chantre: { name: "Chantre", role: "soutien", weapon: "Bâton", pitch: "Support hybride : buffs de groupe et soins d'appoint.", grades: { pve: "S", pvp: "B", solo: "A" }, gradesSource: CLASS_GRADES_SOURCE, guide: "chantre" },
} as const satisfies Record<string, ClassInfo>;

export type ClassKey = keyof typeof CLASSES;
export const CLASS_KEYS = Object.keys(CLASSES) as [ClassKey, ...ClassKey[]];

/** Change the criteria version when ranking semantics change. */
export function classVoteRevision(key: ClassKey): string {
  const c = CLASSES[key];
  return `${c.gradesSource.asOf}-${c.grades.pve}${c.grades.pvp}${c.grades.solo}-group-small-solo-v1`;
}
