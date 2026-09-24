import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { HttpStatus } from '@/constants/http';
import { userIdOf } from '@/plugins/context';
import { FieldLengths } from '@coinkeeper/shared/constants/field-lengths';
import {
  importCommitResultSchema,
  importPreviewRequestSchema,
  previewSchema,
} from '@coinkeeper/shared/schema/imports';

import { withErrors } from './responses';

const Tags = ['imports'];
const JSON_OVERHEAD_FACTOR = 2;
const IMPORT_BODY_LIMIT = FieldLengths.importCsv * JSON_OVERHEAD_FACTOR;

export const importsRoutes: FastifyPluginAsyncZod = async app => {
  app.post(
    '/imports/preview',
    {
      bodyLimit: IMPORT_BODY_LIMIT,
      schema: {
        body: importPreviewRequestSchema,
        response: withErrors({ [HttpStatus.ok]: previewSchema }),
        tags: Tags,
      },
    },
    async request => app.services.imports.preview(userIdOf(request), request.body)
  );

  app.post(
    '/imports',
    {
      bodyLimit: IMPORT_BODY_LIMIT,
      schema: {
        body: previewSchema,
        response: withErrors({ [HttpStatus.created]: importCommitResultSchema }),
        tags: Tags,
      },
    },
    async (request, reply) => {
      const userId = userIdOf(request);
      const result = await app.services.imports.commit(userId, request.body);

      const suggestions = await app.services.imports.transferSuggestions(
        userId,
        result.insertedIds
      );

      return reply.status(HttpStatus.created).send({ ...result, suggestions });
    }
  );
};
