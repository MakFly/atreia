# syntax=docker/dockerfile:1.7
# Image unique : le serveur Hono sert l'API et le front buildé.

FROM oven/bun:1.4.0 AS build
WORKDIR /repo
COPY package.json bun.lock tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
COPY packages/content/package.json packages/content/
RUN --mount=type=cache,id=atreia-bun,target=/root/.bun/install/cache bun install --frozen-lockfile
COPY . .
# URL publique obligatoire via Compose, vide par défaut pour les appels directs.
ARG SITE_URL=
ENV SITE_URL=${SITE_URL}
RUN bun run typecheck && bun run test && bun run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production PORT=8787 \
    CONTENT_DIR=/app/packages/content/guides \
    WEB_DIST_DIR=/app/apps/web/dist
WORKDIR /app
# Le bundle serveur embarque toutes ses dépendances : pas de node_modules en runtime.
COPY --from=build /repo/apps/server/dist apps/server/dist
COPY --from=build /repo/apps/web/dist apps/web/dist
COPY --from=build /repo/packages/content/guides packages/content/guides
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:8787/health || exit 1
CMD ["node", "--enable-source-maps", "apps/server/dist/index.js"]
