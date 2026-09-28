# Compose runtime hardening

> Summary: how CoinKeeper's compose stack runs safely today (the one-shot migrate service, the x-hardening anchor with read-only filesystems, tmpfs, dropped capabilities and no-new-privileges, per-service limits, loopback-only ports, the backup profile) and what to keep, plus the remaining gaps: compose secrets and a production override with a TLS reverse proxy that keeps COOKIE_SECURE, ALLOWED_ORIGINS and TRUST_PROXY consistent.

## Contents

- Migrate job
- Restrictions for every service
- PostgreSQL
- pg_stat_statements
- Secrets
- Production override with a TLS proxy
- Proxy trust and the rate limit
- Backups

## Migrate job

Migrations run once per deployment, before the API starts, from the same image. A second API replica then does not race the first on `drizzle.__drizzle_migrations`, and a failed migration stops the rollout instead of looping in `restart: unless-stopped`. The service as it is in `docker-compose.yml` (abridged):

```yaml
services:
  migrate:
    profiles: ['app']
    build: &api-build
      context: .
      target: api
    <<: *hardening
    mem_limit: 256m
    pids_limit: 64
    command: ['node', 'dist/cli/migrate.js']
    environment:
      DATABASE_URL: *database-url
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      disable: true
    restart: 'no'

  api:
    build: *api-build
    depends_on:
      migrate:
        condition: service_completed_successfully
```

- `healthcheck: disable: true` switches off the `HEALTHCHECK` the image inherits from the `api` stage. Without it, the probe would hit port 4000, where nothing listens.
- The image's `CMD` already starts only the server, so `api` needs no `command:`.
- Migrations must be backward compatible with the API version still running (expand, then contract). The `database-change` skill owns the SQL.
- Take a backup before any destructive migration (see Backups).

## Restrictions for every service

One anchor gives every service the same restrictions; each service adds its own limits:

```yaml
x-hardening: &hardening
  read_only: true
  cap_drop: [ALL]
  security_opt: ['no-new-privileges:true']
  tmpfs:
    - /tmp:size=64m
```

| Service    | Limits                                            | Extra                                                                                        |
| ---------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `postgres` | `mem_limit: 1g`, `pids_limit: 512`                | `cap_add` for its entrypoint, `shm_size: 256m`, tmpfs `/var/run/postgresql` (see PostgreSQL) |
| `migrate`  | `mem_limit: 256m`, `pids_limit: 64`               | none                                                                                         |
| `api`      | `mem_limit: 512m`, `cpus: 1.0`, `pids_limit: 128` | none                                                                                         |
| `web`      | `mem_limit: 512m`, `cpus: 1.0`, `pids_limit: 128` | tmpfs `/app/apps/web/.next/cache:size=128m,uid=1001,gid=1001`                                |
| `backup`   | `mem_limit: 256m`, `pids_limit: 64`               | runs as `${BACKUP_UID}:${BACKUP_GID}`                                                        |

- `init: true` is not set: both images already run `tini` as PID 1 (see `dockerfile.md` › Process and signals). Add it only for an image without `tini`, never on top of it.
- A service that lists its own `tmpfs:` replaces the anchor's list, so it repeats `/tmp` (as `postgres` and `web` do).
- The API writes nothing to disk: logs go to stdout and CSV imports arrive in the request body. Next.js standalone writes only under `.next/cache`, which is why `web` has that tmpfs owned by uid 1001. If a container logs `EROFS` or `EACCES`, find the path and add a sized tmpfs for it; never drop `read_only`.
- Neither Node process needs any Linux capability: both listen on unprivileged ports (4000 and 3000).
- Size the API memory limit for argon2id: 19 MiB per concurrent hash, plus the heap, plus the pg pool. Watch `docker stats` during a burst of sign-ins before you lower it.
- Keep `restart: unless-stopped` on `api`, `web` and `postgres`, and `restart: 'no'` on `migrate` and `backup`.
- Ports: `postgres` on `127.0.0.1:${POSTGRES_PORT:-5432}`, `web` on `${WEB_BIND_ADDRESS:-127.0.0.1}:3000`, `api` not published. `WEB_BIND_ADDRESS=0.0.0.0` is only for a host where something else guarantees clients cannot reach port 3000 over plain HTTP.

## PostgreSQL

