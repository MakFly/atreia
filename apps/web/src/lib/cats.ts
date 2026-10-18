import type { Category } from "@aion2/shared/browser";
import { type Locale } from "@/lib/i18n";

/** Libellé court en capitales, comme les pastilles de rubrique de la référence. */
export const CAT_TAG: Record<Category, string> = {
  actu: "Actus",
  "bien-demarrer": "Débuter",
  classes: "Classes",
  kinah: "Kinah",
  ressources: "Ressources",
};

const EN_CAT_TAG: Record<Category, string> = {
  actu: "News",
  "bien-demarrer": "Getting started",
  classes: "Classes",
  kinah: "Kinah",
  ressources: "Resources",
};

export function getCatTag(locale: Locale = "en"): Record<Category, string> {
  return locale === "fr" ? CAT_TAG : EN_CAT_TAG;
}

export function getCategoryLabel(category: Category, locale: Locale = "en"): string {
  return locale === "fr"
    ? ({ actu: "Actualités", "bien-demarrer": "Bien démarrer", classes: "Classes", kinah: "Kinah", ressources: "Ressources" } as const)[category]
    : ({ actu: "News", "bien-demarrer": "Getting started", classes: "Classes", kinah: "Kinah", ressources: "Resources" } as const)[category];
}

export const catColor = (c: Category) => `var(--cat-${c})`;
