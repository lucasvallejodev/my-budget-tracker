import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { HttpStatus } from '@/constants/http';
import { ServiceError } from '@/modules/db';
import { userIdOf } from '@/plugins/context';
import { listOf } from '@coinkeeper/shared/schema/common';
import {
  exchangeRateBodySchema,
  exchangeRateKeySchema,
  exchangeRateListQuerySchema,
  exchangeRateSchema,
} from '@coinkeeper/shared/schema/exchange-rates';

import { noContent, withErrors } from './responses';

const Tags = ['exchange-rates'];
const rate = withErrors({ [HttpStatus.ok]: exchangeRateSchema });

const parseRate = (text: string): number => {
  const value = Number(text.replace(',', '.'));

  if (!Number.isFinite(value) || value <= 0) {
    throw new ServiceError('The rate must be a positive number', HttpStatus.badRequest);
  }

  return value;
};

export const exchangeRatesRoutes: FastifyPluginAsyncZod = async app => {
  app.get(
    '/exchange-rates',
    {
      schema: {
        querystring: exchangeRateListQuerySchema,
        response: withErrors({ [HttpStatus.ok]: listOf(exchangeRateSchema) }),
        tags: Tags,
      },
    },
    async request => ({ items: await app.services.fx.list(userIdOf(request), request.query) })
  );

  app.put(
    '/exchange-rates/:base/:quote/:date',
    {
      schema: {
        body: exchangeRateBodySchema,
        params: exchangeRateKeySchema,
        response: withErrors({
          [HttpStatus.created]: exchangeRateSchema,
          [HttpStatus.ok]: exchangeRateSchema,
        }),
        tags: Tags,
      },
    },
    async (request, reply) => {
      const { created, rate: saved } = await app.services.fx.upsert(userIdOf(request), {
        ...request.params,
        rate: parseRate(request.body.rate),
      });

      return reply.status(created ? HttpStatus.created : HttpStatus.ok).send(saved);
    }
  );

  app.delete(
    '/exchange-rates/:base/:quote/:date',
    {
      schema: {
        params: exchangeRateKeySchema,
        response: withErrors({ [HttpStatus.noContent]: noContent }),
        tags: Tags,
      },
    },
    async (request, reply) => {
      await app.services.fx.remove(userIdOf(request), request.params);

      return reply.status(HttpStatus.noContent).send();
    }
  );

  app.post(
    '/exchange-rates/:base/:quote/:date/restore',
    {
      schema: {
        params: exchangeRateKeySchema,
        response: rate,
        tags: Tags,
      },
    },
    async request => app.services.fx.restore(userIdOf(request), request.params)
  );
};
