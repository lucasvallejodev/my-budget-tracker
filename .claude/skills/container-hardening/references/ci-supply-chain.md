# CI supply chain

> Summary: how CoinKeeper's GitHub Actions workflows and dependency intake are hardened today (least-privilege permissions, SHA-pinned actions, persist-credentials false, Dependabot, npm audit and signatures, CodeQL, gitleaks, docker.yml building, scanning and smoke-testing both images with an SBOM), what to keep when editing them, and what is left (OSV, pushing and signing images, workflow linting in CI).

## Contents

- Workflows to read first
- Permissions
- Pinning actions
- Dependency updates
- Dependency audit
- CodeQL
- Secret scanning
- Build and scan the images
- Workflow hygiene

## Workflows to read first

Read the files before editing. What they do today:

| Workflow         | Trigger                                 | Jobs and checks                                                                                                                                                       |
| ---------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `quality.yml`    | push and pull request to `main`         | `npm ci`, `npm audit --omit=dev --audit-level=high`, `npm audit signatures`, lint, typecheck, `npm run test:coverage` (fails below the coverage floors), jscpd, build |
| `playwright.yml` | push and pull request to `main`         | digest-pinned PostgreSQL 17 service, `db:migrate`, `db:check`, Playwright on Chromium, report artifact                                                                |
| `sonar.yml`      | push to `main`, pull requests           | `npm run test:coverage`, SonarQube Cloud scan; skipped for forks                                                                                                      |
| `codeql.yml`     | push and pull request to `main`, weekly | CodeQL `javascript-typescript`, `build-mode: none`, `security-extended`                                                                                               |
| `secrets.yml`    | push and pull request to `main`, weekly | gitleaks over the full history, from a digest-pinned image                                                                                                            |
| `docker.yml`     | push and pull request to `main`         | hadolint; build, SBOM and Grype scan per target; compose smoke test with backup, restore and a `SIGTERM` exit-code check                                              |

Every workflow sets `concurrency` with `cancel-in-progress` and a `timeout-minutes` per job. The Node workflows use Node 24 with `actions/setup-node` `cache: npm`. Add new checks as new jobs or workflows. Do not slow down `quality.yml`, which gates every pull request.

## Permissions

- Every workflow has a restrictive default at the top; a new one gets the same, and only the job that needs more widens it:

  ```yaml
  permissions:
    contents: read
  ```

- CodeQL and any SARIF upload need `security-events: write` on that job (`codeql.yml` grants it on `analyze` only). Uploading artifacts needs nothing extra. The Sonar scan needs only `contents: read`, because it authenticates with `SONAR_TOKEN`. Nothing pushes images, so no job has `packages: write`.
- Every `actions/checkout` sets `persist-credentials: false`, because no job pushes. It keeps the token out of `.git/config`, where later steps could read it. Keep it on new checkouts.
- Never use `pull_request_target` together with a checkout of the pull request head. That runs fork code with secrets. `sonar.yml` already skips forks instead.

## Pinning actions

- Every third-party and first-party action is pinned to a full commit SHA with the version as a trailing marker (`actions/checkout@3d3c42e5… # v7.0.1`). The marker is how update bots and people read the pin. The no-comments rule is an ESLint rule for TypeScript and JavaScript; it does not cover workflow YAML. A new step follows the same form:

  ```yaml
  - uses: actions/checkout@<40-char-commit-sha> # vX.Y.Z
  ```

- Reuse the SHA an existing workflow already pins for the same action and version, so Dependabot's grouped `actions` update moves them together.

- Resolve a tag to its commit with the peeled ref, because annotated tags point at a tag object: `git ls-remote https://github.com/actions/checkout 'refs/tags/v4.2.2^{}'`. Tools such as `pinact run` do this in bulk; Dependabot then keeps the pins and version markers updated.
- Why it matters: in March 2025 the `tj-actions/changed-files` tags were rewritten to point at malicious code, and every workflow that used a tag ran it. A SHA cannot be moved.
- Container images used in workflows are pinned by digest too: the `postgres` service in `playwright.yml` and the gitleaks image in `secrets.yml`. A new `docker run` of a tool image gets `name:tag@sha256:…`, never `latest`.

## Dependency updates

The repository uses Dependabot: read `.github/dependabot.yml` before changing it. It updates weekly and covers four ecosystems, with `build` commit prefixes for dependencies and images and `ci` for actions:

| Ecosystem        | Grouping                                                                  | Commit prefix |
| ---------------- | ------------------------------------------------------------------------- | ------------- |
| `npm`            | minor and patch in one pull request (`npm-minor-and-patch`); majors alone | `build`       |
| `github-actions` | every action in one pull request (`actions`)                              | `ci`          |
| `docker`         | none (the Dockerfile base image)                                          | `build`       |
| `docker-compose` | none (the images in `docker-compose.yml`)                                 | `build`       |

- `directory: /` covers every npm workspace through the root lockfile. Keep new entries weekly and grouped so the pull request count stays small.
- With actions and images pinned by SHA and digest, Dependabot bumps the pins and keeps the version marker in step. It does not see images started with `docker run` inside a `run:` step (the gitleaks image); bump those by hand.
- Renovate was considered and rejected: one bot is enough, and Dependabot needs no extra app. Do not add a `renovate.json`.
- Updates still go through `quality.yml` and `playwright.yml`. Do not auto-merge major versions of Fastify, Next.js, React, Zod, Drizzle or TanStack Query.

## Dependency audit

`quality.yml` runs these right after `npm ci`, so known high-severity vulnerabilities in production dependencies, or a package whose registry signature does not verify, fail the build:

```yaml
- name: Audit production dependencies
  run: npm audit --omit=dev --audit-level=high
- name: Verify registry signatures
  run: npm audit signatures
```

