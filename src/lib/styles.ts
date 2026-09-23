import { type ClassValue, clsx } from 'clsx';

/**
 * Joins class names, skipping falsy values; a thin wrapper over `clsx`.
 *
 * @param inputs - Strings, arrays or `{ className: condition }` objects.
 * @returns The space-separated class list.
 *
 * @example
 * ```ts
 * cn('badge', isDanger && 'badge--danger'); // 'badge badge--danger' or 'badge'
 * cn('badge', { 'badge--danger': false }); // 'badge'
 * ```
 */
export const cn = (...inputs: ClassValue[]): string => clsx(inputs);
