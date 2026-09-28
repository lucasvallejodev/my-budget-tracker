# Routes and contracts

> Summary: the shape of a CoinKeeper route plugin, where its Zod contracts live, how query strings are coerced under the Zod validator, how money, creates, deletes and restores are answered, and which Fastify route options we use.

## The route plugin

One `FastifyPluginAsyncZod` per resource in `apps/api/src/routes/<resource>.ts`, exported by name and registered in `AuthenticatedRoutes` (`routes/index.ts`). Handlers are arrow functions that return the value; use `reply.status(…).send(…)` only when the status is not `200`.

```ts
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { HttpStatus } from '@/constants/http';
import { userIdOf } from '@/plugins/context';
import { deletedQuerySchema, idParamsSchema, listOf } from '@coinkeeper/shared/schema/common';
import { savingsGoalFormSchema, savingsGoalSchema } from '@coinkeeper/shared/schema/savings-goals';

import { noContent, withErrors } from './responses';

const Tags = ['savings-goals'];
const goal = withErrors({ [HttpStatus.ok]: savingsGoalSchema });
const empty = withErrors({ [HttpStatus.noContent]: noContent });

export const savingsGoalsRoutes: FastifyPluginAsyncZod = async app => {
  app.get(
    '/savings-goals',
    {
      schema: {
        querystring: deletedQuerySchema,
        response: withErrors({ [HttpStatus.ok]: listOf(savingsGoalSchema) }),
        tags: Tags,
      },
    },
    async request => ({
      items: await app.services.savingsGoals.list(userIdOf(request), request.query),
    })
  );

  app.post(
    '/savings-goals',
    {
      schema: {
        body: savingsGoalFormSchema,
        response: withErrors({ [HttpStatus.created]: savingsGoalSchema }),
        tags: Tags,
      },
    },
    async (request, reply) => {
      const created = await app.services.savingsGoals.create(userIdOf(request), request.body);

      return reply.status(HttpStatus.created).send(created);
    }
  );

  app.delete(
    '/savings-goals/:id',
    {
      schema: {
        params: idParamsSchema,
        response: empty,
        tags: Tags,
      },
    },
    async (request, reply) => {
      await app.services.savingsGoals.remove(userIdOf(request), request.params.id);

      return reply.status(HttpStatus.noContent).send();
    }
  );

  app.post(
    '/savings-goals/:id/restore',
    {
      schema: {
        params: idParamsSchema,
        response: goal,
        tags: Tags,
      },
    },
    async request => app.services.savingsGoals.restore(userIdOf(request), request.params.id)
  );
};
```

`savingsGoals` is an illustration; copy the shape, not the names.

## Contracts

- Input schemas end in `Schema` and their inferred types in `Values` (`payeeFormSchema`, `PayeeFormValues`); response schemas are Zod objects with inferred types (`payeeSchema`, `Payee`). The web app imports the same types; never duplicate a shape.
- A route never returns a Drizzle `$inferSelect` row: services map rows to the response type (dates as `YYYY-MM-DD` strings, timestamps through `toIsoTimestamp`).
- The Zod `serializerCompiler` parses every response: unknown fields are stripped, and a response that does not match its schema becomes a `500`. When a route returns something new, the schema must change first.
- Use `listOf(item)` for full lists and `pageOf(item)` with `pageSizeSchema` and a cursor for long ones (transactions). The page size cap is `MAX_PAGE_SIZE` in `packages/shared/src/constants/pagination.ts`.
- Lists in bodies are bounded and checked for repeats: `orderSchema` (reorders) allows at most `MAX_ORDERED_IDS` (1000) ids and refines with `hasDistinctItems` from `packages/shared/src/lib/arrays.ts`, so a repeated id is a `400` before the service runs.
- Regular expressions in schemas come from `Patterns` in `packages/shared/src/lib/patterns.ts` (`isoDateSchema`, `isoMonthSchema` already wrap them).

## Coercion under the Zod validator

`fastify-type-provider-zod` replaces Ajv, so Fastify's documented "querystring coercion" does not happen. Everything in `params` and `querystring` is a string until the schema converts it:

| Want                | Write                                                          |
| ------------------- | -------------------------------------------------------------- |
| boolean flag        | `z.stringbool().optional()` (`includeArchivedQuerySchema`)     |
| integer             | `z.coerce.number().int()` with named bounds (`pageSizeSchema`) |
| uuid path parameter | `idParamsSchema` (`z.uuid()`), so a malformed id is a `400`    |
| date or month       | `isoDateSchema`, `isoMonthSchema`                              |
| list in a query     | a comma string split with `.transform`, bounded in length      |

## Money

Amounts cross the wire as strings (`"12.50"`) because the currency decides the number of decimals. The schema checks it is a string; the route parses it after loading the account, so the currency is known:

- `parseAmount(text, currency)` → signed minor units, `ServiceError(400)` on bad input;
- `parseMagnitude(text, currency)` → positive minor units, rejects zero;
- `toStandardInput`, `toStandardPatch`, `toTransferInput` build service inputs for transactions and transfers.

Never parse money with `Number()` or `parseFloat`, and never add amounts of different currencies.

## Status codes and verbs

| Operation                        | Verb and path                  | Answer                                       |
| -------------------------------- | ------------------------------ | -------------------------------------------- |
| list                             | `GET /<resource>`              | `200 { items }` (or `{ items, nextCursor }`) |
| create                           | `POST /<resource>`             | `201` with the row                           |
| partial update                   | `PATCH /<resource>/:id`        | `200` with the row                           |
| command (archive, reorder, link) | `POST /<resource>/:id/<verb>`  | `200` with the row, or `204`                 |
| soft delete                      | `DELETE /<resource>/:id`       | `204`, `noContent`                           |
| restore                          | `POST /<resource>/:id/restore` | `200` with the row                           |

Paths and verbs follow `docs/reference/rest-api.md` › Conventions. A restore re-checks the rules the create enforced (live account, active category, no duplicate import key) inside the service.

## Route options we use

- `config: { rateLimit: { max, timeWindow } }` per route; `@fastify/rate-limit` is registered with `global: false` in `plugins/security.ts`, so a route without this option is not limited. Values come from `app.config`, not literals (`routes/auth.ts`).
- `bodyLimit` for routes that accept large bodies, derived from a shared limit (`IMPORT_BODY_LIMIT` in `routes/imports.ts` from `FieldLengths.importCsv`). The default is 1 MiB.
- Bodies are JSON only. `registerSecurity` removes the `text/plain` parser, so any other content type answers `415 INVALID_REQUEST` (see `errors.md` › Traps). A route that truly needs another format (the CSV import sends CSV text inside JSON) keeps it inside a JSON field instead of adding a parser.
- `handlerTimeout` (Fastify 5.12, per route or server-wide) when a route may run long; see `production.md` › Timeouts.
- Response headers (`reply.header`) only for real HTTP semantics; `routes/settings.ts` sets `cache-control: private` on the currency list. Never cache per-user financial data in shared caches.