- The official entrypoint changes file ownership and drops to the `postgres` user, so `cap_drop: [ALL]` alone breaks the first start. The service drops everything through the anchor and adds back only what it needs:

  ```yaml
  postgres:
    <<: *hardening
    cap_add: [CHOWN, DAC_OVERRIDE, FOWNER, SETGID, SETUID]
    tmpfs:
      - /tmp:size=64m
      - /var/run/postgresql:size=16m
    shm_size: 256m
  ```

- `read_only: true` works for PostgreSQL because the data lives on the named volume and the socket directory is a tmpfs. Test any change on a fresh volume and on an existing one before keeping it.
- The `pg_isready` healthcheck gates `migrate` and `backup` (`service_healthy`).
- Keep the port bound to `127.0.0.1`. Production needs no host port at all: remove `ports` in the override.

## pg_stat_statements

This skill owns the compose change; `database-change` (`query-plans.md`) owns reading the statistics. Check `docker-compose.yml` for an existing `command:` on `postgres` first. To preload the library:

```yaml
postgres:
  command: ['postgres', '-c', 'shared_preload_libraries=pg_stat_statements']
```

- Preloading needs a restart of the `postgres` service, not a new volume.
- The extension itself is created once with psql (`CREATE EXTENSION IF NOT EXISTS pg_stat_statements;`), never in a Drizzle migration: PGlite, which runs every migration in the tests, does not provide it.

## Secrets

- PostgreSQL reads `POSTGRES_PASSWORD_FILE`:

  ```yaml
  secrets:
    postgres_password:
      file: ./secrets/postgres_password

  services:
    postgres:
      environment:
        POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
      secrets: [postgres_password]
  ```

- This is still a gap: `POSTGRES_PASSWORD` comes from `.env` and is interpolated into the `postgres` environment, the `x-database-url` anchor (used by `migrate` and `api`) and the `backup` service's `PGPASSWORD`. A secret file replaces all three.
- The API reads only `DATABASE_URL` from the environment, and `config.ts` has no `_FILE` variant. Adding `DATABASE_URL_FILE` is an application change for `fastify-api`: parse it in `config.ts` with Zod, test it in `config.test.ts` and document it. Until then, keep `DATABASE_URL` in the environment and keep `.env` out of the image. `.dockerignore` already excludes it.
- A secrets folder has to be git-ignored before anything is written into it. Changing `.gitignore` is a tracked change, so mention it in the commit.

## Production override with a TLS proxy

Keep `docker-compose.yml` as the local stack. It is already safe by default for one host: `COOKIE_SECURE` defaults to `true`, `TRUST_PROXY` to `false`, and `web` listens on loopback only. `docs/getting-started/setup.md` › Running in Docker documents a reverse proxy on the host (Caddy or nginx forwarding to `127.0.0.1:3000`). No production override exists in the repository yet. When one is wanted, put production differences in an override file, used as `docker compose -f docker-compose.yml -f compose.prod.yml --profile app up -d`, in this shape:

```yaml
services:
  proxy:
    image: caddy:2-alpine@sha256:<digest>
    profiles: ['app']
    ports: ['80:80', '443:443']
    volumes:
      - ./deploy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    depends_on:
      web:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - app-network

  web:
    ports: !reset []

  api:
    environment:
      ALLOWED_ORIGINS: https://budget.example.com
      TRUST_PROXY: uniquelocal

  postgres:
    ports: !reset []

volumes:
  caddy-data:
  caddy-config:
```

```
budget.example.com {
	encode zstd gzip
	header Strict-Transport-Security "max-age=31536000; includeSubDomains"
	reverse_proxy web:3000
}
```

- `!reset []` (Compose 2.24 or later) removes the port lists inherited from the base file, so that only the proxy is published.
- Caddy obtains and renews certificates automatically when the domain resolves publicly. For a LAN-only host, use `tls internal` and install Caddy's root certificate on the clients.
- `COOKIE_SECURE` needs no override: compose already defaults it to `true`, and `config.ts` then names the cookie `__Host-ck_session`. Browsers accept that cookie only over HTTPS (and on `http://localhost`), with `Path=/` and no `Domain`. Sessions from the plain-HTTP cookie `ck_session` do not carry over, so users sign in once more.
- `ALLOWED_ORIGINS` must match the browser's origin exactly: scheme, host, and port if it is not the default.
- HSTS on pages comes from the proxy. `@fastify/helmet` adds it only to `/api` responses, and `next.config.ts` does not set it.
- Pin the Caddy image by digest; Dependabot's `docker-compose` entry watches `docker-compose.yml` at the root, so check that it also picks up the override file.
- Give the proxy the same restrictions as the other services (YAML anchors do not cross files, so repeat them). With `cap_drop: [ALL]`, Caddy binding ports 80 and 443 needs `NET_BIND_SERVICE` added back; test the start before keeping `read_only`.

