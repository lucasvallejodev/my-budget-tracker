import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

export const DOCS_PREFIX = '/api/docs';

export const registerOpenApi = async (app: FastifyInstance): Promise<void> => {
  await app.register(swagger, {
    openapi: {
      components: {
        securitySchemes: {
          session: {
            in: 'cookie',
            name: app.config.sessionCookieName,
            type: 'apiKey',
          },
        },
      },
      info: {
        description:
          'CoinKeeper REST API. Authenticate with POST /api/v1/auth/sign-in; the session travels in an HttpOnly cookie.',
        title: 'CoinKeeper API',
        version: '1.0.0',
      },
      security: [{ session: [] }],
    },
    transform: jsonSchemaTransform,
  });

  if (app.config.docs) await app.register(swaggerUi, { routePrefix: DOCS_PREFIX });
};
