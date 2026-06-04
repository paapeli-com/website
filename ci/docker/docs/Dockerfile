FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/docs apps/docs
COPY packages packages
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @paapeli/docs build

FROM nginx:alpine
COPY --from=builder /app/apps/docs/storybook-static /usr/share/nginx/html
EXPOSE 80
