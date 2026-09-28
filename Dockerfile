# One Dockerfile, two images: `--target api` (Fastify) and `--target web` (Next.js).
# tini is PID 1 in both, so SIGTERM reaches node and zombies are reaped.
# Pinned by digest (multi-arch index); Dependabot bumps the tag and digest together.
FROM node:26-alpine@sha256:0b36e8c136b94cd4fcf02188228e76c31ad5872eef3fec8cbd2eee500cfd9e80 AS base
RUN apk add --no-cache libc6-compat tini
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG API_URL=http://api:4000
ENV API_URL=$API_URL
RUN npm run build -w @coinkeeper/api && npm run build -w @coinkeeper/web

FROM base AS api-deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --omit=dev --workspace @coinkeeper/api --include-workspace-root=false

# Runtime stages start without npm, npx, corepack or yarn: nothing runs them there, and the
# npm bundle is where the image scanner finds most advisories.
FROM base AS runtime
RUN rm -rf /usr/local/lib/node_modules /opt/yarn-* \
  /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg

FROM runtime AS api
ENV NODE_ENV=production
ENV API_HOST=0.0.0.0
ENV API_PORT=4000
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 coinkeeper
COPY --from=api-deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/drizzle ./apps/api/drizzle
USER coinkeeper
WORKDIR /app/apps/api
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:4000/api/v1/health/live').then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]
# Migrations are a separate one-shot command: `node dist/cli/migrate.js` (the `migrate` Compose service).
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]

FROM runtime AS web
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
# /sign-in is public (the route guard does not redirect it) and needs no API call to render.
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/sign-in').then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/web/server.js"]
