import { useSyncExternalStore } from 'react';

const subscribeToNothing = (): (() => void) => () => undefined;

/**
 * Tells whether the component is rendering on the client after hydration.
 *
 * @remarks
 * Returns `false` on the server and during hydration, then `true`, so markup that depends on
 * data the browser may already hold (a cached query) matches the server HTML first and updates
 * right after. Streamed Suspense boundaries hydrate late, when shared queries may have resolved.
 *
 * @returns `true` once the component runs as a normal client render.
 *
 * @example
 * ```ts
 * const user = useHydrated() ? query.data : undefined;
 * ```
 */
export const useHydrated = (): boolean =>
  useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  );
