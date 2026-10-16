# Atreia, guides AION 2

Site de guides AION 2 en français. Monorepo pnpm :

| Dossier | Rôle |
|---|---|
| `apps/web` | Site Astro 7 (HTML statique, content collections) + Tailwind 4 + shadcn/ui en îlots React 19 (recherche, menu mobile). Sitemap généré. |
| `apps/server` | API Hono 4 sur Node 22. Sert aussi le site Astro buildé en prod (une seule image). Le site peut aussi partir seul sur un hébergement statique (Cloudflare Pages). |
| `packages/shared` | Types, schéma zod du frontmatter, parseur de guides, données serveurs EU. `@aion2/shared/browser` = entrée sans zod ni yaml pour le front. |
| `packages/content/guides` | **Les guides, un fichier Markdown par guide.** |

## Démarrer

```bash
corepack enable
pnpm install
pnpm dev          # site Astro sur :4321, API sur :8787
pnpm typecheck && pnpm test && pnpm build
pnpm start        # prod locale : API + front sur :8787
```

Docker : `docker compose up --build`, puis http://localhost:8787.

## Ajouter un guide

Crée `packages/content/guides/<slug-en-kebab-case>.md` (ou `.mdx` pour y mettre des composants) :

```markdown
---
title: "Titre du guide"
summary: "Une phrase qui dit ce qu'on y apprend."
category: classes        # actu | bien-demarrer | classes | kinah | ressources
updated: 2026-10-16
status: publie           # ou a-venir pour une section prévue
tags: [assassin]
order: 10                # tri dans la rubrique
highlights:              # 3 à 5 points, affichés dans « L'essentiel »
  - "Premier point clé"
classes: [assassin]      # optionnel : sceaux de classe dans le bandeau
ratings:                 # optionnel : fiche de build (S, A, B, C)
  - { label: "PvE", grade: S }
pros: ["Point fort"]
cons: ["Point faible"]
---

## Première section
```

Si tu modifies le schéma dans `packages/shared`, lance `pnpm --filter @aion2/web clean` : Astro garde un cache du contenu.

Le frontmatter est validé par le même schéma zod (`packages/shared`) au build Astro et au démarrage du serveur : un guide invalide casse le build, jamais la prod. Le site est dédié à AION 2 : les liens internes s'écrivent `/guides/<slug>/`, `/classes/` ou `/serveurs/`. Les anciennes URL `/aion2/...` redirigent en 301 vers la racine.

## API

| Route | Réponse |
|---|---|
| `GET /health` | Liveness |
| `GET /ready` | Readiness (503 si aucun guide chargé) |
| `GET /api/guides?category=kinah` | Liste des métadonnées |
| `GET /api/guides/:slug` | Guide complet (Markdown + sommaire) |
| `GET /api/servers` | Serveurs EU par faction |

Logs JSON sur stdout avec `requestId`, en-têtes de sécurité (`secureHeaders`), ETag et `Cache-Control` sur l'API, arrêt propre sur SIGTERM.

## Variables d'environnement

Voir `.env.example`. `CORS_ORIGINS` vide = API accessible en même origine uniquement.

## Ajouter un composant shadcn

`components.json` est configuré : `pnpm dlx shadcn@latest add dialog` depuis `apps/web`, puis utilise le composant dans un îlot React (`client:idle`).

## Aperçu statique

`pnpm build:preview` produit `apps/web/dist-preview` avec des liens relatifs, hébergeable sous n'importe quel sous-chemin.
