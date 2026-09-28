import Fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

import type { AppConfig } from './config';
import { ServerTimeoutsMs } from './constants/http';
import type { Db } from './modules/db';
import { createServices } from './modules/services';
import { registerAuthentication } from './plugins/authentication';
import { registerErrorHandler } from './plugins/error-handler';
import { type LoggerDestination, loggerOptions } from './plugins/logging';
import { registerOpenApi } from './plugins/openapi';
import { registerRequestId, registerRequestUser, requestIdOf } from './plugins/request-id';
import { registerSecurity } from './plugins/security';
import { API_PREFIX, apiRoutes } from './routes';

export type AppOptions = {
  config: AppConfig;
  db: Db;
  logger?: LoggerDestination;
};

export const buildApp = async ({ config, db, logger }: AppOptions) => {
  const app = Fastify({
    connectionTimeout: config.handlerTimeoutMs + ServerTimeoutsMs.connectionGrace,
    genReqId: requestIdOf,
    handlerTimeout: config.handlerTimeoutMs,
    keepAliveTimeout: ServerTimeoutsMs.keepAlive,
    logger: logger === false ? false : loggerOptions(config, logger?.stream),
    requestTimeout: ServerTimeoutsMs.request,
    trustProxy: config.trustedProxies.length > 0 ? config.trustedProxies : false,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.decorate('config', config);
  app.decorate(
    'services',
    createServices(db, {
      sessionDays: config.sessionDays,
      sessionMaxAgeDays: config.sessionMaxAgeDays,
    })
  );
  registerErrorHandler(app);

  await registerRequestId(app);
  await registerSecurity(app);
  await registerAuthentication(app);
  await registerRequestUser(app);
  await registerOpenApi(app);
  await app.register(apiRoutes, { prefix: API_PREFIX });

  return app;
};

export type App = Awaited<ReturnType<typeof buildApp>>;
