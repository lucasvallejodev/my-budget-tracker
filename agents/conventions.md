# Conventions and style guide

> Summary: the coding rules an agent must follow in this repository: TypeScript, naming, server and client patterns, money, styling, tests, commits.

## Tooling gates (run before finishing any change)

```bash
npm run lint && npx tsc --noEmit && npm test -- --run && npm run build
```

Prettier is enforced through ESLint (`prettier/prettier`, `endOfLine: auto`, 2-space indent, single quotes, 100-column width per `.prettierrc.js`). Run `npx prettier --write <files>` after editing.

## TypeScript

- `strict` is on. No `any` except where the ESLint config already allows it; prefer `unknown` + narrowing.
- Use `import type` for types shared between server and client.
- Derive row types from Drizzle (`typeof table.$inferSelect`) or export DTO types from the service file; never duplicate shapes on the client.
- Dates are `YYYY-MM-DD` strings end to end; months are `YYYY-MM`. Use `date('…', { mode: 'string' })` in the schema.

## Naming

- Files: kebab-case (`transaction-dialog.tsx`, `service.ts`). One service per domain folder under `src/server/<domain>/`.
- Database: snake_case tables and columns; Drizzle properties camelCase. Enums are singular nouns (`account_type`).
- Server actions end in `Action` (`createTransferAction`). Hooks start with `use`. Zod schemas end in `Schema`, their types in `Values`.
- Money fields end in `Minor` (`amountMinor`, `balanceMinor`, `spentMinor`).

## Server patterns

- Service functions: `(userId, …)` first; validate ownership before any write; throw `ServiceError(message, status)`; wrap multi-row writes in `db.transaction` with `FOR UPDATE` where rows are read-then-written.
- Actions: `run(async () => { const { userId, services } = await requireUser(); const data = parse(schema, form); … refresh(); })`. Parse money strings with `parseAmountInput(text, account.currency)` inside the action, never in the schema.
- Route handlers: `export const GET = handle(({ userId, services, request }) => …)`; read params with `param(request, 'name')`.
- Reports: raw SQL via `db.execute` through the `query<T>()` helper; keep the shared `spendingWhere` predicate.
- Correlated subqueries in unjoined selects must qualify columns literally (`"accounts"."id"`).

## Client patterns

- Screens are `'use client'` components in `src/components/finance/`; pages under `src/app/(main)/` only render them.
- Data via hooks in `use-finance-data.ts`; new endpoints get a hook and their key is added to `FINANCE_KEYS`.
- Mutations: `useMutation({ mutationFn: someAction, onSuccess: toast + invalidate FINANCE_KEYS, onError: toast(error.message) })`.
- Forms: React Hook Form + `zodResolver`; amount inputs are text with `inputMode="decimal"`.
- Define every component at module scope; never create components inside another component's body (React Compiler rule). Do not call `setState` synchronously inside `useEffect`; derive state or reset on user events instead.
- Accessible names on every interactive control (`aria-label` on icon buttons) so tests can query by role.

## Styling

- SCSS modules beside the component; shared classes live in `finance.module.scss` (layout blocks), `forms.module.scss` (form pieces), `controls.module.scss` (primitives), `shell.module.scss`.
- Colours from `src/styles/tokens.scss` variables (`var(--muted)`, `var(--surface)`, …). Group colours are data and are applied inline.
- Icons: add to `src/components/icons/registry.ts`, render with `<Icon icon={name} />`. Never `import * as` from lucide.

## Money

- Store and transfer `amountMinor` + `currency`. Display with `formatMoney` or `<Amount />`. Convert only through `services.fx`.
- Never sum amounts of different currencies; group by currency instead.
- Liabilities: keep the ledger sign, flip only for display (`flipSign` on `Amount`).

## Tests

- Service rules → `src/server/services.test.ts` (PGlite; truncates and bootstraps two users before each test). Always add an ownership case.
- Pure helpers → colocated `*.test.ts`.
- Screens → `*.test.tsx` with `QueryClientProvider`, `client.setQueryData` for fixtures and `vi.mock('@/app/(main)/actions')`.
- Playwright specs in `e2e/` are excluded from Vitest.

## Documentation

Every behaviour change updates the matching page in `docs/` (see `agents/docs-map.md`), the agent docs when architecture or conventions change, and `README.md` when setup, commands or folders change. Screenshots are placeholders: leave an HTML comment `<!-- screenshot: <what to capture> (docs/assets/screenshots/<name>.png) -->` where one belongs.

## Git

- One commit per phase or logical change, written in the imperative with a short body listing what changed.
- Never add yourself as author or co-author (no `Co-Authored-By`, no "Generated with" trailers).
- Do not push unless explicitly asked.
