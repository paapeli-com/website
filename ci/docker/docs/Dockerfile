# Base images come from our own registry: Docker Hub refuses requests from
# Iran (403), so the build runner cannot pull them from there.
ARG BASE_REGISTRY=registry.paapeli.me

FROM ${BASE_REGISTRY}/node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/docs apps/docs
COPY apps/web/src/assets apps/web/src/assets
COPY packages packages
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @paapeli/docs build

FROM ${BASE_REGISTRY}/nginx:alpine
COPY --from=builder /app/apps/docs/storybook-static /usr/share/nginx/html
EXPOSE 80
