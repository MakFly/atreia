import { describe, expect, it } from "vitest";
import { GuideParseError, parseGuide } from "./guide.ts";

const valid = `---
title: Test
summary: Résumé
category: actu
updated: 2026-10-16
---

## Première partie

Du texte.

### Sous-partie **grasse**

\`\`\`
## pas un titre
\`\`\`

## Première partie
`;

describe("parseGuide", () => {
  it("parse le frontmatter et applique les valeurs par défaut", () => {
    const g = parseGuide("test", valid);
    expect(g.title).toBe("Test");
    expect(g.status).toBe("publie");
    expect(g.body.startsWith("## Première partie")).toBe(true);
  });

  it("produit des ancres identiques à rehype-slug, doublons compris", () => {
    const g = parseGuide("test", valid);
    expect(g.toc.map((t) => t.id)).toEqual(["première-partie", "sous-partie-grasse", "première-partie-1"]);
  });

  it("rejette une catégorie inconnue", () => {
    expect(() => parseGuide("test", valid.replace("category: actu", "category: x"))).toThrow(GuideParseError);
  });

  it("rejette un slug non conforme", () => {
    expect(() => parseGuide("../etc", valid)).toThrow(GuideParseError);
  });
});
