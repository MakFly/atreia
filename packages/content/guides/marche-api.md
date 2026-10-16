---
title: "Marché et API : ce qui existe vraiment"
summary: "Pas d'API officielle, un marché limité à ton serveur : d'où viennent les prix des sites tiers et comment construire un outil sans risque."
category: kinah
updated: 2026-10-11
tags: [marché, api, outils]
order: 3
highlights:
  - "AION 2 n'a aucune API publique."
  - "Les sites de prix tiers ne disent pas d'où viennent leurs données."
  - "La voie sans risque : des prix saisis par les joueurs."
---

## Pas d'API publique

AION 2 n'a pas d'API publique, ni pour le marché ni pour le reste.

- **Côté officiel** : le portail [PLAYNC Developers](https://developers.plaync.com) n'expose une API ouverte que pour Lineage 2M (lancée en décembre 2022). Rien pour AION 2. Le [guide du marché d'aion2kina (18/08/2026)](https://www.aion2kina.com/en/guides/aion-2-brokerage-market-guide/) ne mentionne aucun accès hors jeu.
- **Côté communauté** : les sites de prix et d'armurerie ([aion2.exchange](https://aion2.exchange/), [shugo.gg](https://shugo.gg/), [stigma.pro](https://www.stigma.pro/), [aion2-armory.com](https://aion2-armory.com/)) n'indiquent pas d'où viennent leurs données. Le seul cas documenté, [dodsas/aion2](https://github.com/dodsas/aion2), prend les recettes dans le JSON non officiel d'Inven et stocke des prix **saisis à la main par les joueurs** (aion2craft.com).

## Le marché en Europe

Le marché se limite à ton serveur (l'inter-serveurs EU n'est pas encore ouvert), et il faut l'abonnement pour vendre. L'échange direct entre joueurs est désactivé en global. Un tracker de prix EU fiable n'a donc pas encore de source propre.

## CGU : où est la limite

- Les CGU de NC interdisent les programmes tiers et l'automatisation sur le client : lire la mémoire du client ou faire de l'OCR automatisé en jeu, c'est un risque de ban.
- Scraper des pages web publiques (profils PLAYNC) reste une zone grise, tolérée en pratique avec un rate limit et un cache.

## Construire un outil sans risque

La voie propre est celle de dodsas : des prix saisis par les joueurs, ou de l'OCR sur des captures que l'utilisateur envoie lui-même, avec une base statique (MetaBot, Inven) par-dessus. Un LLM vision fait très bien cet OCR avec une sortie JSON structurée.
