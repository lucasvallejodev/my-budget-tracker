import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { HttpStatus } from '@/constants/http';
import { userIdOf } from '@/plugins/context';
import { listOf } from '@coinkeeper/shared/schema/common';
import { currencySchema } from '@coinkeeper/shared/schema/currencies';
import { settingsFormSchema, settingsSchema } from '@coinkeeper/shared/schema/settings';

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
