# Fil des actualités AION 2

Les pages `/actualites/` (anglais) et `/fr/actualites/` (français) réunissent
les publications officielles Global de NC. Un aperçu figure sur l’accueil.
La page présente une sélection à la une (dernière mise à jour, événement
et Daeva Pass disponibles), puis une grille illustrée filtrable. Les images
d’ambiance proviennent du catalogue local crédité dans `images/manifest.json` ;
elles ne prétendent pas être des captures des annonces.
Les titres renvoient à la publication d’origine : aucun article officiel
n’est republié intégralement.

`GET /api/news/?lang=fr` (ou `en`, valeur par défaut) alimente le fil.
Le gestionnaire Hono est monté dans `apps/server/src/app.ts` pour
l’hébergement avec l’API. `apps/web/news-dev.mjs` le rend également accessible
sur le serveur Astro local existant. `api/news.ts` est un adaptateur optionnel
pour un hébergement avec fonctions Node. Un hébergement purement statique doit
router `/api/news/` vers ce gestionnaire ; les fichiers HTML seuls ne suffisent
pas à synchroniser les annonces.

Aucune clé API ni tâche planifiée n’est nécessaire. Les sources sont
interrogées à la demande, avec un cache mémoire de cinq minutes par langue
et une requête partagée entre visiteurs simultanés du même processus.
Le navigateur vérifie toutes les cinq minutes lorsque la page est visible.
Le bouton Actualiser respecte le cache du serveur. Ce mécanisme ne reçoit
pas de notifications poussées par NC et ne nécessite pas de reconstruction
du site. Un redémarrage ou une nouvelle instance vide le cache.

## Sources et classement

- Annonces : API communautaire officielle, rubrique `notice_fr` ou
  `notice_en`, trois pages de 25 entrées via `search/moreArticle` et son
  curseur `previousArticleId`.
- Notes de version : rubrique `update_fr` ou `update_en`, jusqu’à 25 entrées.
- Événements en cours : calendrier officiel `promotion.plaync.com`,
  `/fr-fr/eventon/item` ou `/en-us/eventon/item`, tags Global et pays,
  statut `RUNNING`, jusqu’à 30 événements.

Les catégories mise à jour, événement, pass, boutique, maintenance et annonce
sont calculées à partir de la rubrique, du titre et du court résumé officiels.
Un même titre peut avoir plusieurs catégories. Le filtre des passes reconnaît
Battle Pass, Daeva Pass et leurs variantes françaises. Ce classement ne lit
pas le corps complet des annonces : une mention absente du titre et du résumé
peut lui échapper. Le fil est une fenêtre récente, pas une archive exhaustive.
Les annonces épinglées plus anciennes que cette fenêtre ne sont pas ajoutées.

Les événements affichent leur début et leur fin annoncés, en UTC, avec la
mention Terminé si la date est dépassée. Une date d’événement n’est pas
présentée comme sa date de publication. Les annonces de passes restent datées
sans déduire une disponibilité, un prix ou une expiration non fournis.

## Pannes et sécurité

Un délai maximal de sept secondes couvre chaque groupe de sources, pagination
comprise. Les groupes sont interrogés en parallèle. Une source en panne
conserve au plus 24 heures sa dernière réponse valide, avec une mention de
cache et sa date de synchronisation. Les autres sources continuent de se
mettre à jour. Les réponses partielles sont réessayées après une minute.
Sans aucune source exploitable, le gestionnaire renvoie HTTP 503. Une liste
vide valide reste distincte d’une panne. Les réponses utilisent `no-store`
pour que le cache applicatif garde la maîtrise de leur fraîcheur.

Les URL de collecte sont fixes. Les liens d’événements sont limités à
`https://aion2.plaync.com`, les liens d’annonces sont construits à partir
d’identifiants validés. Le composant affiche du texte échappé, aucun HTML
fourni par la source. Aucun visuel distant n’est incorporé.

## Vérification

`make typecheck` vérifie le contrat et les composants. `make test` couvre
les formats des trois sources, le classement multiple, les dates des
événements, la pagination bornée, la déduplication, le cache partagé,
l’isolation des langues, les URL non autorisées, les pannes et la reprise.
Ces commandes ne démarrent pas de serveur et ne produisent pas de build.
