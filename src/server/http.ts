import { NextRequest } from 'next/server';

import { HttpStatus } from '@/constants/http';

import { requireUser } from './auth/require-user';
import { ServiceError } from './db';

type Context = Awaited<ReturnType<typeof requireUser>> & { request: NextRequest };

const isNextRedirect = (error: unknown): boolean =>
  !!error && typeof error === 'object' && 'digest' in error;

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

      if (isNextRedirect(error)) throw error;
      console.error(error);

      return Response.json({ error: 'Unexpected error' }, { status: HttpStatus.internalError });
    }
  };

export const param = (request: NextRequest, name: string) => {
  const value = request.nextUrl.searchParams.get(name);

  return value === null || value === '' ? undefined : value;
};
