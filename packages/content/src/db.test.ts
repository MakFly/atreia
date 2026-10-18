import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseGuide } from "@aion2/shared";
import { afterEach, describe, expect, it } from "vitest";
import { createGuideDatabase, openGuideStore, writeGuide } from "./db.ts";

const source = `---
title: Test
summary: Résumé
category: actu
updated: 2026-10-16
---

## Première partie

Du texte.
`;

const editions = (title = "Test") => {
  const fr = parseGuide("essai", source.replace("title: Test", `title: ${title}`));
  const en = parseGuide("essai", source.replace("title: Test", `title: ${title} EN`).replace("Résumé", "Summary"));
  return [
    { locale: "fr" as const, guide: fr },
    { locale: "en" as const, guide: en },
  ];
};

describe("guides sqlite", () => {
  let dir: string;
  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it("relit une édition et refuse un catalogue sans sa traduction", async () => {
    dir = await mkdtemp(join(tmpdir(), "atreia-guides-"));
    const file = join(dir, "guides.sqlite");
    createGuideDatabase(file, editions());
    const store = openGuideStore(file);
    expect(store.size).toBe(1);
    expect(store.get("essai", "fr")?.title).toBe("Test");
    expect(store.get("essai", "en")?.body).toContain("Première partie");
    expect(store.list("fr").map((guide) => guide.slug)).toEqual(["essai"]);
    store.close();

    writeGuide(file, "fr", parseGuide("seul", source));
    expect(() => openGuideStore(file)).toThrow("Missing EN/FR guide translation: seul");
  });

  it("remplace le corps d'une édition déjà écrite", async () => {
    dir = await mkdtemp(join(tmpdir(), "atreia-guides-"));
    const file = join(dir, "guides.sqlite");
    createGuideDatabase(file, editions());
    writeGuide(file, "fr", parseGuide("essai", source.replace("title: Test", "title: Modifié")));
    const store = openGuideStore(file);
    expect(store.get("essai", "fr")?.title).toBe("Modifié");
    expect(store.get("essai", "en")?.title).toBe("Test EN");
    store.close();
  });
});
