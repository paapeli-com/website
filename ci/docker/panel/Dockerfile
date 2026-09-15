FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# The panel is a single app now (shell + features + the /login page), so one
# COPY covers the static server, both HTML entries, and every feature.
COPY apps/panel apps/panel
COPY packages packages
RUN pnpm install --frozen-lockfile
# The API origin the bundle talks to. Vite inlines it at build time, so it has
# to be set here and not on the runtime container.
#   docker build --build-arg PAAPELI_API_BASE_URL=https://gateway.example.com .
# The default is spelled out rather than left bare: a bare `ARG` expands to an
# EMPTY string when no --build-arg is passed, and an empty API origin makes the
# panel call its own domain, where server.mjs's SPA fallback returns the HTML
# shell with a 200 and every query resolves to markup. config.ts also treats
# blank as unset, so both ends have to fail before that can ship again.
ARG PAAPELI_API_BASE_URL=https://api.paapeli.me
ENV PAAPELI_API_BASE_URL=$PAAPELI_API_BASE_URL
# ONE Vite build. This used to be five independent builds whose outputs were
# stitched together at runtime via Module Federation; features are now
# build-time lazy chunks of this single build (see apps/panel/vite.config.ts).
RUN pnpm --filter panel build

FROM node:20-alpine AS runner
ENV NODE_ENV=production PORT=8080
WORKDIR /app
COPY --from=builder /app/apps/panel/dist ./dist
COPY --from=builder /app/apps/panel/server.mjs ./server.mjs
EXPOSE 8080
CMD ["node", "server.mjs"]
