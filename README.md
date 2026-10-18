# Atreia, guides AION 2

Site de guides AION 2 en français. Monorepo Bun :

| Dossier | Rôle |
|---|---|
| `apps/web` | Site Astro 7 rendu à la demande + Tailwind 4 + shadcn/ui en îlots React 19 (recherche, menu mobile). Les pages, la recherche et le sitemap lisent les guides par l'API. |
| `apps/server` | API Hono 4 sur Node 22.13 ou plus récent. Seul ce processus ouvre la base des guides. Sert le rendu Astro et les votes en production sur PVE. |
| `packages/shared` | Types, schéma zod du frontmatter, parseur de guides, données serveurs EU. `@aion2/shared/browser` = entrée sans zod ni yaml pour le front. |
| `packages/content` | **Les guides dans `guides.sqlite` : une ligne par langue et par slug.** L'écriture passe par `put-guide.ts`. |

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

`make dev` choisit le premier port libre à partir de `4321` pour le site et de `8787` pour l'API. Il donne au site l'adresse de l'API (`GUIDES_API_ORIGIN`). Pour changer les ports de départ : `make dev WEB_PORT=5000 API_PORT=9000`. Les PID, ports et journaux sont conservés dans `.run/` (ignoré par Git).

Les guides sont enregistrés dans SQLite. Le site ne rouvre pas ce fichier : les pages appellent `GET /api/guides`. En développement, Astro et Hono sont deux processus. En production, le rendu Astro tourne dans Hono et appelle la même API dans le processus, sans connexion vers lui-même.

Les scripts racine restent disponibles avec `bun run typecheck` et `bun run test`. Pour cibler un workspace : `bun --filter @aion2/server test`.

## Hébergement sur PVE

Le serveur Hono sert le rendu Astro et les routes API depuis le même
port. L’hébergement cible est PVE (Proxmox VE), derrière un reverse proxy HTTPS.
Les votes utilisent Redis ; aucune fonction Vercel n’est nécessaire.

Renseigner `SITE_URL` avec l’origine publique HTTPS lors de la compilation et
au démarrage du serveur. Elle fixe les URL canoniques et permet de vérifier
l’origine des votes quand Hono reçoit le trafic HTTP du reverse proxy.
Configurer `VOTES_REDIS_URL` pour le Redis de cet environnement. Les variables
exportées prennent priorité sur le `.env` racine, chargé aussi lorsque le
serveur est lancé depuis `apps/server`.

En local, le processus hôte rejoint `infra-redis` par `127.0.0.1:6379` avec un
compte dédié. Un conteneur applicatif local utiliserait `infra-redis:6379`
sur le réseau externe `dev-shared-net`. Ne pas créer de Redis propre au projet.
Les secrets et les adresses de production restent séparés de ceux du poste local.
Voir [la configuration des votes](docs/votes-classes.md).

## Ajouter un guide

L'agent **`redacteur`**, commun à Claude, Grok et Codex, se lance seul. Il
couvre la recherche du jour, une vidéo YouTube et la rédaction. Voir
[son utilisation et ses prérequis](docs/agent-redaction.md).

Les guides sont des lignes de `packages/content/guides.sqlite`. Le corps reste du Markdown (`.md`, sans MDX). Rédige le brouillon, puis charge chaque langue. Le nom du fichier est le slug :

```bash
bun packages/content/scripts/put-guide.ts fr brouillon/<slug-en-kebab-case>.md
bun packages/content/scripts/put-guide.ts en brouillon/<slug-en-kebab-case>.md
```

Le brouillon n'est pas une source du site. Ne le laisse pas dans `packages/content/`. Les deux langues sont obligatoires :

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

Le frontmatter est validé par le même schéma zod (`packages/shared`) à l'écriture et à l'ouverture de la base : un guide invalide, ou un slug sans sa traduction, empêche le serveur de démarrer. Le site est dédié à AION 2 : les routes sont à la racine (`/`, `/guides/<slug>/`, `/classes/` et `/serveurs/`). Les anciennes URL `/aion2/...` redirigent en 301 vers la racine.

Les couvertures utilisent le champ `cover: { src, alt }`. Les images sont dans `apps/web/public/images/`, avec leurs sources et licences dans `apps/web/public/images/manifest.json`. Un fichier n'illustre qu'un seul guide : les éditions française et anglaise le partagent, un autre slug ne peut pas le reprendre, et le même guide ne le répète pas. `put-guide.ts` refuse l'écriture si la couverture ou une image du Markdown n'est pas un fichier de ce dossier déjà inscrit dans le manifest, si le fichier est répété, ou s'il est déjà utilisé par un autre slug. Le skill `aion2-images`, dans `.claude/skills/aion2-images/`, permet de les récupérer et de consigner leur provenance.

## API

| Route | Réponse |
|---|---|
| `GET /health` | Liveness |
| `GET /ready` | Readiness (503 si la base des guides est vide) |
| `GET /api/guides?lang=fr&category=kinah` | Liste des métadonnées, sommaire inclus (recherche du site) |
| `GET /api/guides/:slug?lang=fr` | Guide complet (Markdown + sommaire) |
| `GET /api/servers` | Serveurs EU par faction |

Logs JSON sur stdout avec `requestId`, en-têtes de sécurité (`secureHeaders`), ETag et `Cache-Control` sur l'API, arrêt propre sur SIGTERM.

## Variables d'environnement

Voir `.env.example`. `CORS_ORIGINS` vide = API accessible en même origine uniquement.

## Ajouter un composant shadcn

`components.json` est configuré : `bunx shadcn@latest add dialog` depuis `apps/web`, puis utilise le composant dans un îlot React (`client:idle`).

## Votes sur la tier list

La page `/classes/` propose des votes publics par classe, conservés dans Redis.
La route de vote est servie localement par Astro et par le serveur Hono
en production sur PVE. Les pages obtiennent les guides par l'API. La configuration, les limites
du vote anonyme et les vérifications sont décrites dans
[Votes sur les classes](docs/votes-classes.md).

## Image Docker pour Ploydok

Le `Dockerfile` racine construit le monorepo avec Bun, puis copie uniquement
le rendu Astro, le bundle Hono et `packages/content/guides.sqlite` dans une image
Node 22. Le processus Hono sert le site et les API sur le port interne 8787,
sous un utilisateur non privilégié. Redis reste un service externe.

```bash
make build-docker SITE_URL=https://atreia.example DOCKER_IMAGE=atreia:local
```

Dans Ploydok, utiliser la racine du dépôt comme contexte et `Dockerfile`
comme fichier de construction. Passer `SITE_URL` comme argument de construction
et comme variable d’exécution avec la même origine publique. Injecter aussi
`VOTES_REDIS_URL` à l’exécution ; le secret Redis ne doit jamais être inclus
dans l’image. Le contrôle intégré interroge `/ready` ; `/health` indique
que le processus répond. Ces contrôles ne vérifient pas la connexion Redis.

`make build-docker` construit et charge l’image localement, sans lancer de
conteneur ni de serveur de développement. La cible accepte `DOCKER_BUILDER`
pour utiliser un builder Buildx dédié. Après un essai, supprimer uniquement
le conteneur et le tag d’image créés pour cet essai. Un builder temporaire
peut ensuite être retiré avec `docker buildx rm <nom>` pour supprimer son
cache dédié. Préserver les volumes Redis et les builders des autres projets.
