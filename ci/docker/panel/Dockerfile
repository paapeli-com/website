FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# apps/panel/login and apps/panel/host are nested under apps/panel, so this
# one COPY covers the entry server (dev-server.mjs/prod-server.mjs), the
# login project, and the micro-frontend host.
COPY apps/panel apps/panel
COPY apps/product/aiot/factory apps/product/aiot/factory
COPY apps/product/aiot/track apps/product/aiot/track
COPY packages packages
RUN pnpm install --frozen-lockfile
# Four independent Vite builds. `base` is baked in at build time
# (/AIoT/SmartFactory/, /AIoT/GPSTracking/, and "/" for host and login), so
# the static output is host-ready. factory/track expose remoteEntry.js for
# the host to consume via Module Federation at runtime.
RUN pnpm --filter factory build
RUN pnpm --filter track build
RUN pnpm --filter host build
RUN pnpm --filter login build

FROM node:20-alpine AS runner
ENV NODE_ENV=production PORT=8080
WORKDIR /app
# Vite builds — served as static files by the entry server.
COPY --from=builder /app/apps/product/aiot/factory/dist ./apps/product/aiot/factory/dist
COPY --from=builder /app/apps/product/aiot/track/dist ./apps/product/aiot/track/dist
COPY --from=builder /app/apps/panel/host/dist ./apps/panel/host/dist
COPY --from=builder /app/apps/panel/login/dist ./apps/panel/login/dist
# The single-origin entry server (panel.paapeli.com).
COPY --from=builder /app/apps/panel/prod-server.mjs ./prod-server.mjs
EXPOSE 8080
CMD ["node", "prod-server.mjs"]
