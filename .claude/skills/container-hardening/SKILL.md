---
name: container-hardening
description: Hardens CoinKeeper's containers and CI supply chain, meaning the multi-target Dockerfile (api and web), docker-compose.yml, .dockerignore and .github/workflows. Covers PID 1 and signals, a one-shot migrate service, digest-pinned images, production-only dependencies, non-root users, read-only filesystems with tmpfs, dropped capabilities, no-new-privileges, resource limits, healthchecks, secrets, a TLS reverse proxy with COOKIE_SECURE and TRUST_PROXY, multi-arch builds, SHA-pinned actions, least-privilege permissions, npm audit or OSV, CodeQL, gitleaks, image scans, SBOMs and the Dependabot configuration. Use when the user mentions Docker, Dockerfile, compose, containerize, image size, healthcheck, HTTPS or reverse proxy, GitHub Actions security, pinning actions or dependency scanning. Not for code, timeouts or logging in apps/api (use fastify-api), schema or migration SQL (use database-change), Playwright CI (use e2e-playwright) or auditing auth code (use api-security-review).
---

# Container hardening

Keep the two images and the compose stack safe to run on a real host, and keep the CI pipeline that builds them trustworthy. One `Dockerfile` builds both images (`--target api`, `--target web`). `docker-compose.yml` runs `postgres` all the time, `migrate`, `api` and `web` under the `app` profile, and a one-shot `backup` under the `backup` profile. The workflows in `.github/workflows/` lint, audit, test with coverage and build (`quality.yml`), run end-to-end tests (`playwright.yml`), scan with Sonar (`sonar.yml`), CodeQL (`codeql.yml`) and gitleaks (`secrets.yml`), and lint, build, scan and smoke-test the images (`docker.yml`). Every change here is infrastructure: keep application code untouched and hand API changes to `fastify-api`.

## Before you start

- Read `agents/architecture.md` (request flow: browser → Next.js rewrite → Fastify → PostgreSQL) and `docs/architecture/api.md` › Who can reach the API, › Behind a reverse proxy and › Configuration.
- Read `docs/getting-started/setup.md` › Running in Docker and › Backups and restore. Those are the pages you will update.
- Read the current `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `.env.example`, `.github/dependabot.yml` and every file in `.github/workflows/` in full. Do not trust any description of them, this one included: most rows of the stock-taking table below pass today, and your job is often to keep them passing.

## Facts that shape every decision

- `apps/api/src/server.ts` stops the session purge timer on SIGINT and SIGTERM and calls `shutDown` (`apps/api/src/shutdown.ts`): it closes Fastify, then the pool, within `SHUTDOWN_TIMEOUT_MS` (8 s, under Docker's 10 s grace period) and exits `0`, or `1` on failure. That only happens if the Node process actually receives the signal. A shell (`sh -c "a && b"`) running as PID 1 does not pass signals on, so Docker kills the process with SIGKILL after 10 s (exit code 137). Both images therefore run `tini` (installed with `apk` in `base`) as `ENTRYPOINT ["/sbin/tini", "--"]` with an exec-form `CMD`, and compose does not add `init: true` on top.
- `apps/api/src/cli/migrate.ts` finds `drizzle/` from the current directory (`path.resolve('drizzle')`). Any container that runs `node dist/cli/migrate.js` needs `WORKDIR /app/apps/api`, which the `api` stage sets. The migrator opens its pool without a statement timeout.
- The web image reads `API_URL` at build time: `next.config.ts` rewrites `/api/:path*` to it. It is a build argument (`ARG API_URL=http://api:4000`). Setting it as a runtime environment variable has no effect.
- `apps/api/src/config.ts` reads `ALLOWED_ORIGINS`, `API_DOCS`, `API_HOST`, `API_PORT`, `AUTH_ATTEMPTS_PER_MINUTE`, `COOKIE_SECURE`, `CORS_ORIGINS`, `DATABASE_URL`, `HANDLER_TIMEOUT_MS`, `LOG_LEVEL`, `NODE_ENV`, `SESSION_DAYS`, `SESSION_MAX_AGE_DAYS`, `SIGN_IN_FAILURES_PER_ACCOUNT` and `TRUST_PROXY`. Compose has no `env_file`: the `api` service lists each variable under `environment:`, and an empty value falls back to the `config.ts` default. Compose sets its own defaults for two of them: `COOKIE_SECURE` `${COOKIE_SECURE:-true}` (in `config.ts` the default is secure only when `NODE_ENV=production`) and `TRUST_PROXY` `${TRUST_PROXY:-false}`. A new variable is an application change: add it to `config.ts`, `.env.example` and the configuration table in `docs/architecture/api.md` through `fastify-api`, then list it in the compose `api` environment here.
- `TRUST_PROXY` accepts `false` or a comma list of IP addresses, CIDR ranges and `loopback`, `linklocal`, `uniquelocal`; `true` and hop counts stop the API at start-up (`TRUST_PROXY_ERROR`). Next.js does not add its own `X-Forwarded-For` entry and forwards what the client sent, so behind Next.js alone the header proves nothing.
- Native prebuilds: `@node-rs/argon2` and `@next/swc` resolve per libc and CPU from `package-lock.json`, which lists musl and gnu builds for x64 and arm64. Run `npm ci` on the same libc as the runtime stage. Moving from Alpine (musl) to Debian or distroless (glibc) means every stage changes together.
- Every argon2id hash takes 19 MiB (`HashOptions` in `apps/api/src/auth/passwords.ts`). Concurrent sign-ins multiply that, so leave headroom in the API memory limit (`mem_limit: 512m` today).
- The API is deliberately not published. Only `web` reaches it, over `app-network`. PostgreSQL is bound to `127.0.0.1`, and `web` to `${WEB_BIND_ADDRESS:-127.0.0.1}`. Keep all three properties in every change.

