# AGENTS.md

Atreia is a French-language guide site for AION 2. It is a Bun workspace
monorepo: a static Astro site plus a small Hono API that also serves the built
site in production.

## Layout

| Path | Role |
|---|---|
| `apps/web` | Astro 7 static site, Tailwind 4, shadcn/ui as React 19 islands (search, mobile menu). Generates the sitemap. |
| `apps/server` | Hono 4 API on Node 22 (`tsx watch` in dev, `tsup` bundle in prod). Serves `apps/web/dist` in production. |
| `packages/shared` | Types, zod frontmatter schema, guide parser, EU server data. `@aion2/shared/browser` is the entry without zod or yaml for the front end. |
| `packages/content/guides` | The guides: one Markdown file per guide. |

## Tooling rules

- Bun is the only package manager and runner. Never use `npm`, `npx`,
  `yarn` or `pnpm`. The lockfile is `bun.lock`.
- A single `bun install` at the repository root installs the root and every
  workspace (`apps/*`, `packages/*`). Workspaces depend on each other with
  `workspace:*`.
- Run a script in one workspace with `bun --filter @aion2/<name> <script>`.
- `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `Dockerfile` and `compose.yaml`
  still target pnpm. Docker is on hold: do not edit or rely on them until the
  Docker setup is migrated to Bun.

## Commands

```bash
make install     # bun install for all workspaces
make dev         # web + api in the background, each on the first free port
make status      # running or not, with ports
make logs        # tail .run/web.log and .run/api.log
make stop        # stop what make dev started
make typecheck   # astro check + tsc in every workspace
make test        # vitest (server, shared)
```

`make dev` starts from `WEB_PORT=4321` and `API_PORT=8787` and moves up until
it finds a port nobody listens on. Override the start with
`make dev WEB_PORT=5000 API_PORT=9000`. PIDs, ports and logs live in `.run/`
(git-ignored).

## Conventions

- User-facing copy, guides and commit messages are in French. Code
  identifiers, this file and other agent instructions are in English.
- No em dash used as a mid-sentence aside in copy, docs or commits.
- Diagrams are 7-bit ASCII in a `text` fence, never Mermaid.
- Server configuration goes through the zod schema in
  `apps/server/src/env.ts`; add new variables there and in `.env.example`.
- After changing the frontmatter schema in `packages/shared`, run
  `bun --filter @aion2/web clean` then restart `make dev`: Astro caches
  parsed guides and only invalidates that cache when `content.config.ts`
  itself changes, so new frontmatter fields are otherwise silently dropped.
- Guide covers use the optional `cover: { src, alt }` frontmatter field;
  images live in `apps/web/public/images/` with their source and license in
  `images/manifest.json` (see the `aion2-images` skill).

## Adding a guide

Create `packages/content/guides/<kebab-case-slug>.md`. The
frontmatter fields (`title`, `summary`, `category`, `updated`, `status`,
`tags`, `order`, `highlights`, optional `classes`, `ratings`, `pros`, `cons`)
are validated by the schema in `packages/shared`; see `README.md` for a full
example.

## Verifying changes

- Typecheck (`make typecheck`) and backend tests (`make test`) are the
  default checks.
- Do not start dev servers or builds unless the user asks for it in the
  current message.
- Do not add frontend unit tests or e2e tests unless asked.