- One root `npm audit` covers every workspace, because they share `package-lock.json`.
- OSV-Scanner (the `google/osv-scanner-action` reusable workflow) reads the same lockfile and covers more advisory sources. It is not set up; add it as its own workflow if `npm audit` misses advisories you care about.
- Do not lower `--audit-level` or add `--omit` flags to get a green build; fix, update or document an accepted advisory in the pull request.
- A new runtime dependency in `apps/api` or `apps/web` needs a reason in the pull request (maintenance, download count, install scripts). The `api-security-review` skill checks this.

## CodeQL

`codeql.yml` runs on push and pull request to `main`, plus a weekly schedule, in this shape:

```yaml
permissions:
  contents: read

jobs:
  analyze:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@<sha> # vX
        with:
          persist-credentials: false
      - uses: github/codeql-action/init@<sha> # vX
        with:
          languages: javascript-typescript
          build-mode: none
          queries: security-extended
      - uses: github/codeql-action/analyze@<sha> # vX
```

TypeScript needs no build step for CodeQL. Sonar and `eslint-plugin-sonarjs` stay: CodeQL adds taint tracking, which they do not do.

## Secret scanning

- Turn on GitHub secret scanning and push protection in the repository settings. The user has to do this; it is an account setting.
- The platform setting is not enough on its own: `secrets.yml` runs gitleaks in CI on push, pull request and weekly, over the full history:

  ```yaml
  - uses: actions/checkout@<sha> # vX
    with:
      fetch-depth: 0
      persist-credentials: false
  - name: Scan every commit for secrets
    run: >-
      docker run --rm --user "$(id -u):$(id -g)" -v "$PWD:/repo:ro"
      ghcr.io/gitleaks/gitleaks:<version>@sha256:<digest>
      git --redact --verbose /repo
  ```

- Keep `fetch-depth: 0` (a shallow clone scans one commit), the read-only mount and `--redact`, so a finding never prints the secret into the log.

- If anything was ever committed, rotate it. Deleting it from history is not enough. `.env` is git-ignored; `.env.example` holds placeholders only (`CHANGE_ME`).

## Build and scan the images

`docker.yml` builds the images on every push and pull request to `main`, so a broken `Dockerfile` fails before anyone deploys. Its jobs:

- `hadolint` lints the `Dockerfile` (`failure-threshold: warning`, `DL3018` ignored because the base image digest pins the Alpine packages).
- `image`, a matrix over `api` and `web` (`fail-fast: false`): `docker/setup-buildx-action`, then `docker/build-push-action` with `target`, `load: true` and a per-target GHA cache (`cache-from`/`cache-to type=gha,scope=<target>`); `anchore/sbom-action` writes an SPDX SBOM from the loaded image and uploads it as `sbom-<target>.spdx.json`; a **Check the scan exceptions** step (awk over `.grype.yaml`) fails when an exception has no `reason`, no `expires` or an expired date; then `anchore/scan-action` (Grype, `id: scan` with `continue-on-error`, followed by one identical retry step when its outcome is `failure`, because the Grype download and database fetch fail transiently) fails on fixable high and critical findings (`severity-cutoff: high`, `only-fixed: true`) and its report goes to the step summary and an artifact. Grype reads `.grype.yaml` from the repository root by itself (its `ignore` rules accept `reason`; the extra `expires` key is ignored by Grype and enforced by that step).
- `stack`: `docker compose --profile app up -d --build --wait` with a throwaway `POSTGRES_PASSWORD`, `curl` on `/sign-in`, a backup and restore into a scratch database, `docker compose stop api` with exit code `0`, logs on failure, `down -v` always.

What to keep when editing it:

- SBOM: with `load: true`, BuildKit attestations (`sbom: true`, `provenance: mode=max`) are not stored, because the local image store drops them. That is why the SBOM comes from the loaded image with Syft (`anchore/sbom-action`). Attestations become an option only when the job pushes to a registry with those inputs set.
- The scan policy (chosen deliberately): fail on **high and critical** findings that have a fix; accept an unfixable or unreachable finding only as a reviewed exception in `.grype.yaml` with `vulnerability`, `package.name`, a `reason` and a short `expires` date (the human procedure is `docs/getting-started/setup.md` › Image scan exceptions). Never lower `severity-cutoff`, drop `only-fixed`, or set `fail-build: false` to get a green build; renew an expired exception only after re-reading the advisory, and mention every exception in the pull request. Trivy (`--exit-code 1 --severity HIGH,CRITICAL --ignore-unfixed`, digest-pinned image) is an acceptable replacement for Grype, not an addition.
- The smoke test is the only CI proof that signals reach Node, that the read-only containers start and that a backup restores. Extend it rather than skipping it.
- Tag images with `github.sha`. Pushing to a registry (GHCR needs `packages: write` on that job only), multi-arch builds and signing with cosign come later, once there is a deployment target.

## Workflow hygiene

- Every job keeps `timeout-minutes`. The existing jobs already set it.
- `concurrency: { group: ${{ github.workflow }}-${{ github.ref }}, cancel-in-progress: true }` stops superseded pull request runs.
- Lint the workflows with `actionlint`. Audit them with `zizmor`, which flags unpinned actions, template injection through `${{ github.event.* }}` in `run:` and missing `persist-credentials: false`. Neither runs in CI yet; run them locally on every workflow change. Pass matrix and event values to `run:` through `env:` (as `docker.yml` does with `TARGET`) rather than interpolating `${{ … }}` into the script.
- Recommend branch protection on `main` with the quality, e2e and image jobs as required checks. The user changes repository settings; do not change them yourself.
- Flaky tests are quarantined and fixed. Do not answer them with more retries. Playwright already retries twice in CI; the `e2e-playwright` skill owns that policy.
