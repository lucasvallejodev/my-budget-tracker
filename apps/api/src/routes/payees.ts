import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { HttpStatus } from '@/constants/http';
import { userIdOf } from '@/plugins/context';
import {
  idParamsSchema,
  includeArchivedQuerySchema,
  listOf,
} from '@coinkeeper/shared/schema/common';
import { payeeFormSchema, payeePatchSchema, payeeSchema } from '@coinkeeper/shared/schema/payees';

import { withErrors } from './responses';

const Tags = ['payees'];
const payee = withErrors({ [HttpStatus.ok]: payeeSchema });

const toReference = (value: string | undefined): string | null | undefined =>
  value === undefined ? undefined : value || null;

export const payeesRoutes: FastifyPluginAsyncZod = async app => {
  app.get(
    '/payees',
    {
      schema: {
        querystring: includeArchivedQuerySchema,
        response: withErrors({ [HttpStatus.ok]: listOf(payeeSchema) }),
        tags: Tags,
      },
    },
    async request => ({ items: await app.services.payees.list(userIdOf(request), request.query) })
  );

  app.post(
    '/payees',
    {
      schema: {
        body: payeeFormSchema,
        response: withErrors({ [HttpStatus.created]: payeeSchema }),
        tags: Tags,
      },
    },
    async (request, reply) => {
      const created = await app.services.payees.create(userIdOf(request), {
        defaultCategoryId: toReference(request.body.defaultCategoryId),
        name: request.body.name,
      });

      return reply.status(HttpStatus.created).send(created);
    }
  );

  app.patch(
    '/payees/:id',
    {
      schema: {
        body: payeePatchSchema,
        params: idParamsSchema,
        response: payee,
        tags: Tags,
      },
    },
    async request =>
      app.services.payees.update(userIdOf(request), request.params.id, {
        defaultCategoryId: toReference(request.body.defaultCategoryId),
        name: request.body.name,
      })
  );

  app.post(
    '/payees/:id/archive',
    {
      schema: {
        params: idParamsSchema,
        response: payee,
        tags: Tags,
      },
    },
    async request => app.services.payees.archive(userIdOf(request), request.params.id)
  );

  app.post(
    '/payees/:id/unarchive',
    {
      schema: {
        params: idParamsSchema,
        response: payee,
        tags: Tags,
      },
    },
    async request => app.services.payees.unarchive(userIdOf(request), request.params.id)
  );
};
