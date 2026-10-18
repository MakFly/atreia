# Agent de rédaction Atreia

`redacteur` rédige et actualise les articles AION 2 en français. Son persona
reprend les exigences d'un rédacteur ayant plus de 20 ans d'expérience : angle
clair, vérification des faits, conseils concrets et relecture exigeante. Il ne
revendique ni carrière réelle ni tests personnels dans le jeu.

Il recherche sur le web à chaque mission, y compris lors d'une révision, puis
vérifie les sources ouvertes, leur date, la région et le patch concernés.
Les versions coréenne et globale ne sont jamais supposées identiques.

Les guides de fond visent généralement 1 500 à 2 500 mots utiles, et les guides
pratiques ciblés 1 000 à 1 600 mots, hors métadonnées, sources et notes de
vérification. Ce sont des repères éditoriaux : un sujet étroit ou une actualité
peut être plus court. Le volume doit venir des explications, cas concrets,
arbitrages, étapes et erreurs utiles au joueur, jamais du remplissage ou de
mécaniques inventées. Un guide vidéo doit se suffire à lui-même. Les éditions
traduites requises par le chargeur de contenu gardent la même profondeur.

L'objectif SEO passe d'abord par l'intention de recherche : une réponse directe,
des explications complètes, un titre précis et des liens internes qui aident à
poursuivre. Les volumes de mots ne sont ni un minimum imposé par Google ni une
garantie de classement. L'agent conserve les URL existantes, évite les sujets
quasi identiques et distingue les améliorations éditoriales des résultats
mesurés dans les moteurs. Il n'invente ni volumes de recherche ni performances.

## L'appeler

Dans Claude Code, depuis ce dépôt, demande par exemple :

> Utilise l'agent redacteur pour rédiger un guide français sur l'assassin
> en PvE global/EU. Vérifie les informations actuelles et crée le fichier du guide.

Il n'y a pas de skill éditorial. L'agent porte la recherche du jour, la vidéo
et la rédaction. Les commandes de sous-titres restent dans
`.claude/agents/caption-extraction.md`. Une image nouvelle passe par
`aion2-images`. Un agent nouvellement créé peut nécessiter de rouvrir la
session pour être découvert.

Dans Grok Build, depuis ce dépôt :

```bash
grok --agent redacteur
```

Donne ensuite le sujet dans la session. Grok lit
`.grok/agents/redacteur.md`, qui pointe vers `.claude/agents/redacteur.md`.
Le dossier doit être approuvé dans Grok pour que les ressources du projet
soient chargées. Le contrôle du 16 octobre 2026, fait sur l'ancien nom
`aion2-editor` avec Grok 1.0.62, montrait `projectTrusted: false` pour ce
checkout. Ce constat date d'avant le renommage. Ne pas utiliser un
hypothétique `--trust`, absent de l'aide de la version installée alors.
Aucun réglage de confiance n'a été changé pendant la création.

Dans Codex, demande explicitement :

> Utilise l'agent redacteur pour actualiser le guide demandé avec les
> dernières sources officielles global/EU et expliquer les changements.

Le profil natif se trouve dans `.codex/agents/redacteur.toml`. Le modèle et
les permissions restent ceux du contexte appelant.

Le contexte appelant doit fournir un outil de recherche web et un moyen de
lire les pages. L'agent utilise les outils effectivement disponibles. Dans
Codex CLI, `codex --search` permet d'activer la recherche en direct pour la
session ; un fichier d'agent ne peut pas créer un outil absent. Si le web est
indisponible, l'agent le dit et produit seulement un brouillon provisoire ou
une note de recherche, sans présenter les faits comme vérifiés aujourd'hui.

## Transformer une vidéo en guide

Donne l'URL YouTube, le public et, si tu le connais, le patch visé :

> Utilise redacteur pour transformer cette vidéo en guide français pour
> les joueurs global/EU : URL. Extrais les sous-titres accessibles, explique
> les étapes, vérifie les conseils avec les sources actuelles et cite le
> créateur avec les passages horodatés.

