# Plugins, hooks and decorators

> Summary: how buildApp assembles the API, which hook runs when in Fastify 5, how encapsulation decides what a hook covers, how to add a decorator with declaration merging, and why request data never goes into module state.

## How `buildApp` is assembled

`apps/api/src/app.ts` builds the instance in this order; a new piece goes where its dependencies are ready:

1. `Fastify({ connectionTimeout, genReqId: requestIdOf, handlerTimeout, keepAliveTimeout, logger: loggerOptions(config, stream), requestTimeout, trustProxy })`, then `.withTypeProvider<ZodTypeProvider>()` (values in `production.md` › Timeouts; `trustProxy` is the `TRUST_PROXY` list or `false`)
2. `setValidatorCompiler(validatorCompiler)`, `setSerializerCompiler(serializerCompiler)`
3. decorators `config` and `services` (`createServices(db, { sessionDays, sessionMaxAgeDays })`)
4. `registerErrorHandler(app)` (error and not-found handlers)
5. `registerRequestId(app)` (`plugins/request-id.ts`): the `onSend` hook that echoes `X-Request-Id`
6. `registerSecurity(app)`: removes the `text/plain` parser (JSON bodies only), helmet with the API policy `default-src 'none'; frame-ancestors 'none'`, CORS allow-list, rate limit with `global: false`, `rejectForeignOrigin` `onRequest` hook
7. `registerAuthentication(app)`: `@fastify/cookie`, `decorateRequest('auth', null)`, the `onRequest` hook that resolves the session cookie into `request.auth`
8. `registerRequestUser(app)` (`plugins/request-id.ts`): an `onRequest` hook that binds `userId` to `request.log` and `reply.log`; it must stay after `registerAuthentication`, because hooks of the same kind run in registration order
9. `registerOpenApi(app)`: Swagger with `jsonSchemaTransform`, UI at `/api/docs` when `config.docs`, with its own `staticCSP`
10. `app.register(apiRoutes, { prefix: API_PREFIX })`

Our plugins are plain `registerX = async (app: FastifyInstance): Promise<void>` functions called with `await` from `buildApp`, not `fastify-plugin` wrappers or autoloaded folders. Calling them directly on the root instance is what makes their hooks and decorators global. Keep that pattern: a new cross-cutting concern is `apps/api/src/plugins/<name>.ts` exporting `registerName`, called from `buildApp`. Helpers that are not plugins live beside them: `plugins/logging.ts` exports the logger options, `plugins/audit.ts` the `audit()` function.

## Encapsulation

`app.register(plugin)` creates a child context. Hooks, decorators and error handlers added inside it apply to that child and its descendants only. `routes/index.ts` uses this on purpose: `authenticatedScope` adds `requireSession` as an `onRequest` hook, then registers every resource plugin inside it, so the hook covers exactly those routes. `healthRoutes` and `publicAuthRoutes` are registered beside it and stay public.

- A hook for all routes: add it in a `registerX` function called from `buildApp`.
- A hook for signed-in routes only: add it next to `requireSession` in `authenticatedScope`.
- A hook for one route: use the route's `onRequest` / `preHandler` option.

## Hook order (Fastify 5)

`onRequest` → `preParsing` → `preValidation` → (validation) → `preHandler` → handler → `preSerialization` → `onSend` → `onResponse`; `onError` runs before the error handler sends; `onTimeout` and `onRequestAbort` fire on socket timeout and client abort.

| Need                                                 | Hook                                                 |
| ---------------------------------------------------- | ---------------------------------------------------- |
| reject early without reading the body (auth, origin) | `onRequest`                                          |
| inspect the parsed, validated body or params         | `preHandler`                                         |
| add a response header on every reply (request id)    | `onSend`, as `registerRequestId` does                |
| log or measure after the response is sent            | `onResponse`                                         |
| stop work for a client that went away                | `onRequestAbort`, or `request.signal` in the handler |

Hooks are `async` and fail by throwing `ServiceError`; they never call `reply.send` with an error body. The body is not parsed during `onRequest`, so `request.body` is `undefined` there.

## Decorators and declaration merging

`plugins/context.ts` extends Fastify's types. It is the one place where `interface` is allowed, because module augmentation requires it:

```ts
declare module 'fastify' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface FastifyRequest {
    auth: RequestAuth | null;
  }
}
```

To add a request property:

1. Add it to the `FastifyRequest` augmentation in `plugins/context.ts` with a type from the same file or `@/auth/…`.
2. Call `app.decorateRequest('name', null)` once, in the plugin that fills it, before any hook uses it. The `null` initial value keeps the request object's shape stable; Fastify 5 rejects reference types (objects, arrays) as initial values.
3. Set it in a hook (`request.name = …`), never at module scope.

Instance decorators (`app.decorate('services', …)`) are for process-wide, immutable-after-start dependencies: config, services, clients. Add them to the `FastifyInstance` augmentation the same way.

## No request data in module state

Fastify handles many requests at once in one process. A module-level `let` or a mutable module-level `Map` that stores something about "the current request" or "the current user" leaks between users.

- Request- or user-scoped values travel on `request` (decorated property), as function arguments (`userId` first in every service), or in the database.
- Module scope may hold: named constants, PascalCase lookup tables, immutable config, process-wide singletons that store no user data, and lazily computed process-wide values. `apps/api/src/auth/passwords.ts` memoises the reference hash used for timing parity in a module-level promise; that is safe because it is the same for every request and contains no user data.
- A deliberate cache (see node-diagnostics › caching) is keyed by `userId` when it holds user data, bounded, and invalidated on write. Balances, reports and budgets are never cached across requests: the ledger is the truth.
- Process-wide state that is keyed by something other than the current request is allowed when it is bounded and documented: the per-account failure windows of `createSignInThrottle` (`auth/sign-in-throttle.ts`) live in a `Map` created once per `publicAuthRoutes` registration and capped at `MAX_TRACKED_ACCOUNTS`. It is still per process (see `production.md` › Process-wide state and background work).
