# Base images come from our own registry: Docker Hub refuses requests from
# Iran (403), so the build runner cannot pull them from there.
ARG BASE_REGISTRY=registry.paapeli.me

FROM ${BASE_REGISTRY}/node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web apps/web
COPY packages packages
RUN pnpm install --frozen-lockfile
RUN pnpm --filter paapeli_web build

FROM ${BASE_REGISTRY}/node:20-alpine AS runner
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
