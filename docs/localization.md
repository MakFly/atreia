# English and French editions

English is the default edition at `/`. French lives under `/fr/`.
Page paths and guide slugs stay stable across editions: for example,
`/guides/bien-demarrer/` and `/fr/guides/bien-demarrer/` are translations.
The server page keeps the historical `/serveurs/` path in both editions.
Language links preserve the current page. URLs, rather than browser language
or saved preferences, determine which edition is displayed.

French and English guides are rows in `packages/content/guides.sqlite`.
The slug, enum values and class identifiers are the same in both locales.
Translate all reader facing metadata, including cover alternatives, highlights,
ratings and patch labels. Preserve sources, dates, factual scope and image paths.
Each guide must exist in both languages. Opening the database checks this.

Astro asks the guide API while rendering a page. The API reads the database. The body stays Markdown.
`apps/web/src/lib/i18n.ts` defines locales and page URL localization.
The shared layout emits localized HTML language, canonical, alternate language,
Open Graph and structured data metadata. Each edition searches its own content.
Markdown links are localized during rendering; assets and external links stay
unchanged. Localized UI components derive their language from the page URL;
React islands receive an explicit `locale` prop so SSR and hydration agree.

The content API defaults to English. Add `?lang=fr` for French, or `?lang=en`
for explicit English. This applies to `/api/guides`, individual guide endpoints
and `/api/servers`. Unsupported language values return HTTP 400.
Class votes and faction preference use the same identities across editions.

Validation: `make typecheck` and `make test`. Builds and development servers
must only be launched when explicitly requested.
