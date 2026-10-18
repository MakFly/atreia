# Votes sur les classes

Le tableau `/classes/` recueille un avis « Je valide » ou « À revoir » par
navigateur et par classe. L’avis porte sur les trois notes affichées ensemble.
Les résultats sont publics ; ils ne modifient pas automatiquement les notes.
Un cookie anonyme `HttpOnly`, `SameSite=Strict` et `Secure` sous HTTPS conserve
l’identifiant pendant un an. Effacer ce cookie ou changer de navigateur permet
de voter de nouveau : ce dispositif ne garantit pas une personne unique.

## Stockage et révisions

Redis conserve les compteurs et le choix de chaque identifiant dans des clés
préfixées `atreia:class-votes:`. Une opération Lua modifie ensemble l’ancien
avis, le nouveau et les compteurs. Répéter le même choix ne l’ajoute pas une
seconde fois. Les changements de source, de notes ou de version des critères
produisent une nouvelle révision via `classVoteRevision` dans
`packages/shared/src/classes.ts`. Une ancienne page reçoit une réponse 409.

L’API accepte GET et POST sur `/api/class-votes/`, avec `class` et `revision`.
Elle vérifie l’origine des écritures, le JSON et sa taille, et limite un
identifiant à 30 écritures par minute. Elle ne renvoie ni les identifiants ni
la liste des avis individuels. Réponses privées sans cache, pour empêcher la
mise en cache du choix personnel et du cookie.

## Développement local

Le plugin `apps/web/votes-dev.mjs` ajoute cette route au serveur Astro existant.
Il charge `VOTES_REDIS_URL` depuis le `.env` racine, uniquement côté serveur.
Il ne crée pas de serveur supplémentaire. Le compte local `atreia-votes` est
limité à ses clés et aux commandes nécessaires, sur le port loopback 6379
vérifié du conteneur partagé `infra-redis`.

L’instance vérifiée le 16/10/2026 active AOF mais n’a aucun fichier ACL
configuré. Après un redémarrage de ce conteneur, rétablir le compte à partir
du secret déjà présent dans `.env`, depuis la racine :

```bash
bun apps/server/scripts/setup-votes.ts
```

Cette commande ne modifie que le compte dédié. Elle utilise le compte
administrateur local par défaut ; si celui-ci exige une authentification,
fournir `REDIS_ADMIN_URL` dans l’environnement, sans la publier. Elle ne change
pas la configuration globale de Redis et ne supprime aucune donnée.

L’instance partagée utilise `allkeys-lru` : ses clés peuvent être évincées sous
pression mémoire. AOF seul ne garantit donc pas la conservation des votes.
Pour un historique durable, la configuration du stockage doit garantir la
conservation et des sauvegardes. Ce réglage de l’infrastructure commune
appartient à son dépôt et n’est pas modifié par cette fonctionnalité.

## Hébergement sur PVE

Le serveur Hono monte directement `/api/class-votes/` avant les middlewares
de cache de l’API des guides. Le même processus sert les pages Astro. Ces
pages relisent les guides par l’API, qui lit la base.
Aucune fonction externe ni connexion à Vercel n’est utilisée.

Définir **VOTES_REDIS_URL** côté serveur pour le Redis de cet environnement.
Pour le processus local sur l’hôte, la connexion utilise `127.0.0.1:6379`.
Pour un conteneur applicatif local, le connecter à `dev-shared-net` et utiliser
le DNS explicite `infra-redis:6379`. Le secret reste dans le `.env` racine
ignoré par Git, jamais dans une variable préfixée `PUBLIC_`. Ne pas réutiliser
les secrets locaux en production.

Définir aussi **SITE_URL** avec l’origine HTTPS publique sur PVE. Hono
l’utilise en mode production pour vérifier l’origine des écritures et créer
un cookie `Secure`, même si le reverse proxy lui transmet du HTTP. Les
en-têtes transmis par le visiteur ne choisissent pas l’origine autorisée.
Les variables exportées prennent priorité sur le `.env` racine, chargé par
le serveur même quand son répertoire courant est `apps/server`.

Si Redis manque ou est inaccessible, l’API répond 503 ; l’interface indique
l’indisponibilité et propose de réessayer. Elle ne simule pas de résultats.
Ce changement prépare le serveur ; aucun déploiement PVE n’est effectué.

## Vérifications

`make typecheck` couvre l’interface et le serveur.
`make test` inclut les contrats HTTP des votes. Une vérification ponctuelle
sur le Redis local couvre l’atomicité, les doubles envois, le changement d’avis
et la lecture par plusieurs connexions ; elle ne fait pas partie des tests
permanents et nettoie uniquement ses clés temporaires.