## Workflow

1. **Take stock.** Run the checks below and write down which ones pass. The right-hand column describes the hardened setup, which is what the repository implements today except where it says "gap". Treat a row that no longer passes as a regression.

   | Check                     | Command                                                                                                          | Passes when                                                                                                                                                                                                                         |
   | ------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | Node receives signals     | `grep -n "^CMD\|^ENTRYPOINT" Dockerfile` and `grep -n "init:" docker-compose.yml`                                | exec-form `CMD ["node", …]` in both targets, no `sh -c` chain, and exactly one init: `tini` as `ENTRYPOINT` in the image (today) or `init: true` on the app services                                                                |
   | Migrations run once       | `grep -n "migrate" Dockerfile docker-compose.yml`                                                                | the `api` CMD starts only the server; the one-shot `migrate` service exits before `api` starts (`service_completed_successfully`)                                                                                                   |
   | Base images pinned        | `grep -n "^FROM" Dockerfile` and `grep -rn "image:\|docker run" docker-compose.yml .github/workflows`            | every image is `name:tag@sha256:…` (the Node base, `postgres` and `backup` in compose, the Playwright service, the gitleaks image)                                                                                                  |
   | Lean runtime              | `grep -n "AS runtime" -A3 Dockerfile`                                                                            | the `runtime` stage deletes npm, npx, corepack and yarn; `api` copies only production `node_modules`, `dist` and `drizzle`; `web` only the standalone output                                                                        |
   | Both images healthchecked | `grep -n "HEALTHCHECK" Dockerfile`                                                                               | `api` probes `/api/v1/health/live`, `web` probes `/sign-in`, both with exec-form `node -e fetch(…)`; `migrate` disables the inherited one                                                                                           |
   | Runtime restricted        | `grep -nE "x-hardening\|read_only\|cap_drop\|no-new-privileges\|pids_limit\|mem_limit\|cpus" docker-compose.yml` | the `x-hardening` anchor (`read_only`, `cap_drop: [ALL]`, `no-new-privileges`, `/tmp` tmpfs) on every service; `mem_limit` and `pids_limit` on each, `cpus` on `api` and `web`; `postgres` adds back only what its entrypoint needs |
   | Backups                   | `grep -n "backup" docker-compose.yml`                                                                            | the `backup` profile writes a verified `pg_dump -Fc` archive with retention, and `docker.yml` restores one into a scratch database                                                                                                  |
   | Secrets not in env        | `grep -n "PASSWORD\|secrets:" docker-compose.yml`                                                                | gap today: the PostgreSQL password is still an environment variable; the target is a compose secret (`POSTGRES_PASSWORD_FILE`)                                                                                                      |
   | Edge settings coupled     | `grep -n "COOKIE_SECURE\|TRUST_PROXY\|ALLOWED_ORIGINS\|WEB_BIND" docker-compose.yml .env.example`                | compose defaults to a secure cookie, `TRUST_PROXY=false` and a loopback-only `web`; gap today: no production override with a TLS proxy in the repository (the setup page documents a host proxy)                                    |
   | Actions pinned and scoped | `grep -n "uses:\|permissions:\|persist-credentials" .github/workflows/*.yml`                                     | every `uses:` is a 40-character SHA with a `# vX.Y.Z` marker; every workflow sets top-level `permissions: contents: read`; every checkout sets `persist-credentials: false`                                                         |
   | Updates and scans         | `cat .github/dependabot.yml` and `ls .github/workflows`                                                          | Dependabot covers npm, github-actions, docker and docker-compose; `quality.yml` runs `npm audit` and `npm audit signatures`; `codeql.yml`, `secrets.yml` and `docker.yml` (hadolint, SBOM, Grype, compose smoke test) exist         |

