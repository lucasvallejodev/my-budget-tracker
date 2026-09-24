import Fastify from 'fastify';
import type { FastifyServerOptions } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

import type { AppConfig } from './config';
import type { Db } from './modules/db';
import { createServices } from './modules/services';
import { registerAuthentication } from './plugins/authentication';
import { registerErrorHandler } from './plugins/error-handler';
import { registerOpenApi } from './plugins/openapi';
import { registerSecurity } from './plugins/security';
import { API_PREFIX, apiRoutes } from './routes';

export type AppOptions = {
  config: AppConfig;
  db: Db;
  logger?: FastifyServerOptions['logger'];
};

export const buildApp = async ({ config, db, logger }: AppOptions) => {
  const app = Fastify({
    logger: logger ?? { level: config.logLevel },
    trustProxy: config.trustProxy,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.decorate('config', config);
  app.decorate('services', createServices(db, { sessionDays: config.sessionDays }));
  registerErrorHandler(app);

  await registerSecurity(app);
  await registerAuthentication(app);
  await registerOpenApi(app);
  await app.register(apiRoutes, { prefix: API_PREFIX });

  return app;
};

export type App = Awaited<ReturnType<typeof buildApp>>;