## Proxy trust and the rate limit

The request path is: browser → proxy → Next.js rewrite → Fastify. `request.ip` is the rate-limit key for sign-up, sign-in and password change, and the address shown in the session list. Check how `config.ts` parses `TRUST_PROXY` before choosing a value (`grep -n "TRUST_PROXY\|isProxyAddress" apps/api/src/config.ts`). Today it accepts `false` or a comma list of IP addresses, CIDR ranges and `loopback`, `linklocal`, `uniquelocal`; `true` and hop counts are rejected at start-up. With a list, Fastify walks `X-Forwarded-For` from the right and takes the first address that is not trusted.

- Next.js does not add its own `X-Forwarded-For` entry: it fills the header in only when the request has none, and otherwise forwards what the client sent. Behind Next.js alone the header proves nothing, so `TRUST_PROXY` stays `false` and the API uses the web container's address: one bucket for all clients. That is safe but can throttle everyone at once; the fix is a proxy, not a wider trust list.
- Safe setup: the proxy is the only way to reach `web`, and it **replaces** `X-Forwarded-For` with the address it received the connection from. Caddy does by default, because it ignores incoming `X-Forwarded-*` headers from clients unless `trusted_proxies` is configured; with nginx use `proxy_set_header X-Forwarded-For $remote_addr;`. Leave Caddy's `trusted_proxies` unset unless another proxy sits in front. Then set `TRUST_PROXY` to the compose network's subnet (`docker network inspect <project>_app-network`) or `uniquelocal`; for a proxy on the host forwarding to `npm start`, `loopback`.
- A CDN in front (Cloudflare's orange cloud): every connection then comes from a CDN edge, so Caddy must trust exactly the CDN's published ranges (`trusted_proxies static <ranges>`, optionally `client_ip_headers CF-Connecting-IP`), or every visitor shares the edge's rate-limit bucket. Never trust `0.0.0.0/0` or a blanket range.
- Unsafe setup: `web` reachable directly (published on a public interface, or `WEB_BIND_ADDRESS=0.0.0.0` without a firewall) while `TRUST_PROXY` lists a range that includes the path a client connects through. A client can then send any `X-Forwarded-For` it likes and get a fresh rate-limit bucket on every request.
- To check it, send `curl -s -o /dev/null -w '%{http_code}\n' -H 'X-Forwarded-For: 203.0.113.9' -H 'Origin: https://<host>' -H 'Content-Type: application/json' -d '{"email":"nobody@example.com","password":"wrong-password-123"}' https://<host>/api/v1/auth/sign-in` more than `AUTH_ATTEMPTS_PER_MINUTE` times, changing the forged IP on each call. Every call after the limit must answer `429`. If they do not, the forged header is being trusted. (The per-account failure limit, `SIGN_IN_FAILURES_PER_ACCOUNT`, also answers `429` for one email; use a different email per call if you want to test the per-IP limit alone.)
- Parser changes (new accepted forms) are owned by `fastify-api` (`production.md` › Process-wide state and background work); hand them over rather than editing `config.ts` here.

## Backups

A named volume is not a backup. The `backup` service (profile `backup`) is a one-shot on `app-network` using the digest-pinned `postgres` image, run as `docker compose --profile backup run --rm backup`:

- It writes `pg_dump --format=custom` to `<archive>.partial`, checks it with `pg_restore --list`, renames it to `${PGDATABASE}-<UTC timestamp>.dump` in `BACKUP_DIR` (`./backups`, git-ignored and in `.dockerignore`), and deletes archives older than `BACKUP_RETENTION_DAYS` (14). A `trap` removes the partial file on failure.
- It runs as `BACKUP_UID:BACKUP_GID` so the files belong to the host user; create `backups/` first, or Docker creates it owned by root.
- The `stack` job in `.github/workflows/docker.yml` takes a backup, restores it into a scratch database with `pg_restore --exit-on-error` and checks the migrations table: that is the restore drill, documented in `docs/getting-started/setup.md` › Backups and restore.

Keep the verification step and the restore drill when changing it. Still to do on a real host: schedule it (cron or a timer calling the same command) and copy the archives off the host. Take a dump before every destructive migration.
