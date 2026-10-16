import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { type Guide, type GuideMeta, parseGuide, sortGuides, toMeta } from "@aion2/shared";

export interface GuideStore {
  list(): GuideMeta[];
  get(slug: string): Guide | undefined;
  size: number;
}

/**
 * Charge tous les guides en mémoire au démarrage. Le contenu est immuable par déploiement :
 * pas d'I/O par requête, et un guide invalide fait échouer le boot (et donc le déploiement).
 */
export async function loadGuides(dir: string): Promise<GuideStore> {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md"));
  const guides = await Promise.all(
    files.map(async (file) => parseGuide(basename(file, ".md"), await readFile(join(dir, file), "utf8"))),
  );
  const bySlug = new Map(guides.map((g) => [g.slug, g]));
  const metas = sortGuides(guides.map(toMeta));
  return { list: () => metas, get: (slug) => bySlug.get(slug), size: guides.length };
}
