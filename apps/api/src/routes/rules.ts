import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { HttpStatus } from '@/constants/http';
import { userIdOf } from '@/plugins/context';
import { idParamsSchema, listOf, orderSchema } from '@coinkeeper/shared/schema/common';
import {
  applyRulesResultSchema,
  ruleFormSchema,
  ruleListQuerySchema,
  rulePatchSchema,
  ruleRowSchema,
} from '@coinkeeper/shared/schema/rules';

import { noContent, withErrors } from './responses';

const Tags = ['rules'];
const rule = withErrors({ [HttpStatus.ok]: ruleRowSchema });
const empty = withErrors({ [HttpStatus.noContent]: noContent });

export const rulesRoutes: FastifyPluginAsyncZod = async app => {
  app.get(
    '/rules',
    {
      schema: {
        querystring: ruleListQuerySchema,
        response: withErrors({ [HttpStatus.ok]: listOf(ruleRowSchema) }),
        tags: Tags,
      },
    },
    async request => ({ items: await app.services.rules.list(userIdOf(request), request.query) })
  );

  app.post(
    '/rules',
    {
      schema: {
        body: ruleFormSchema,
        response: withErrors({ [HttpStatus.created]: ruleRowSchema }),
        tags: Tags,
      },
    },
    async (request, reply) =>
      reply
        .status(HttpStatus.created)
        .send(await app.services.rules.create(userIdOf(request), request.body))
  );

  app.post(
    '/rules/apply',
    { schema: { response: withErrors({ [HttpStatus.ok]: applyRulesResultSchema }), tags: Tags } },
    async request => ({ updated: await app.services.rules.applyToUncategorized(userIdOf(request)) })
  );

  app.put(
    '/rules/order',
    {
      schema: {
        body: orderSchema,
        response: empty,
        tags: Tags,
      },
    },
    async (request, reply) => {
      await app.services.rules.reorder(userIdOf(request), request.body.ids);

      return reply.status(HttpStatus.noContent).send();
    }
  );

  app.patch(
    '/rules/:id',
    {
      schema: {
        body: rulePatchSchema,
        params: idParamsSchema,
        response: rule,
        tags: Tags,
      },
    },
    async request => app.services.rules.update(userIdOf(request), request.params.id, request.body)
  );

  app.delete(
    '/rules/:id',
    {
      schema: {
        params: idParamsSchema,
        response: empty,
        tags: Tags,
      },
    },
    async (request, reply) => {
      await app.services.rules.remove(userIdOf(request), request.params.id);

      return reply.status(HttpStatus.noContent).send();
    }
  );

  app.post(
    '/rules/:id/restore',
    {
      schema: {
        params: idParamsSchema,
        response: rule,
        tags: Tags,
      },
    },
    async request => app.services.rules.restore(userIdOf(request), request.params.id)
  );
};
