import { guideFrontmatterSchema } from "@aion2/shared";
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

// Mêmes fichiers et même schéma zod que l'API Hono : une seule source de vérité.
// Le cache de contenu d'Astro ne suit que ce fichier : après un changement du schéma dans packages/shared,
// lancer `bun --filter @aion2/web clean`, sinon les nouveaux champs restent absents des guides déjà en cache.
const guides = defineCollection({
  loader: glob({ pattern: "*.{md,mdx}", base: "../../packages/content/guides" }),
  schema: guideFrontmatterSchema,
});

export const collections = { guides };
