# AGENTS.md

Atreia is a French-language guide site for AION 2. It is a Bun workspace
monorepo: an Astro site rendered on demand plus a small Hono API that also
serves that site in production.

## Layout

| Path | Role |
|---|---|
| `apps/web` | Astro 7 server output, Tailwind 4, shadcn/ui as React 19 islands (search, mobile menu). Pages, search and the sitemap read guides through the API. Do not open the database here. |
| `apps/server` | Hono 4 API on Node 22.13+ (`tsx watch` in dev, `tsup` bundle in prod). The only process that opens `guides.sqlite`. Serves the Astro middleware and the API on one port. |
| `packages/shared` | Types, zod frontmatter schema, guide parser, EU server data. `@aion2/shared/browser` is the entry without zod or yaml for the front end. |
| `packages/content` | Guide catalogue: `guides.sqlite`, one row per locale and slug. `@aion2/content` is used by the API and by `put-guide.ts`. |

## Tooling rules

- Bun is the only package manager and runner. Do not use alternative
  package managers or runners. The lockfile is `bun.lock`.
- A single `bun install` at the repository root installs the root and every
  workspace (`apps/*`, `packages/*`). Workspaces depend on each other with
  `workspace:*`.
- Run a script in one workspace with `bun --filter @aion2/<name> <script>`.
- Production targets PVE (Proxmox VE): Hono serves the Astro server entry and
  the API on one port behind an HTTPS reverse proxy. `SITE_URL` is required for
  the web build and defines the public vote origin in production. The server
  loads the root `.env`, with exported environment variables taking priority.
- Votes use server-only `VOTES_REDIS_URL`. Local host processes connect to the
  verified `infra-redis` loopback port; application containers on the shared
  `dev-shared-net` use `infra-redis:6379`. Keep production configuration separate.
  Astro serves the same vote handler locally through `apps/web/votes-dev.mjs`.
  See `docs/votes-classes.md`. There is no Vercel deployment configuration.

## Commands

```bash
make install     # bun install for all workspaces
make dev         # web + api in the background, each on the first free port
make status      # running or not, with ports
make logs        # tail .run/web.log and .run/api.log
make stop        # stop what make dev started
make typecheck   # astro check + tsc in every workspace
make test        # vitest (server, shared, content)
```

`make dev` starts from `WEB_PORT=4321` and `API_PORT=8787` and moves up until
it finds a port nobody listens on. It sets `GUIDES_API_ORIGIN` on the Astro
process to that API. Override the start with
`make dev WEB_PORT=5000 API_PORT=9000`. PIDs, ports and logs live in `.run/`
(git-ignored).

## Conventions

- User-facing copy, guides and commit messages are in French. Code
  identifiers, this file and other agent instructions are in English.
- No em dash used as a mid-sentence aside in copy, docs or commits.
- Diagrams are 7-bit ASCII in a `text` fence, never Mermaid.
- Server configuration goes through the zod schema in
  `apps/server/src/env.ts`; add new variables there and in `.env.example`.
- Guides are saved only in `packages/content/guides.sqlite`. The Hono process
  opens that file. Astro reads `GET /api/guides` and `GET /api/guides/:slug`.
  In production, `writeGuideApiFetch` in `apps/server/src/index.ts` registers
  the in-process API fetch before Astro renders, so a page does not call
  itself over HTTP. In development the two processes are separate and Astro
  uses `GUIDES_API_ORIGIN` (set by `make dev`, default
  `http://127.0.0.1:8787`). Do not import `@aion2/content` or `node:sqlite`
  from `apps/web`.
- The list payload includes `toc` so site search can use heading text. The
  guide body stays on `GET /api/guides/:slug` and is still Markdown. Astro
  renders that Markdown.
- The guide schema in `packages/shared` is checked when a row is read. An
  invalid row or a slug missing its other language fails server startup.
- Every guide has a real cover: `cover: { src, alt }`. The picture is a
  file in `apps/web/public/images/`, listed in `images/manifest.json`, and
  it shows the subject of the article. One file belongs to one slug. The
  French and English editions share it. Another slug cannot use it, and the
  same edition does not repeat it. A title card, a logo, or another guide's
  screenshot of a different scene is not a cover. A new file follows the
  `aion2-images` skill. `put-guide.ts` rejects a missing file, a repeated
  file, and a file already used by another slug. It does not judge whether
  the picture matches the subject.

## Adding a guide

For article writing, updates and YouTube adaptations, call the `redacteur`
agent. That one agent owns live research, video evidence and the article.
Canonical text: `.claude/agents/redacteur.md`. Grok also sees it through
`.grok/agents/redacteur.md`. Codex uses `.codex/agents/redacteur.toml`.
Caption commands stay in `.claude/agents/caption-extraction.md`. New images
stay in the `aion2-images` skill. There is no editorial skill. This routing
does not authorize delegation for unrelated tasks. See
`docs/agent-redaction.md` for invocation and tool prerequisites.

Guides live in `packages/content/guides.sqlite`. Write the article as
Markdown with the usual frontmatter, then load each locale:

```bash
bun packages/content/scripts/put-guide.ts fr path/to/<slug>.md
bun packages/content/scripts/put-guide.ts en path/to/<slug>.md
```

The filename is the slug. Fields (`title`, `summary`, `category`, `updated`,
`status`, `tags`, `order`, `highlights`, optional `classes`, `ratings`,
`pros`, `cons`) are validated by the schema in `packages/shared`; see
`README.md` for a full example. Do not leave the draft under
`packages/content/`. Both locales are required.

## Verifying changes

- Typecheck (`make typecheck`) and backend tests (`make test`) are the
  default checks.
- Do not start dev servers or builds unless the user asks for it in the
  current message.
- Do not add frontend unit tests or e2e tests unless asked.