L'extraction de sous-titres utilise un outil disponible ou, en option,
`yt-dlp`. Les commandes figurent dans
[la référence d'extraction](../.claude/agents/caption-extraction.md).
Le contrôle local du 16 octobre 2026 confirme maintenant `yt-dlp 2026.08.19`,
installé avec `uv` et le groupe `default`, qui inclut `yt-dlp-ejs 0.8.0`.
Cette version correspond à la dernière stable officielle ; yt-dlp ne propose
pas de branche LTS. Les fichiers des deux paquets correspondent aux wheels
PyPI officiels et la version inclut les correctifs des avis de sécurité
publiés consultés. Ce contrôle ne garantit pas l'absence de toute vulnérabilité
et ne couvre pas l'ensemble des dépendances transitives.

Les commandes utilisent explicitement Node 24 installé pour le composant EJS,
car Bun 1.4 dépasse la version maximale prise en charge par yt-dlp. Cette
exception concerne uniquement le moteur requis par cet outil tiers. Les
commandes ignorent la configuration ambiante, désactivent les plugins et les
téléchargements de composants distants, et limitent les tentatives réseau.

Test réel réussi sur la vidéo de Drunge
[« AION 2 : Ne CRAFTEZ PAS avant d'avoir vu ce GUIDE ! »](https://www.youtube.com/watch?v=u57rYYBDjak),
publiée le 14 octobre 2026, durée 26 min 24 s : extraction de la piste
`fr-orig` automatique, téléchargement vidéo 360p et audio séparé, lecture de
la transcription sur toute sa durée. Aucun fichier audio/vidéo fusionné n'a
été produit, car `ffmpeg` est absent. Les fichiers sont conservés localement
dans `.run/research/yt-dlp-drunge/`, ignoré par Git.
Les images de gameplay n'ont pas été analysées et les mécaniques du jeu n'ont
pas encore été corroborées par des sources indépendantes.

Second test réussi avec **IruMinaTi**, sur son
[guide des statistiques](https://www.youtube.com/watch?v=wqmi-tNPLU8),
publié le 10 septembre 2026, durée 53 min 54 s. Vidéo 360p, audio et
sous-titres français automatiques ont été récupérés. La partie guide a été
lue jusqu'à sa conclusion à 50:19, sans analyser la musique finale ni les
images. Les fichiers et la note horodatée sont conservés dans
`.run/research/yt-dlp-iruminati/`, hors versionnement. La formule communautaire
et les exemples de saisons avancées demandent une vérification avant leur
utilisation dans un guide global actuel.

Les sous-titres automatiques demandent une vérification des noms et des chiffres.
Ils ne prouvent pas ce qui apparaît à l'écran. L'agent précise ce qu'il a pu
lire et ne prétend pas avoir regardé une vidéo entière à partir du texte seul.
Il ne contourne pas les restrictions d'accès. Sans sous-titres accessibles,
il s'appuie sur d'autres sources ou demande la transcription utile.

La sortie est un guide original organisé autour de l'objectif du joueur, avec
prérequis, étapes, explications, limites et sources. Ce n'est pas une traduction
de la transcription. Les règles du skill d'images existant s'appliquent aussi
aux captures et aux images officielles ; l'agent ne les envoie pas à un modèle
d'IA lorsque ces règles l'interdisent.

## Fichiers partagés et vérification

| Ressource | Emplacement canonique |
|---|---|
| Agent Claude | `.claude/agents/redacteur.md` |
| Agent Grok | `.grok/agents/redacteur.md` (lien vers le fichier Claude) |
| Agent Codex | `.codex/agents/redacteur.toml` |
| Commandes de sous-titres | `.claude/agents/caption-extraction.md` |
| Images nouvelles et crédits | `.claude/skills/aion2-images/SKILL.md` |

`aion2-images` reste exposé à Codex par un lien dans `.agents/skills/`.
Il n'y a plus de skill `aion2-editor`, `aion2-research` ni `aion2-youtube`.
Les règles de recherche et de vidéo sont dans l'agent.

L'agent respecte le schéma réel des guides, cite ses sources et signale les
incertitudes. `a-venir` affiche un contenu en préparation sur le site ; il ne
sert pas à cacher un brouillon. Par défaut, un brouillon non vérifié reste
hors du dossier des guides. Écrire un fichier local n'autorise pas sa mise en
ligne, un commit, un push ou un déploiement.

Le passage à l'agent `redacteur` a été contrôlé le 17 octobre 2026 par lecture
du YAML et du TOML. Ce contrôle ne constitue pas une session réelle dans
chacun des trois outils. Aucun serveur ni build n'est nécessaire pour charger
ces instructions.

Références des formats : [agents Claude](https://code.claude.com/docs/en/sub-agents),
[skills Claude](https://code.claude.com/docs/en/skills),
[agents Codex](https://learn.chatgpt.com/docs/agent-configuration/subagents),
[skills Codex](https://learn.chatgpt.com/docs/build-skills).
La compatibilité Grok a été contrôlée dans l'aide locale de Grok 1.0.60 et
ses fichiers `~/.grok/docs/user-guide/08-skills.md` et `~/.grok/README.md`.
