# Atreia, guides AION 2

Site de guides AION 2 en français. Monorepo Bun :

| Dossier | Rôle |
|---|---|
| `apps/web` | Site Astro 7 (HTML statique, content collections) + Tailwind 4 + shadcn/ui en îlots React 19 (recherche, menu mobile). Sitemap généré. |
| `apps/server` | API Hono 4 sur Node 22. Sert aussi le site Astro buildé en prod (une seule image). Le site peut aussi partir seul sur un hébergement statique (Cloudflare Pages). |
| `packages/shared` | Types, schéma zod du frontmatter, parseur de guides, données serveurs EU. `@aion2/shared/browser` = entrée sans zod ni yaml pour le front. |
| `packages/content/guides` | **Les guides, un fichier Markdown par guide.** |

## Démarrer

Prérequis : Bun, Node.js 22 ou supérieur, `make` et `lsof`. Une installation à la racine couvre tous les workspaces.

```bash
make install     # installe les dépendances avec bun install
make dev         # démarre le site Astro et l'API en arrière-plan
make stop        # arrête les serveurs démarrés par make dev
make status      # affiche leur état et leurs ports
make logs        # suit les journaux du site et de l'API
make typecheck   # vérifie les types de tous les workspaces
make test        # lance les tests du serveur et de shared
```

`make dev` choisit le premier port libre à partir de `4321` pour le site et de `8787` pour l'API. Pour changer les ports de départ : `make dev WEB_PORT=5000 API_PORT=9000`. Les PID, ports et journaux sont conservés dans `.run/` (ignoré par Git).

Les scripts racine restent disponibles avec `bun run typecheck` et `bun run test`. Pour cibler un workspace : `bun --filter @aion2/server test`.

## Docker

Depuis la racine, avec Docker et Docker Compose installés :

```bash
SITE_URL=https://atreia.example docker compose up --build -d
```

Remplace `https://atreia.example` par le domaine public réel. Compose exige une valeur non vide pour `SITE_URL` et la transmet au build Astro : elle détermine les URL canoniques, Open Graph, `robots.txt` et le sitemap. Toute modification du domaine demande de reconstruire l'image. Dans le Dockerfile seul, l'argument `SITE_URL` vaut une chaîne vide par défaut : fournis explicitement `--build-arg SITE_URL=https://atreia.example` lors d'un build direct.

Le build utilise l'image officielle `oven/bun:1.4.0`, installe les workspaces avec le lockfile figé, puis lance le contrôle des types, les tests et la compilation. L'image finale `node:22-alpine` contient uniquement le bundle Hono, le site statique et les guides, sans `node_modules`. Hono sert le tout sur `http://localhost:8787`, avec un utilisateur non-root, un contrôle de santé `/health` et un système de fichiers en lecture seule.

```bash
docker compose stop
```

## Ajouter un guide

Les guides sont uniquement en Markdown (`.md`, sans MDX). Crée `packages/content/guides/<slug-en-kebab-case>.md` :

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
cover:                   # optionnel : image de couverture
  src: "/images/assassin.jpg"
  alt: "Assassin dans AION 2"
classes: [assassin]      # optionnel : sceaux de classe dans le bandeau
ratings:                 # optionnel : fiche de build (S, A, B, C)
  - { label: "PvE", grade: S }
pros: ["Point fort"]
cons: ["Point faible"]
---

## Première section
```

Si tu modifies le schéma dans `packages/shared`, lance `bun --filter @aion2/web clean`, puis redémarre les serveurs avec `make stop` et `make dev` : Astro garde un cache du contenu et peut ignorer les nouveaux champs sans ce nettoyage.

Le frontmatter est validé par le même schéma zod (`packages/shared`) au build Astro et au démarrage du serveur : un guide invalide casse le build, jamais la prod. Le site est dédié à AION 2 : les routes sont à la racine (`/`, `/guides/<slug>/`, `/classes/` et `/serveurs/`). Les anciennes URL `/aion2/...` redirigent en 301 vers la racine.

Les couvertures utilisent le champ optionnel `cover: { src, alt }`. Les images sont dans `apps/web/public/images/`, avec leurs sources et licences dans `apps/web/public/images/manifest.json`. Le skill `aion2-images`, dans `.claude/skills/aion2-images/`, permet de les récupérer et de consigner leur provenance.

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

`components.json` est configuré : `bunx shadcn@latest add dialog` depuis `apps/web`, puis utilise le composant dans un îlot React (`client:idle`).

## Aperçu statique

`bun run build:preview` produit `apps/web/dist-preview` avec des liens relatifs, hébergeable sous n'importe quel sous-chemin.
