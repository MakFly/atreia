# syntax=docker/dockerfile:1.7
# Image unique : le serveur Hono sert l'API et le front buildé.

FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
COPY packages/content/package.json packages/content/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm typecheck && pnpm test && pnpm build

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
