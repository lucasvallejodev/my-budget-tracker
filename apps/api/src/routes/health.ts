import { sql } from 'drizzle-orm';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { HttpStatus } from '@/constants/http';

import { withErrors } from './responses';

const healthSchema = z.object({ database: z.literal('ok'), status: z.literal('ok') });

export const healthRoutes: FastifyPluginAsyncZod = async app => {
  app.get(
    '/health',
    {
      schema: {
        response: withErrors({ [HttpStatus.ok]: healthSchema }),
        security: [],
        tags: ['health'],
      },
    },
    async () => {
      await app.services.db.execute(sql`SELECT 1`);

      return { database: 'ok' as const, status: 'ok' as const };
    }
  );
};
