import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { HttpStatus } from '@/constants/http';
import { userIdOf } from '@/plugins/context';
import { idParamsSchema, listOf, pageOf } from '@coinkeeper/shared/schema/common';
import {
  transferSuggestionQuerySchema,
  transferSuggestionSchema,
} from '@coinkeeper/shared/schema/imports';
import {
  linkTransferSchema,
  standardTransactionSchema,
  transactionListQuerySchema,
  transactionPatchSchema,
  transactionRowSchema,
  transferParamsSchema,
  transferPatchSchema,
  transferResponseSchema,
  transferSchema,
} from '@coinkeeper/shared/schema/transaction';

import { toStandardInput, toStandardPatch, toTransferInput } from './inputs';
import { noContent, withErrors } from './responses';

const TransactionTags = ['transactions'];
const TransferTags = ['transfers'];
const row = withErrors({ [HttpStatus.ok]: transactionRowSchema });
const transfer = withErrors({ [HttpStatus.ok]: transferResponseSchema });
const empty = withErrors({ [HttpStatus.noContent]: noContent });

const idList = (value: string | undefined): string[] | undefined =>
  value
    ?.split(',')
    .map(id => id.trim())
    .filter(Boolean);

export const transactionsRoutes: FastifyPluginAsyncZod = async app => {
  app.get(
    '/transactions',
    {
      schema: {
        querystring: transactionListQuerySchema,
        response: withErrors({ [HttpStatus.ok]: pageOf(transactionRowSchema) }),
        tags: TransactionTags,
      },
    },
    async request => {
      const { q: search, ...filters } = request.query;

      return app.services.ledger.page(userIdOf(request), { ...filters, search });
    }
  );

  app.get(
    '/transactions/:id',
    {
      schema: {
        params: idParamsSchema,
        response: row,
        tags: TransactionTags,
      },
    },
    async request =>
      app.services.ledger.get(userIdOf(request), request.params.id, { includeDeleted: true })
  );

  app.post(
    '/transactions',
    {
      schema: {
        body: standardTransactionSchema,
        response: withErrors({ [HttpStatus.created]: transactionRowSchema }),
        tags: TransactionTags,
      },
    },
    async (request, reply) => {
      const userId = userIdOf(request);
      const input = await toStandardInput(app.services, userId, request.body);

      return reply
        .status(HttpStatus.created)
        .send(await app.services.ledger.createStandard(userId, input));
    }
  );

  app.patch(
    '/transactions/:id',
    {
      schema: {
        body: transactionPatchSchema,
        params: idParamsSchema,
        response: row,
        tags: TransactionTags,
      },
    },
    async request => {
      const userId = userIdOf(request);
      const patch = await toStandardPatch(app.services, userId, request.params.id, request.body);

      return app.services.ledger.updateStandard(userId, request.params.id, patch);
    }
  );

  app.delete(
    '/transactions/:id',
    {
      schema: {
        params: idParamsSchema,
        response: empty,
        tags: TransactionTags,
      },
    },
    async (request, reply) => {
      await app.services.ledger.remove(userIdOf(request), request.params.id);

      return reply.status(HttpStatus.noContent).send();
    }
  );

  app.post(
    '/transactions/:id/restore',
    {
      schema: {
        params: idParamsSchema,
        response: row,
        tags: TransactionTags,
      },
    },
    async request => app.services.ledger.restore(userIdOf(request), request.params.id)
  );
};

export const transfersRoutes: FastifyPluginAsyncZod = async app => {
  app.post(
    '/transfers',
    {
      schema: {
        body: transferSchema,
        response: withErrors({ [HttpStatus.created]: transferResponseSchema }),
        tags: TransferTags,
      },
    },
    async (request, reply) => {
      const userId = userIdOf(request);
      const input = await toTransferInput(app.services, userId, request.body);

      return reply
        .status(HttpStatus.created)
        .send(await app.services.ledger.createTransfer(userId, input));
    }
  );

  app.post(
    '/transfers/link',
    {
      schema: {
        body: linkTransferSchema,
        response: withErrors({ [HttpStatus.created]: transferResponseSchema }),
        tags: TransferTags,
      },
    },
    async (request, reply) => {
      const linked = await app.services.ledger.linkAsTransfer(
        userIdOf(request),
        request.body.outTransactionId,
        request.body.inTransactionId
      );

      return reply.status(HttpStatus.created).send(linked);
    }
  );

  app.get(
    '/transfers/suggestions',
    {
      schema: {
        querystring: transferSuggestionQuerySchema,
        response: withErrors({ [HttpStatus.ok]: listOf(transferSuggestionSchema) }),
        tags: TransferTags,
      },
    },
    async request => ({
      items: await app.services.imports.transferSuggestions(
        userIdOf(request),
        idList(request.query.transactionIds)
      ),
    })
  );

  app.get(
    '/transfers/:transferId',
    {
      schema: {
        params: transferParamsSchema,
        response: transfer,
        tags: TransferTags,
      },
    },
    async request => app.services.ledger.getTransfer(userIdOf(request), request.params.transferId)
  );

  app.put(
    '/transfers/:transferId',
    {
      schema: {
        body: transferSchema,
        params: transferParamsSchema,
        response: transfer,
        tags: TransferTags,
      },
    },
    async request => {
      const userId = userIdOf(request);
      const input = await toTransferInput(app.services, userId, request.body);

      return app.services.ledger.updateTransfer(userId, request.params.transferId, input);
    }
  );

  app.patch(
    '/transfers/:transferId',
    {
      schema: {
        body: transferPatchSchema,
        params: transferParamsSchema,
        response: transfer,
        tags: TransferTags,
      },
    },
    async request =>
      app.services.ledger.patchTransfer(userIdOf(request), request.params.transferId, request.body)
  );

  app.delete(
    '/transfers/:transferId',
    {
      schema: {
        params: transferParamsSchema,
        response: empty,
        tags: TransferTags,
      },
    },
    async (request, reply) => {
      await app.services.ledger.removeTransfer(userIdOf(request), request.params.transferId);

      return reply.status(HttpStatus.noContent).send();
    }
  );

  app.post(
    '/transfers/:transferId/restore',
    {
      schema: {
        params: transferParamsSchema,
        response: transfer,
        tags: TransferTags,
      },
    },
    async request =>
      app.services.ledger.restoreTransfer(userIdOf(request), request.params.transferId)
  );
};
