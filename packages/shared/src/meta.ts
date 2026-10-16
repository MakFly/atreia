import type { z } from "zod";
import type { guideFrontmatterSchema } from "./guide.ts";

// Module sans dépendance d'exécution : importable côté navigateur sans embarquer zod ni yaml.

export const CATEGORIES = {
  actu: { label: "Actualités", description: "Patchs, maintenances et ce qui arrive ensuite." },
  "bien-demarrer": { label: "Bien démarrer", description: "Serveur, faction et premiers pas." },
  classes: { label: "Classes et progression", description: "Builds, rotations et routes de leveling." },
  kinah: { label: "Kinah et économie", description: "Marché, farm, boutique et abonnement." },
  ressources: { label: "Ressources", description: "Les meilleurs sites, outils et communautés." },
} as const;

export type Category = keyof typeof CATEGORIES;

export type GuideFrontmatter = z.infer<typeof guideFrontmatterSchema>;

export interface TocEntry {
  depth: 2 | 3;
  text: string;
  id: string;
}

export interface GuideMeta extends GuideFrontmatter {
  slug: string;
  readingMinutes: number;
}

export interface Guide extends GuideMeta {
  body: string;
  toc: TocEntry[];
}

export function toMeta({ body: _body, toc: _toc, ...meta }: Guide): GuideMeta {
  return meta;
}

/** Tri : catégorie, puis `order`, puis le plus récent d'abord. */
export function sortGuides<T extends GuideMeta>(guides: T[]): T[] {
  const catOrder = Object.keys(CATEGORIES);
  return [...guides].sort(
    (a, b) =>
      catOrder.indexOf(a.category) - catOrder.indexOf(b.category) ||
      a.order - b.order ||
      b.updated.localeCompare(a.updated),
  );
}
