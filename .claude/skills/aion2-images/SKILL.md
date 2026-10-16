---
name: aion2-images
description: Find and download official AION 2 images (NC news and update posts, trailer thumbnails, Steam key art and screenshots) and freely licensed images from Wikimedia Commons, with source, date, license and credit recorded in a manifest. Use when a guide or page of the Atreia site needs an AION 2 illustration, a cover, a screenshot or a banner, or when the user asks to "récupérer des images", "images officielles", "key art", "libre de droit" for AION 2. Not for generating images, nor for extracting assets from the game client.
---

# AION 2 images

## Goal

Give the Atreia guides real AION 2 visuals whose origin and usage terms are
known, so every published image can be credited and defended. An image without
a recorded source and license does not ship.

## Rights: read this before choosing a source

There is no royalty-free official AION 2 art. Everything NC publishes is
`© NC Corporation. All Rights Reserved.` What makes its use acceptable on a fan
site is NC's **AION2 fan content guidelines** (published in Japanese only, on
the official site: `https://aion2.plaync.com/ja-jp/board/rules/view?articleId=6a7d9723bcc86319892231b1`).
Its points that matter here, checked on 2026-10-16:

- A continuing fan site using screenshots or official material must display
  `© NC Corporation. All Rights Reserved.` (section 8-2). The site footer is a
  valid place.
- The site must not pass itself off as official: no "official", "endorsed" or
  partner wording, and the AION 2 logo is never used as the site's own logo
  (8-1). A site named after the game says it is unofficial / a fan site.
- Material that is merely public is not automatically licensed (1-1): only
  the fan kit and material NC explicitly allows are. Using news art and Steam
  screenshots to illustrate a guide is common fan-site practice, but it rests
  on tolerance, not on a license. Prefer our own in-game screenshots for
  anything prominent, and keep official art for illustration.
- Forbidden: redistributing assets as a pack or on their own, altering the
  logo, edits that damage the game's image, and any use of official material
  as AI or machine-learning training data (section 7).
- Sponsored posts, ads and merchandise need NC's prior approval (section 2).

Truly free images come only from **Wikimedia Commons**, and the license is
per file (CC BY, CC BY-SA, CC0, public domain). For AION 2 itself Commons has
almost nothing: searches return AION 1 event photos (gamescom booths) and
unrelated "Aion" items (GAC cars, a Cyprus mosaic). Check every result by eye
and keep its credit line; CC BY-SA requires attribution and share-alike.

If the guidelines page changes or an English version appears, re-read it and
update this section.

## Sources and tool

`fetch.ts` (run with Bun from this directory) queries three verified sources
and prints JSON, or downloads with `--out <dir>` and merges every file into
`<dir>/manifest.json` (url, source page, title, date, license, credit).
Already-downloaded URLs are skipped, so re-runs are cheap.

```bash
cd .claude/skills/aion2-images
bun fetch.ts official --lang fr --limit 10                 # news + updates + trailers
bun fetch.ts official --board movie_clip --lang en          # trailer thumbnails only
bun fetch.ts steam                                          # 1920x1080 screenshots, key art
bun fetch.ts commons --query "Aion gamescom" --limit 20     # free licenses, verify each
bun fetch.ts steam --out /tmp/aion2-images                  # download + manifest
```

| Source | Origin | What it returns |
|---|---|---|
| `official` | `api-global-community.plaync.com/aion2_global/board/<board>_<lang>/article` (the API behind aion2.plaync.com) | Images embedded in news (`notice`), patch notes (`update`) and the YouTube thumbnails of trailers (`movie_clip`). Board aliases carry a language suffix: `_fr`, `_en`, `_de`, `_es`, `_pt`, `_ja`. |
| `steam` | `store.steampowered.com/api/appdetails?appids=3393110` | Header, capsule, page background and the store screenshots (1920x1080). |
| `commons` | `commons.wikimedia.org/w/api.php` | Files matching `--query`, with license and author from the file metadata. |

The API is public and unauthenticated, but it is undocumented: if a call
returns an empty `contentList`, check the board alias first (a missing
language suffix gives an empty list, not an error), then the network requests
of `https://aion2.plaync.com/fr-fr/board/movie_clip/list` in a browser.

## Boundaries

- Download to a scratch directory, pick, then copy only the chosen files into
  `apps/web/public/images/`, with their entries in
  `apps/web/public/images/manifest.json`. Do not commit whole scraped batches.
- News images are often text-heavy banners (maintenance, sanctions, payment
  notices): look at them before using one as an illustration.
- Keep the user-facing credit next to the image or in the page footer:
  `© NC Corporation. All Rights Reserved.` for `official` and `steam`, the
  manifest `credit` field for `commons`.
- Never send official images to an image model, upscaler or dataset service
  (guidelines section 7).
- Be gentle with the APIs: small `--limit` values, no loops polling them.

## Verify

- `manifest.json` has one entry per file, each with `page`, `license` and
  `credit` filled.
- Opening a few files shows the expected images (Steam screenshots are
  1920x1080 JPEG).
- The page that uses an image shows the matching credit, and the site footer
  carries the NC copyright line and the unofficial / fan site notice.
