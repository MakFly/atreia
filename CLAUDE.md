# CLAUDE.md

Atreia is a French-language guide site for AION 2. Read `AGENTS.md` before
changing the repository. This file records the constraints that are easy to
miss.

## Guides

SQLite is the only saved source: `packages/content/guides.sqlite`, one row
per locale and slug. The body stays Markdown inside the row.

Writes go through `packages/content/scripts/put-guide.ts`. Load both `fr` and
`en`. The server refuses to start when a slug has no translation.
Every guide has a real cover of its subject. A title card, a logo, or
another guide's screenshot of a different scene is not a cover. If no such
file exists, get one through the `aion2-images` skill. Do not publish a
stand-in. One image file belongs to one slug: both locales may share it,
and no other slug may use it. `put-guide.ts` refuses a cover or Markdown
image that is not a file in `apps/web/public/images/` already listed in
`images/manifest.json`, a file repeated in the guide, and a file already
used by another slug. It does not check that the picture matches the subject.

Reads go through the Hono API (`GET /api/guides`, `GET /api/guides/:slug`).
Astro pages, the search index and the sitemap call that API. They must not
open the database and must not import `@aion2/content` or `node:sqlite`.

In production the Astro middleware runs inside Hono.
`writeGuideApiFetch` in `apps/server/src/index.ts` registers that API fetch
so rendering calls it in-process, without a socket back to the same server.
In development, Astro and Hono are separate processes. `make dev` sets
`GUIDES_API_ORIGIN` to the API origin. The default is
`http://127.0.0.1:8787`.

The list response includes each guide's `toc`. The Markdown body is only on
the single-guide route. Astro renders that Markdown.

## Tooling

- Bun only. Never npm, npx, yarn or pnpm.
- Do not start a dev server or a build unless the user asks in that message.
- Do not add frontend unit tests or e2e tests unless the user asks.
- User-facing copy is French. This file, `AGENTS.md` and code identifiers
  stay in English.
- No em dash as a mid-sentence aside.
- Diagrams are 7-bit ASCII in a text fence, never Mermaid.

## Editorial

Article work goes to the `redacteur` agent. Canonical prompt:
`.claude/agents/redacteur.md`. See `docs/agent-redaction.md`.
