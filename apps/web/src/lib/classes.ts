import { CLASSES, type ClassKey } from "@aion2/shared/browser";
import type { Locale } from "@/lib/i18n";

const NAMES_EN: Record<ClassKey, string> = { gladiateur: "Gladiator", templier: "Templar", assassin: "Assassin", rodeur: "Ranger", sorcier: "Sorcerer", spiritualiste: "Spiritmaster", clerc: "Cleric", chantre: "Chanter" };
const ROLES: Record<string, { en: string; fr: string }> = {
  tank: { en: "Tank", fr: "Tank" },
  "dps-melee": { en: "Melee DPS", fr: "DPS mêlée" },
  "dps-distance": { en: "Ranged DPS", fr: "DPS distance" },
  soin: { en: "Healer", fr: "Soins" },
  soutien: { en: "Support", fr: "Soutien" },
};

export const classLabel = (key: ClassKey, locale: Locale) => (locale === "en" ? NAMES_EN[key] : CLASSES[key].name);
export const classRole = (key: ClassKey, locale: Locale) => ROLES[CLASSES[key].role]?.[locale] ?? CLASSES[key].role;
