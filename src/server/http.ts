import { NextRequest } from 'next/server';
import { ServiceError } from './db';
import { requireUser } from './auth/require-user';

type Context = Awaited<ReturnType<typeof requireUser>> & { request: NextRequest };

/** Wraps a route handler: resolves the user, serialises the result, maps service errors. */
export const handle =
  (fn: (context: Context) => Promise<unknown>) => async (request: NextRequest) => {
    try {
      const context = await requireUser();
      const data = await fn({ ...context, request });

      return Response.json(data ?? { ok: true });
    } catch (error) {
      if (error instanceof ServiceError) {
        return Response.json({ error: error.message }, { status: error.status });
      }

      if (error && typeof error === 'object' && 'digest' in error) throw error; // Next redirects
      console.error(error);

      return Response.json({ error: 'Unexpected error' }, { status: 500 });
    }
  };

export const param = (request: NextRequest, name: string) => {
  const value = request.nextUrl.searchParams.get(name);

  return value === null || value === '' ? undefined : value;
};
