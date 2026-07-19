FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web apps/web
COPY apps/panel apps/panel
COPY packages packages
RUN pnpm install --frozen-lockfile
# The two AIoT solutions (Vite SPAs). `base` is baked in at build time
# (/AIoT/SmartFactory/ and /AIoT/track/), so the static output is host-ready.
RUN pnpm --filter factory build
RUN pnpm --filter track build
# The marketing/login site (Next.js, standalone output).
RUN pnpm --filter paapeli_web build

FROM node:20-alpine AS runner
ENV NODE_ENV=production PORT=8080 WEB_PORT=3100
WORKDIR /app
# Next.js (web) standalone — run internally on WEB_PORT, proxied by the host.
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
# Vite SPAs — served as static files by the host.
COPY --from=builder /app/apps/panel/factory/dist ./apps/panel/factory/dist
COPY --from=builder /app/apps/panel/track/dist ./apps/panel/track/dist
# The single-origin host server (serves the SPAs + proxies to web) and the
# product-agnostic login page it serves at /login.
COPY --from=builder /app/apps/panel/prod-server.mjs ./prod-server.mjs
COPY --from=builder /app/apps/panel/login.html ./login.html
EXPOSE 8080
CMD ["node", "prod-server.mjs"]