2. **Choose one concern per change**, in this order: signals and migrations; the TLS edge and its cookie and proxy settings; runtime restrictions and healthchecks; pinning and secrets; CI supply chain; multi-arch. Each concern gets its own commit.
3. **Apply the rules** in the reference for that area (table below). Keep what already works: `tini` as PID 1 with exec-form `CMD`, the `migrate` one-shot, digest pins, the npm-free `runtime` stage, non-root users with uid 1001, the `api-deps` stage installing production dependencies only (`npm ci --omit=dev --workspace @coinkeeper/api --include-workspace-root=false`), Next.js `standalone` output, the `x-hardening` anchor and limits, both healthchecks, the unpublished API, loopback-only ports, the healthcheck-gated `depends_on`, the backup profile and the workflow hardening. A change that removes one of them needs a stated reason.
4. **Keep the settings coupled.** `COOKIE_SECURE=true` requires HTTPS at the browser (Chromium also accepts the `Secure` cookie on `http://localhost`). `ALLOWED_ORIGINS` must be exactly the public `https://` origin, or every write answers `403 ORIGIN_NOT_ALLOWED`. For `TRUST_PROXY`, run `grep -n "TRUST_PROXY\|isProxyAddress" apps/api/src/config.ts` before choosing a value and use only a form the parser accepts. Keep `false` unless a reverse proxy that replaces `X-Forwarded-For` (Caddy does by default; nginx with `proxy_set_header X-Forwarded-For $remote_addr`) is the only way to reach `web`; then set the compose network's subnet or `uniquelocal`. With `false`, the API sees every request coming from the web container, so the per-IP sign-in limit is shared by all clients: safe, but it can lock everyone out at once. Trusting a range that includes an address a client can connect from lets clients forge their IP and get past the per-IP limit. Changes to the parser itself belong to `fastify-api` (`production.md` › Process-wide state and background work).
5. **Verify** (below) and **update the docs**.

## References

| File                                                | Read it when                                                                                                                       |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| [dockerfile.md](references/dockerfile.md)           | Editing any stage: base image and digest, npm cache mounts, `.dockerignore`, exec-form CMD, healthchecks, distroless, multi-arch   |
| [compose-runtime.md](references/compose-runtime.md) | Editing compose: migrate job, `init`, read-only and tmpfs, capabilities, limits, `pg_stat_statements`, secrets, the Caddy override |
| [ci-supply-chain.md](references/ci-supply-chain.md) | Editing `.github/`: SHA pinning, `permissions:`, Dependabot, npm audit and OSV, CodeQL, gitleaks, image build, scan, SBOM          |
| [source.md](references/source.md)                   | Crediting or updating the upstream material                                                                                        |

## Verify

Run these for every container change, and report the real output:

```bash
docker build --target api -t coinkeeper-api:check .
docker build --target web -t coinkeeper-web:check .
POSTGRES_PASSWORD=throwaway-local docker compose --profile app up -d --build --wait
docker compose ps
docker compose stop api && docker inspect --format '{{.State.ExitCode}}' "$(docker compose ps -aq api)"
docker run --rm -i hadolint/hadolint hadolint --ignore DL3018 - < Dockerfile
docker image ls "coinkeeper-*"
```

- `--wait` returns only once every healthcheck passes. If `stop` reports exit code `137`, the process was SIGKILLed and signals are still not reaching Node; `1` means `shutDown` hit its deadline or a close step failed (read `docker compose logs api`).
- With the stack up, sign up a throwaway account at `http://localhost:3000/sign-up` and import a small CSV. This proves the read-only filesystem and tmpfs mounts leave the app working. Check `docker compose logs api web` for `EROFS` or `EACCES`.
- Scan both images the way CI does (`docker.yml` runs Grype through `anchore/scan-action`, failing on fixable high and critical findings except the reviewed exceptions in `.grype.yaml`, and writes an SPDX SBOM with `anchore/sbom-action`): locally `docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v "$PWD/.grype.yaml:/.grype.yaml" anchore/grype coinkeeper-api:check -c /.grype.yaml --only-fixed --fail-on high`, or Trivy with `--severity HIGH,CRITICAL`. Do the same for web.
- A backup change: `mkdir -p backups && docker compose --profile backup run --rm backup`, then restore into a scratch database as the `stack` job in `docker.yml` does.
- For workflow changes, lint with `actionlint`, and optionally audit with `zizmor .github/workflows`. Then push a branch and confirm every job runs.
- If you touched any tracked TypeScript, JSON or Markdown, run the project gate: `npm run lint && npm run typecheck && npm test -- --run && npm run build`, then `npm run format:check`.

## Keep the docs true

Use `agents/docs-map.md`. Dockerfile, compose and `.env.example` changes update `docs/getting-started/setup.md` › Running in Docker, `docs/getting-started/commands.md`, `docs/architecture/api.md` › Configuration and the README setup section. Workflow changes update `docs/getting-started/setup.md` › SonarQube Cloud (the CI description) and `docs/architecture/code-style.md` where it lists tools. Describe a new service, profile or production override in the setup page, in the same commit.
