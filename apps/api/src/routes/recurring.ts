import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { HttpStatus } from '@/constants/http';
import { userIdOf } from '@/plugins/context';
import { idParamsSchema, listOf } from '@coinkeeper/shared/schema/common';
import {
  linkOccurrenceSchema,
  occurrenceParamsSchema,
  occurrenceSchema,
  recordDueResultSchema,
  recurringFormSchema,
  recurringListQuerySchema,
  recurringSeriesRowSchema,
  recurringSuggestionSchema,
  todaySchema,
  upcomingQuerySchema,
} from '@coinkeeper/shared/schema/recurring';
import { transactionRowSchema } from '@coinkeeper/shared/schema/transaction';

import { toSeriesInput } from './inputs';
import { noContent, withErrors } from './responses';

const Tags = ['recurring'];
const series = withErrors({ [HttpStatus.ok]: recurringSeriesRowSchema });
const empty = withErrors({ [HttpStatus.noContent]: noContent });

export const recurringRoutes: FastifyPluginAsyncZod = async app => {
  app.get(
    '/recurring-series',
    {
      schema: {
        querystring: recurringListQuerySchema,
        response: withErrors({ [HttpStatus.ok]: listOf(recurringSeriesRowSchema) }),
        tags: Tags,
      },
    },
    async request => ({
      items: await app.services.recurring.list(userIdOf(request), request.query),
    })
  );

  app.get(
    '/recurring-series/upcoming',
    {
      schema: {
        querystring: upcomingQuerySchema,
        response: withErrors({ [HttpStatus.ok]: listOf(occurrenceSchema) }),
        tags: Tags,
      },
    },
    async request => ({
      items: await app.services.recurring.upcoming(userIdOf(request), request.query),
    })
  );

  app.get(
    '/recurring-series/suggestions',
    {
      schema: {
        querystring: todaySchema,
        response: withErrors({ [HttpStatus.ok]: listOf(recurringSuggestionSchema) }),
        tags: Tags,
      },
    },
    async request => ({
      items: await app.services.recurring.suggestions(userIdOf(request), request.query),
    })
  );

  app.post(
    '/recurring-series/record-due',
    {
      schema: {
        body: todaySchema,
        response: withErrors({ [HttpStatus.ok]: recordDueResultSchema }),
        tags: Tags,
      },
    },
    async request => ({
      created: await app.services.recurring.recordDue(userIdOf(request), request.body),
    })
  );

  app.post(
    '/recurring-series',
    {
      schema: {
        body: recurringFormSchema,
        response: withErrors({ [HttpStatus.created]: recurringSeriesRowSchema }),
        tags: Tags,
      },
    },
    async (request, reply) => {
      const userId = userIdOf(request);
      const input = await toSeriesInput(app.services, userId, request.body);

      return reply
        .status(HttpStatus.created)
        .send(await app.services.recurring.create(userId, input));
    }
  );

  app.put(
    '/recurring-series/:id',
    {
      schema: {
        body: recurringFormSchema,
        params: idParamsSchema,
        response: series,
        tags: Tags,
      },
    },
    async request => {
      const userId = userIdOf(request);
      const input = await toSeriesInput(app.services, userId, request.body);

      return app.services.recurring.update(userId, request.params.id, input);
    }
  );

  app.delete(
    '/recurring-series/:id',
    {
      schema: {
        params: idParamsSchema,
        response: empty,
        tags: Tags,
      },
    },
    async (request, reply) => {
      await app.services.recurring.remove(userIdOf(request), request.params.id);

      return reply.status(HttpStatus.noContent).send();
    }
  );

  app.post(
    '/recurring-series/:id/restore',
    {
      schema: {
        params: idParamsSchema,
        response: series,
        tags: Tags,
      },
    },
    async request => app.services.recurring.restore(userIdOf(request), request.params.id)
  );

  app.put(
    '/recurring-series/:id/occurrences/:dueOn',
    {
      schema: {
        body: linkOccurrenceSchema,
        params: occurrenceParamsSchema,
        response: withErrors({ [HttpStatus.ok]: transactionRowSchema }),
        tags: Tags,
      },
    },
    async request =>
      app.services.recurring.link(
        userIdOf(request),
        request.params.id,
        request.params.dueOn,
        request.body.transactionId
      )
  );

  app.delete(
    '/recurring-series/:id/occurrences/:dueOn',
    {
      schema: {
        params: occurrenceParamsSchema,
        response: empty,
        tags: Tags,
      },
    },
    async (request, reply) => {
      await app.services.recurring.unlink(
        userIdOf(request),
        request.params.id,
        request.params.dueOn
      );

      return reply.status(HttpStatus.noContent).send();
    }
  );
};
