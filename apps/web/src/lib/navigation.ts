const HomePath = '/';
const PlaceholderOrigin = 'https://coinkeeper.invalid';

/**
 * Returns `next` when it is a path on this app, otherwise the home path.
 *
 * @remarks
 * Used after sign-in and sign-up to honor the `?next=` query parameter without creating an open
 * redirect. The value is resolved the way a browser would resolve it against the current page, and
 * only a result on the same origin is kept, so protocol-relative (`//host`), backslash (`/\host`),
 * encoded and absolute forms that leave the app all fall back to `/`.
 *
 * @param next - The raw `next` value from the URL, if any.
 * @returns A same-origin path with its query and hash, or `/`.
 *
 * @example
 * ```ts
 * safeNextPath('/budgets?month=2026-09'); // '/budgets?month=2026-09'
 * safeNextPath('/\\evil.example'); // '/'
 * safeNextPath('https://evil.example'); // '/'
 * ```
 */
export const safeNextPath = (next: string | undefined): string => {
  if (!next?.startsWith(HomePath)) return HomePath;

  const resolved = URL.parse(next, PlaceholderOrigin);

  if (resolved?.origin !== PlaceholderOrigin) return HomePath;

  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
};
