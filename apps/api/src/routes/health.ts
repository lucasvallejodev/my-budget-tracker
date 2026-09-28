import { sql } from 'drizzle-orm';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { HttpStatus } from '@/constants/http';
import { ServiceError } from '@/modules/db';
import { livenessSchema, readinessSchema } from '@coinkeeper/shared/schema/health';

import { withErrors } from './responses';

const HealthTags = ['health'];

export const healthRoutes: FastifyPluginAsyncZod = async app => {
  app.get(
    '/health/live',
    {
      schema: {
        response: withErrors({ [HttpStatus.ok]: livenessSchema }),
        security: [],
        tags: HealthTags,
      },
    },
    async () => ({ status: 'ok' as const })
  );

  app.get(
    '/health/ready',
    {
      schema: {
        response: withErrors({ [HttpStatus.ok]: readinessSchema }),
        security: [],
        tags: HealthTags,
      },
    },
    async request => {
      try {
        await app.services.db.execute(sql`SELECT 1`);
      } catch (error) {
        request.log.warn({ err: error }, 'Readiness check could not reach the database');

        throw new ServiceError('The database is not reachable', HttpStatus.serviceUnavailable);
      }

      return { database: 'ok' as const, status: 'ok' as const };
    }
  );
};
