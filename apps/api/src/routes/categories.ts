import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { HttpStatus } from '@/constants/http';
import { userIdOf } from '@/plugins/context';
import {
  archiveCategorySchema,
  categoryFormSchema,
  categoryGroupFormSchema,
  categoryGroupPatchSchema,
  categoryGroupSchema,
  categoryPatchSchema,
  categorySchema,
  categoryTreeSchema,
} from '@coinkeeper/shared/schema/categories';
import {
  idParamsSchema,
  includeArchivedQuerySchema,
  listOf,
  orderSchema,
} from '@coinkeeper/shared/schema/common';

import { noContent, withErrors } from './responses';

const Tags = ['categories'];
const empty = withErrors({ [HttpStatus.noContent]: noContent });
const group = withErrors({ [HttpStatus.ok]: categoryGroupSchema });
const category = withErrors({ [HttpStatus.ok]: categorySchema });

export const categoriesRoutes: FastifyPluginAsyncZod = async app => {
  app.get(
    '/category-groups',
    {
      schema: {
        querystring: includeArchivedQuerySchema,
        response: withErrors({ [HttpStatus.ok]: listOf(categoryTreeSchema) }),
        tags: Tags,
      },
    },
    async request => ({
      items: await app.services.categories.tree(userIdOf(request), request.query),
    })
  );

  app.post(
    '/category-groups',
    {
      schema: {
        body: categoryGroupFormSchema,
        response: withErrors({ [HttpStatus.created]: categoryGroupSchema }),
        tags: Tags,
      },
    },
    async (request, reply) =>
      reply
        .status(HttpStatus.created)
        .send(await app.services.categories.createGroup(userIdOf(request), request.body))
  );

  app.put(
    '/category-groups/order',
    {
      schema: {
        body: orderSchema,
        response: empty,
        tags: Tags,
      },
    },
    async (request, reply) => {
      await app.services.categories.reorderGroups(userIdOf(request), request.body.ids);

      return reply.status(HttpStatus.noContent).send();
    }
  );

  app.patch(
    '/category-groups/:id',
    {
      schema: {
        body: categoryGroupPatchSchema,
        params: idParamsSchema,
        response: group,
        tags: Tags,
      },
    },
    async request =>
      app.services.categories.updateGroup(userIdOf(request), request.params.id, request.body)
  );

  app.post(
    '/category-groups/:id/archive',
    {
      schema: {
        params: idParamsSchema,
        response: empty,
        tags: Tags,
      },
    },
    async (request, reply) => {
      await app.services.categories.archiveGroup(userIdOf(request), request.params.id);

      return reply.status(HttpStatus.noContent).send();
    }
  );

  app.post(
    '/category-groups/:id/unarchive',
    {
      schema: {
        params: idParamsSchema,
        response: group,
        tags: Tags,
      },
    },
    async request => app.services.categories.unarchiveGroup(userIdOf(request), request.params.id)
  );

  app.put(
    '/category-groups/:id/categories/order',
    {
      schema: {
        body: orderSchema,
        params: idParamsSchema,
        response: empty,
        tags: Tags,
      },
    },
    async (request, reply) => {
      await app.services.categories.reorderCategories(
        userIdOf(request),
        request.params.id,
        request.body.ids
      );

      return reply.status(HttpStatus.noContent).send();
    }
  );

  app.post(
    '/categories',
    {
      schema: {
        body: categoryFormSchema,
        response: withErrors({ [HttpStatus.created]: categorySchema }),
        tags: Tags,
      },
    },
    async (request, reply) =>
      reply
        .status(HttpStatus.created)
        .send(await app.services.categories.createCategory(userIdOf(request), request.body))
  );

  app.patch(
    '/categories/:id',
    {
      schema: {
        body: categoryPatchSchema,
        params: idParamsSchema,
        response: category,
        tags: Tags,
      },
    },
    async request =>
      app.services.categories.updateCategory(userIdOf(request), request.params.id, request.body)
  );

  app.post(
    '/categories/:id/archive',
    {
      schema: {
        body: archiveCategorySchema.optional().default({}),
        params: idParamsSchema,
        response: empty,
        tags: Tags,
      },
    },
    async (request, reply) => {
      await app.services.categories.archiveCategory(
        userIdOf(request),
        request.params.id,
        request.body.moveToId
      );

      return reply.status(HttpStatus.noContent).send();
    }
  );

  app.post(
    '/categories/:id/unarchive',
    {
      schema: {
        params: idParamsSchema,
        response: category,
        tags: Tags,
      },
    },
    async request => app.services.categories.unarchiveCategory(userIdOf(request), request.params.id)
  );
};
