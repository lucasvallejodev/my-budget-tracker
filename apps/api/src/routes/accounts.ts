import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { HttpStatus } from '@/constants/http';
import { userIdOf } from '@/plugins/context';
import {
  accountFormSchema,
  accountListQuerySchema,
  accountPatchSchema,
  accountSummarySchema,
} from '@coinkeeper/shared/schema/accounts';
import { idParamsSchema, listOf } from '@coinkeeper/shared/schema/common';

import { parseAmount } from './inputs';
import { noContent, withErrors } from './responses';

const Tags = ['accounts'];
const summary = withErrors({ [HttpStatus.ok]: accountSummarySchema });

export const accountsRoutes: FastifyPluginAsyncZod = async app => {
  app.get(
    '/accounts',
    {
      schema: {
        querystring: accountListQuerySchema,
        response: withErrors({ [HttpStatus.ok]: listOf(accountSummarySchema) }),
        tags: Tags,
      },
    },
    async request => ({ items: await app.services.accounts.list(userIdOf(request), request.query) })
  );

  app.get(
    '/accounts/:id',
    {
      schema: {
        params: idParamsSchema,
        response: summary,
        tags: Tags,
      },
    },
    async request => app.services.accounts.get(userIdOf(request), request.params.id)
  );

  app.post(
    '/accounts',
    {
      schema: {
        body: accountFormSchema,
        response: withErrors({ [HttpStatus.created]: accountSummarySchema }),
        tags: Tags,
      },
    },
    async (request, reply) => {
      const { openingBalance, ...data } = request.body;

      const openingBalanceMinor = openingBalance?.trim()
        ? parseAmount(openingBalance, data.currency)
        : 0;

      const account = await app.services.accounts.create(userIdOf(request), {
        ...data,
        openingBalanceMinor,
      });

      return reply
        .status(HttpStatus.created)
        .header('location', `${request.url}/${account.id}`)
        .send(account);
    }
  );

  app.patch(
    '/accounts/:id',
    {
      schema: {
        body: accountPatchSchema,
        params: idParamsSchema,
        response: summary,
        tags: Tags,
      },
    },
    async request =>
      app.services.accounts.update(userIdOf(request), request.params.id, request.body)
  );

  app.post(
    '/accounts/:id/archive',
    {
      schema: {
        params: idParamsSchema,
        response: summary,
        tags: Tags,
      },
    },
    async request => app.services.accounts.archive(userIdOf(request), request.params.id, true)
  );

  app.post(
    '/accounts/:id/unarchive',
    {
      schema: {
        params: idParamsSchema,
        response: summary,
        tags: Tags,
      },
    },
    async request => app.services.accounts.archive(userIdOf(request), request.params.id, false)
  );

  app.delete(
    '/accounts/:id',
    {
      schema: {
        params: idParamsSchema,
        response: withErrors({ [HttpStatus.noContent]: noContent }),
        tags: Tags,
      },
    },
    async (request, reply) => {
      await app.services.accounts.remove(userIdOf(request), request.params.id);

      return reply.status(HttpStatus.noContent).send();
    }
  );

  app.post(
    '/accounts/:id/restore',
    {
      schema: {
        params: idParamsSchema,
        response: summary,
        tags: Tags,
      },
    },
    async request => app.services.accounts.restore(userIdOf(request), request.params.id)
  );
};
