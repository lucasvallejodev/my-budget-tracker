# Dockerfile rules

> Summary: stage-by-stage rules for CoinKeeper's single multi-target Dockerfile as it stands (digest-pinned Alpine base with tini, production-only dependencies, an npm-free runtime stage, tini plus exec-form CMD, healthchecks for api and web, .dockerignore) and what to keep when changing it, plus npm cache mounts, distroless trade-offs and multi-arch builds.

## Shape to keep

```
base (node:24-alpine@sha256:…, apk add libc6-compat tini)
├─ deps       npm ci for every workspace
├─ builder    full source, ARG API_URL, npm run build -w @coinkeeper/api and -w @coinkeeper/web
├─ api-deps   npm ci --omit=dev --workspace @coinkeeper/api --include-workspace-root=false
└─ runtime    removes npm, npx, corepack and yarn
   ├─ api     prod node_modules + apps/api/dist + apps/api/drizzle, user coinkeeper (1001)
   └─ web     .next/standalone + .next/static + public, user nextjs (1001)
```

The `api` image bundles `@coinkeeper/shared` into `dist/` (tsup `noExternal`), so it does not need the shared package at runtime. The `web` image does not need `node_modules` because standalone output traces what it needs. Nothing in the runtime images calls npm, and the npm bundle is where image scanners find most advisories, so the `runtime` stage deletes it; keep any new runtime stage on top of `runtime`, not `base`.

## Base image

- The tag and the digest are pinned together: `FROM node:24-alpine@sha256:<digest> AS base`. To change it, get the digest with `docker buildx imagetools inspect node:24-alpine` (the top-level `Digest:` is the multi-arch index, which is the one to pin). The tag stays readable for people, and the digest makes builds reproducible. Dependabot's `docker` ecosystem bumps both (see `ci-supply-chain.md`).
- `postgres:17-alpine` is pinned the same way in compose (the `postgres` and `backup` services) and in `playwright.yml`; change all three together.
- `libc6-compat` is added in `base` for Next.js on Alpine. Before you remove it, build `web` without it and start the container. `tini` is added there too; see Process and signals.
- Alpine packages are not version-pinned; `docker.yml` runs hadolint with `DL3018` ignored for that reason, because the digest pins the package set.
- If you add cache mounts, add the BuildKit syntax line as the first line so that they work on every builder: `# syntax=docker/dockerfile:1`. It is a parser directive, not a comment.

## Dependencies

- The `npm ci` steps do not use a cache mount today (CI caches layers with `cache-from: type=gha`). To speed up local rebuilds, install with a cache mount so they skip the network without growing a layer:

  ```dockerfile
  RUN --mount=type=cache,target=/root/.npm npm ci
  ```

- `api-deps` must keep `--omit=dev` and the workspace flags. `drizzle-kit`, `tsx`, `tsup` and PGlite are dev dependencies and must not reach the runtime image. Check this with `docker run --rm coinkeeper-api:check ls node_modules/.bin`.
- Never `COPY . .` into a runtime stage. Runtime stages copy only the artifacts listed in the shape above.
- If the lockfile was regenerated on Windows or macOS, confirm it still lists the Linux prebuilds before building: `grep -c "argon2-linux-x64-musl\|swc-linux-x64-musl" package-lock.json` should print 2 or more.

## Process and signals

- Both runtime stages run `tini` as PID 1 and Node through an exec-form `CMD`, so `SIGTERM` reaches Node and zombies are reaped:

  ```dockerfile
  ENTRYPOINT ["/sbin/tini", "--"]
  CMD ["node", "dist/server.js"]
  ```

- Keep exactly one init. With `tini` in the image, compose does not set `init: true` (the compose file says so). An image without `tini` (distroless, below) needs `init: true` on the app services or a statically linked `tini` copied in.
- Do not chain migrations into the API command. They run as the `migrate` compose service, which uses the same image with `command: ['node', 'dist/cli/migrate.js']` (see `compose-runtime.md`). If a single-container deployment really must migrate at start, use `CMD ["sh", "-c", "node dist/cli/migrate.js && exec node dist/server.js"]` after the `tini` entrypoint. The `exec` replaces the shell with Node, so Node receives the signal from `tini`.
- Keep `ENV NODE_ENV=production` in both runtime stages. The API derives the secure cookie default and `API_DOCS=false` from it.

## Healthchecks

- Endpoint names come from the `fastify-api` skill (`production.md` › Liveness and readiness). The `api` stage's `HEALTHCHECK` calls liveness, `GET /api/v1/health/live`, which never touches the database. Keep it there. Readiness, `GET /api/v1/health/ready`, answers `503 UNAVAILABLE` when the database is down and is for routing, not for restarts. The old `/api/v1/health` answers `404`, so a probe still pointing at it marks the container unhealthy.
- Probe with exec-form `node -e fetch(…)`. Alpine has no `curl`; do not install it just for a probe, and the exec form keeps working in an image without a shell.
- The `web` stage checks a public page the route guard does not redirect and that needs no API call to render, with a start period for the first Next.js start:

  ```dockerfile
  HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:3000/sign-in').then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]
  ```

- The `migrate` service inherits the `api` healthcheck and switches it off (`healthcheck: disable: true`), because nothing listens there.

- A database outage should not restart the API container, which is why the Docker healthcheck uses liveness.

## .dockerignore

It excludes `**/node_modules`, `**/.next`, `**/dist`, `.git`, `.github`, `.claude`, `.env` and `.env.*` (with `!.env.example`), `agents`, `backups`, `coverage`, `docs`, `e2e`, `playwright-report`, `test-results`, `temp` and `*.tsbuildinfo`. Keep them: they are not needed to build, some hold secrets or dumps (`.env`, `backups`), and they bust the layer cache. A new top-level folder that the build does not read joins the list.

## Distroless or slim

- `gcr.io/distroless/nodejs24-debian12` (or a newer Debian release) has no shell and no package manager, and runs as `nonroot`. It uses glibc: build in `node:24-bookworm-slim` so that `npm ci` installs the `-gnu` prebuilds. The `sh -c` fallback above is then unavailable, so keep the separate migrate service. Healthchecks must use exec form with the image's `node`, as shown above.
- The apk-installed `/sbin/tini` does not exist there: use `init: true` on the app services or copy a static `tini`. Distroless Node images set `node` as `ENTRYPOINT`, so a `CMD` or compose `command:` that starts with `node` would run `node node …`; drop the leading `node` or reset the entrypoint.
- The image user `nonroot` has uid 65532, not 1001: drop `addgroup`/`adduser` and the `--chown=nextjs:nodejs` names, and adjust volume and tmpfs ownership (the `web` cache tmpfs sets `uid=1001,gid=1001` today).
- Compare size and CVE count before and after with `docker image ls` and Grype or Trivy. Switch only when the numbers justify the extra moving parts. The `runtime` stage already removes npm, which removes most of the Alpine image's advisories.

## Multi-arch

- Build both platforms with buildx. Both native modules have arm64 prebuilds in the lockfile.

  ```bash
  docker buildx build --platform linux/amd64,linux/arm64 --target api -t <registry>/coinkeeper-api:<git-sha> --push .
  ```

- A multi-platform build cannot `--load` into the local image store. Push it to a registry, or build one platform at a time for local checks. `docker.yml` builds `linux/amd64` only, with `load: true`, for its scan and smoke test.

## Labels

Add OCI labels in the runtime stages when images are pushed (`org.opencontainers.image.source`, `org.opencontainers.image.revision` from a `GIT_SHA` build argument). Tag images with the git SHA, never only `latest`.
