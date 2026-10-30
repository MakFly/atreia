import type { ClassKey } from "./classes.ts";

/** buff and nerf change power; fix restores the intended behaviour; ajustement changes it without a clear direction. */
export type ClassChangeKind = "buff" | "nerf" | "fix" | "ajustement";

export interface Localized {
  fr: string;
  en: string;
}

/** One official Global (EU) class change. Source: NC patch notes only. */
export interface ClassChange {
  /** Maintenance date in Europe (CET/CEST), YYYY-MM-DD. */
  date: string;
  /** Official patch notes, French and English URLs. */
  source: Localized;
  /** Classes concerned, or "all". */
  classes: readonly ClassKey[] | "all";
  /** Skill name as written in the official notes; absent for a class-wide change. */
  skill?: Localized;
  kind: ClassChangeKind;
  change: Localized;
  before?: string;
  after?: string;
}

const NOTES_2026_10_14: Localized = {
  fr: "https://aion2.plaync.com/fr-fr/board/update/view?articleId=6acf20d007b77e214688a7b5",
  en: "https://aion2.plaync.com/en-us/board/update/view?articleId=6acf20d007b77e214688a7ac",
};
const NOTES_2026_10_21: Localized = {
  fr: "https://aion2.plaync.com/fr-fr/board/update/view?articleId=6ad85be86cfe4756db5b8e96",
  en: "https://aion2.plaync.com/en-us/board/update/view?articleId=6ad85be86cfe4756db5b8e92",
};
const NOTES_2026_10_28: Localized = {
  fr: "https://aion2.plaync.com/fr-fr/board/update/view?articleId=6ae197dae9e73259ce61e861",
  en: "https://aion2.plaync.com/en-us/board/update/view?articleId=6ae19668577e8c01355e0210",
};

/** Newest first. Add an entry for every class line of each new Global patch note. */
export const CLASS_CHANGES: readonly ClassChange[] = [
  {
    date: "2026-10-28", source: NOTES_2026_10_28, classes: ["gladiateur", "templier"], kind: "buff",
    change: { fr: "PV de base au niveau 45 augmentés de 1 500 pour mieux survivre au contact des boss.", en: "Base HP at level 45 raised by 1,500 to survive better against bosses in melee." },
    before: "4 702", after: "6 202",
  },
  {
    date: "2026-10-28", source: NOTES_2026_10_28, classes: ["assassin", "rodeur", "sorcier", "spiritualiste", "clerc", "chantre"], kind: "buff",
    change: { fr: "PV de base au niveau 45 augmentés de 1 000.", en: "Base HP at level 45 raised by 1,000." },
    before: "4 702", after: "5 702",
  },
  {
    date: "2026-10-28", source: NOTES_2026_10_28, classes: ["assassin"], kind: "buff",
    skill: { fr: "Sixième sens exacerbé", en: "Heightened Sixth Sense" },
    change: { fr: "Effet sur les PV augmenté (1 000 / 2 000 / 4 000 aux niveaux 5, 10 et 20).", en: "HP effect raised (1,000 / 2,000 / 4,000 at levels 5, 10 and 20)." },
  },
  {
    date: "2026-10-28", source: NOTES_2026_10_28, classes: ["assassin"], kind: "buff",
    skill: { fr: "Clone illusoire", en: "Illusive Clone" },
    change: { fr: "Temps de recharge de base réduit.", en: "Base cooldown reduced." },
    before: "90 s", after: "60 s",
  },
  {
    date: "2026-10-21", source: NOTES_2026_10_21, classes: ["sorcier"], kind: "fix",
    skill: { fr: "Tempête de givre", en: "Cold Storm" },
    change: { fr: "Les cibles avec des cumuls de Gelure subissent bien les dégâts supplémentaires, l'effet Gelure suit le niveau de la compétence, et la Spécialisation 1 n'applique plus une Gelure de trop dans la zone après la fin de l'effet.", en: "Targets with Frostbite stacks now take the extra damage, Frostbite now follows the skill level, and Specialty 1 no longer applies an extra Frostbite in the area after the effect ends." },
  },
  {
    date: "2026-10-21", source: NOTES_2026_10_21, classes: ["sorcier"], kind: "fix",
    skill: { fr: "Rideau de feu", en: "Fire Wall" },
    change: { fr: "Les cibles sans cumuls de Braise ne subissent plus de dégâts supplémentaires.", en: "Targets without Ember stacks no longer take extra damage." },
  },
  {
    date: "2026-10-21", source: NOTES_2026_10_21, classes: ["chantre"], kind: "fix",
    skill: { fr: "Frappe tournoyante", en: "Spinning Strike" },
    change: { fr: "Affichage des effets de la compétence corrigé.", en: "Skill effect display fixed." },
  },
  {
    date: "2026-10-14", source: NOTES_2026_10_14, classes: ["spiritualiste"], kind: "fix",
    skill: { fr: "Invocation : Esprit ancien", en: "Summon: Ancient Spirit" },
    change: { fr: "Les Esprits anciens invoqués au niveau 15 ou inférieur activent de nouveau leurs compétences normalement.", en: "Ancient Spirit summons at level 15 or below now activate their skills properly." },
  },
  {
    date: "2026-10-14", source: NOTES_2026_10_14, classes: ["sorcier"], kind: "fix",
    skill: { fr: "Rideau de feu", en: "Fire Wall" },
    change: { fr: "Les dégâts bonus s'appliquent aussi en cas de différence d'altitude, et vos Braises ne sont plus remplacées par les Braises plus puissantes d'un autre joueur.", en: "Bonus damage now applies when there is a difference in elevation, and your Embers are no longer removed by another player's stronger Embers." },
  },
  {
    date: "2026-10-14", source: NOTES_2026_10_14, classes: ["sorcier"], kind: "fix",
    skill: { fr: "Tempête de givre", en: "Cold Storm" },
    change: { fr: "Les dégâts bonus s'appliquent aussi en cas de différence d'altitude, et votre Gelure n'est plus remplacée par la Gelure plus puissante d'un autre joueur.", en: "Bonus damage now applies when there is a difference in elevation, and your Frostbite is no longer removed by another player's stronger Frostbite." },
  },
  {
    date: "2026-10-14", source: NOTES_2026_10_14, classes: ["sorcier"], kind: "fix",
    skill: { fr: "Vent glacial", en: "Bittercold Wind" },
    change: { fr: "La réduction du temps de recharge de Gel fonctionne aussi en cas de différence d'altitude.", en: "The Frost cooldown reduction effect now works when there is a difference in elevation." },
  },
];

/** Changes for one class, newest first, class-wide entries included. */
export function classChangesFor(key: ClassKey): ClassChange[] {
  return CLASS_CHANGES.filter((c) => c.classes === "all" || c.classes.includes(key)).sort((a, b) => b.date.localeCompare(a.date));
}
