import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { requireSession } from '@/plugins/authentication';

import { accountsRoutes } from './accounts';
import { meRoutes, publicAuthRoutes } from './auth';
import { budgetsRoutes } from './budgets';
import { categoriesRoutes } from './categories';
import { exchangeRatesRoutes } from './exchange-rates';
import { healthRoutes } from './health';
import { importsRoutes } from './imports';
import { payeesRoutes } from './payees';
import { reportsRoutes } from './reports';
import { rulesRoutes } from './rules';
import { settingsRoutes } from './settings';
import { transactionsRoutes, transfersRoutes } from './transactions';

export const API_PREFIX = '/api/v1';

const AuthenticatedRoutes = [
  accountsRoutes,
  budgetsRoutes,
  categoriesRoutes,
  exchangeRatesRoutes,
  importsRoutes,
  meRoutes,
  payeesRoutes,
  reportsRoutes,
  rulesRoutes,
  settingsRoutes,
  transactionsRoutes,
  transfersRoutes,
];

const authenticatedScope: FastifyPluginAsyncZod = async app => {
  app.addHook('onRequest', requireSession);

  for (const routes of AuthenticatedRoutes) await app.register(routes);
};

export const apiRoutes: FastifyPluginAsyncZod = async app => {
  await app.register(healthRoutes);
  await app.register(publicAuthRoutes);
  await app.register(authenticatedScope);
};
