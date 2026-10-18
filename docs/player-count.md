# Compteur de joueurs Steam

La barre de navigation affiche les joueurs simultanés de l'application Steam
`3393110`. Ce nombre ne comprend pas les joueurs du lanceur NC et ne décrit pas
un serveur EU particulier. La source est l'[API officielle Steam](https://partner.steamgames.com/doc/webapi/isteamuserstats#GetNumberOfCurrentPlayers).

Le navigateur consulte `/api/players/` chaque minute pendant que l'onglet est
visible, puis à son retour au premier plan. Steam peut conserver sa réponse en
cache plus longtemps. `retrievedAt` indique la récupération de cette réponse,
pas l'instant d'un comptage interne de Steam.

Le gestionnaire conserve un relevé pendant 60 secondes par instance et regroupe
les requêtes simultanées. L'appel Steam expire après 5 secondes. Une erreur
renvoie HTTP 503 sans nombre fictif. Le composant conserve son dernier chiffre
avec la mention « ancien », ou affiche « indisponible » sans relevé précédent.

Le même gestionnaire sert dans Hono (`apps/server/src/players.ts`), dans le
serveur Astro existant (`apps/web/players-dev.mjs`) et dans la fonction Vercel
`api/players.ts`. Un hébergement uniquement statique doit également fournir
cette fonction ; aucune clé Steam ni variable secrète n'est nécessaire.
