import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { HttpStatus } from '@/constants/http';
import { userIdOf } from '@/plugins/context';
import { idParamsSchema, listOf, orderSchema } from '@coinkeeper/shared/schema/common';
import {
  templateFormSchema,
  templateListQuerySchema,
  templateRowSchema,
} from '@coinkeeper/shared/schema/templates';

import { toTemplateInput } from './inputs';
import { noContent, withErrors } from './responses';

const Tags = ['transaction templates'];
const template = withErrors({ [HttpStatus.ok]: templateRowSchema });
const empty = withErrors({ [HttpStatus.noContent]: noContent });

export const templatesRoutes: FastifyPluginAsyncZod = async app => {
  app.get(
    '/transaction-templates',
    {
      schema: {
        querystring: templateListQuerySchema,
        response: withErrors({ [HttpStatus.ok]: listOf(templateRowSchema) }),
        tags: Tags,
      },
    },
    async request => ({
      items: await app.services.templates.list(userIdOf(request), request.query),
    })
  );

  app.post(
    '/transaction-templates',
    {
      schema: {
        body: templateFormSchema,
        response: withErrors({ [HttpStatus.created]: templateRowSchema }),
        tags: Tags,
      },
    },
    async (request, reply) => {
      const userId = userIdOf(request);
      const input = await toTemplateInput(app.services, userId, request.body);

      return reply
        .status(HttpStatus.created)
        .send(await app.services.templates.create(userId, input));
    }
  );

  app.put(
    '/transaction-templates/order',
    {
      schema: {
        body: orderSchema,
        response: empty,
        tags: Tags,
      },
    },
    async (request, reply) => {
      await app.services.templates.reorder(userIdOf(request), request.body.ids);

      return reply.status(HttpStatus.noContent).send();
    }
  );

  app.put(
    '/transaction-templates/:id',
    {
      schema: {
        body: templateFormSchema,
        params: idParamsSchema,
        response: template,
        tags: Tags,
      },
    },
    async request => {
      const userId = userIdOf(request);
      const input = await toTemplateInput(app.services, userId, request.body);

      return app.services.templates.update(userId, request.params.id, input);
    }
  );

  app.delete(
    '/transaction-templates/:id',
    {
      schema: {
        params: idParamsSchema,
        response: empty,
        tags: Tags,
      },
    },
    async (request, reply) => {
      await app.services.templates.remove(userIdOf(request), request.params.id);

      return reply.status(HttpStatus.noContent).send();
    }
  );

  app.post(
    '/transaction-templates/:id/restore',
    {
      schema: {
        params: idParamsSchema,
        response: template,
        tags: Tags,
      },
    },
    async request => app.services.templates.restore(userIdOf(request), request.params.id)
  );
};
