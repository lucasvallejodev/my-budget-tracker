import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { HttpStatus } from '@/constants/http';
import { userIdOf } from '@/plugins/context';
import {
  budgetAmountSchema,
  budgetKeyParamsSchema,
  budgetListQuerySchema,
  budgetRowSchema,
  copyBudgetsResultSchema,
  copyBudgetsSchema,
} from '@coinkeeper/shared/schema/budgets';
import { idParamsSchema, listOf } from '@coinkeeper/shared/schema/common';

import { parseAmount } from './inputs';
import { noContent, withErrors } from './responses';

const Tags = ['budgets'];

export const budgetsRoutes: FastifyPluginAsyncZod = async app => {
  app.get(
    '/budgets',
    {
      schema: {
        querystring: budgetListQuerySchema,
        response: withErrors({ [HttpStatus.ok]: listOf(budgetRowSchema) }),
        tags: Tags,
      },
    },
    async request => {
      const { deleted, month } = request.query;

      return { items: await app.services.budgets.list(userIdOf(request), month, { deleted }) };
    }
  );

  app.put(
    '/budgets/:month/:categoryId/:currency',
    {
      schema: {
        body: budgetAmountSchema,
        params: budgetKeyParamsSchema,
        response: withErrors({
          [HttpStatus.created]: budgetRowSchema,
          [HttpStatus.ok]: budgetRowSchema,
        }),
        tags: Tags,
      },
    },
    async (request, reply) => {
      const { categoryId, currency, month } = request.params;

      const { budget, created } = await app.services.budgets.upsert(userIdOf(request), {
        amountMinor: Math.abs(parseAmount(request.body.amount, currency)),
        categoryId,
        currency,
        month,
      });

      return reply.status(created ? HttpStatus.created : HttpStatus.ok).send(budget);
    }
  );

  app.post(
    '/budgets/copy-previous-month',
    {
      schema: {
        body: copyBudgetsSchema,
        response: withErrors({ [HttpStatus.ok]: copyBudgetsResultSchema }),
        tags: Tags,
      },
    },
    async request => ({
      copied: await app.services.budgets.copyFromPreviousMonth(
        userIdOf(request),
        request.body.month
      ),
    })
  );

  app.delete(
    '/budgets/:id',
    {
      schema: {
        params: idParamsSchema,
        response: withErrors({ [HttpStatus.noContent]: noContent }),
        tags: Tags,
      },
    },
    async (request, reply) => {
      await app.services.budgets.remove(userIdOf(request), request.params.id);

      return reply.status(HttpStatus.noContent).send();
    }
  );

  app.post(
    '/budgets/:id/restore',
    {
      schema: {
        params: idParamsSchema,
        response: withErrors({ [HttpStatus.ok]: budgetRowSchema }),
        tags: Tags,
      },
    },
    async request => app.services.budgets.restore(userIdOf(request), request.params.id)
  );
};
