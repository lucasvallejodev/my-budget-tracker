import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { HttpStatus } from '@/constants/http';
import { userIdOf } from '@/plugins/context';
import { listOf } from '@coinkeeper/shared/schema/common';
import { currencySchema } from '@coinkeeper/shared/schema/currencies';
import {
  movePeriodSchema,
  periodParamsSchema,
  periodSchema,
  settingsFormSchema,
  settingsSchema,
} from '@coinkeeper/shared/schema/settings';

import { withErrors } from './responses';

const CURRENCY_CACHE_SECONDS = 3600;

export const settingsRoutes: FastifyPluginAsyncZod = async app => {
  app.get(
    '/settings',
    { schema: { response: withErrors({ [HttpStatus.ok]: settingsSchema }), tags: ['settings'] } },
    async request => app.services.getSettings(userIdOf(request))
  );

  app.patch(
    '/settings',
    {
      schema: {
        body: settingsFormSchema,
        response: withErrors({ [HttpStatus.ok]: settingsSchema }),
        tags: ['settings'],
      },
    },
    async request => app.services.updateSettings(userIdOf(request), request.body)
  );

  const period = withErrors({ [HttpStatus.ok]: periodSchema });
  const PeriodTags = ['periods'];

  app.get(
    '/periods/:month',
    {
      schema: {
        params: periodParamsSchema,
        response: period,
        tags: PeriodTags,
      },
    },
    async request => app.services.periods.range(userIdOf(request), request.params.month)
  );

  app.put(
    '/periods/:month',
    {
      schema: {
        body: movePeriodSchema,
        params: periodParamsSchema,
        response: period,
        tags: PeriodTags,
      },
    },
    async request =>
      app.services.periods.move(userIdOf(request), request.params.month, request.body.startsOn)
  );

  app.delete(
    '/periods/:month',
    {
      schema: {
        params: periodParamsSchema,
        response: period,
        tags: PeriodTags,
      },
    },
    async request => app.services.periods.reset(userIdOf(request), request.params.month)
  );

  app.get(
    '/currencies',
    {
      schema: {
        response: withErrors({ [HttpStatus.ok]: listOf(currencySchema) }),
        tags: ['currencies'],
      },
    },
    async (_request, reply) =>
      reply
        .header('cache-control', `private, max-age=${CURRENCY_CACHE_SECONDS}`)
        .send({ items: await app.services.listCurrencies() })
  );
};
