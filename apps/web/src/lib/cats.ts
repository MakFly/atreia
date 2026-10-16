import type { Category } from "@aion2/shared/browser";

/** Libellé court en capitales, comme les pastilles de rubrique de la référence. */
export const CAT_TAG: Record<Category, string> = {
  actu: "Actus",
  "bien-demarrer": "Débuter",
  classes: "Classes",
  kinah: "Kinah",
  ressources: "Ressources",
};

export const catColor = (c: Category) => `var(--cat-${c})`;
