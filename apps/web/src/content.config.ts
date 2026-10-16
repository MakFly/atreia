import { guideFrontmatterSchema } from "@aion2/shared";
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

// Mêmes fichiers et même schéma zod que l'API Hono : une seule source de vérité.
const guides = defineCollection({
  loader: glob({ pattern: "*.{md,mdx}", base: "../../packages/content/guides" }),
  schema: guideFrontmatterSchema,
});

export const collections = { guides };
