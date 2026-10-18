import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseGuide } from "@aion2/shared";
import { afterEach, describe, expect, it } from "vitest";
import { openGuideStore } from "./db.ts";
import { assertGuideImages } from "./images.ts";

const front = `---
title: Test
summary: Résumé
category: actu
updated: 2026-10-16
---
`;

describe("guide images", () => {
  let dir: string;
  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  async function layout(files: string[], manifest: string[] = files) {
    dir = await mkdtemp(join(tmpdir(), "atreia-images-"));
    const imagesDir = join(dir, "images");
    await mkdir(imagesDir);
    for (const name of files) await writeFile(join(imagesDir, name), "");
    const manifestPath = join(imagesDir, "manifest.json");
    await writeFile(manifestPath, JSON.stringify(manifest.map((file) => ({ file }))));
    return { imagesDir, manifestPath };
  }

  it("accepte une couverture et une autre image du corps présentes dans le manifest", async () => {
    const options = await layout(["shot.jpg", "scene.jpg"]);
    const guide = parseGuide("essai", `${front}
![Une scène](/images/scene.jpg)
`);
    expect(() => assertGuideImages({ ...guide, cover: { src: "/images/shot.jpg", alt: "Scène" } }, options)).not.toThrow();
  });

  it("refuse un fichier répété dans le guide ou déjà pris par un autre slug", async () => {
    const options = await layout(["shot.jpg", "scene.jpg"]);
    const repeated = parseGuide("essai", `${front}
![Une scène](/images/shot.jpg)
`);
    expect(() => assertGuideImages({ ...repeated, cover: { src: "/images/shot.jpg", alt: "Scène" } }, options)).toThrow(
      /déjà utilisé dans « essai »/,
    );
    const other = parseGuide("autre", `${front}
![Une scène](/images/scene.jpg)
`);
    const guide = { ...parseGuide("essai", front), cover: { src: "/images/scene.jpg", alt: "Scène" } };
    expect(() => assertGuideImages(guide, { ...options, catalogue: [other] })).toThrow(/déjà utilisé par « autre »/);
    expect(() => assertGuideImages(guide, { ...options, catalogue: [{ ...other, slug: "essai" }] })).not.toThrow();
  });

  it("ignore une image citée dans un bloc de code", async () => {
    const options = await layout(["shot.jpg"]);
    const guide = parseGuide("essai", `${front}
![Une scène](/images/shot.jpg)

\`\`\`
![secret](/images/secret.jpg)
\`\`\`
`);
    expect(() => assertGuideImages(guide, options)).not.toThrow();
  });

  it("refuse une image absente du manifest, un fichier manquant et une URL externe", async () => {
    const options = await layout(["shot.jpg"], ["shot.jpg", "manquant.jpg"]);
    const guide = parseGuide("essai", `${front}
![Autre](/images/autre.jpg)
![Manquant](/images/manquant.jpg)
![Dehors](https://example.com/a.jpg)
`);
    expect(() => assertGuideImages(guide, options)).toThrow(
      /\/images\/autre\.jpg.*n'est pas un fichier.*\/images\/manquant\.jpg.*fichier est absent.*https:\/\/example\.com\/a\.jpg/s,
    );
  });

  it("accepte les images du catalogue commité", () => {
    const repo = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
    const store = openGuideStore(resolve(repo, "packages/content/guides.sqlite"));
    const options = {
      imagesDir: resolve(repo, "apps/web/public/images"),
      manifestPath: resolve(repo, "apps/web/public/images/manifest.json"),
    };
    const catalogue = [];
    try {
      for (const locale of ["fr", "en"] as const) {
        for (const meta of store.list(locale)) {
          const guide = store.get(meta.slug, locale);
          expect(guide, meta.slug).toBeDefined();
          catalogue.push(guide!);
        }
      }
      for (const guide of catalogue) {
        expect(() => assertGuideImages(guide, { ...options, catalogue })).not.toThrow();
      }
    } finally {
      store.close();
    }
  });
});
