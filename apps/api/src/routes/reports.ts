import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { HttpStatus } from '@/constants/http';
import { userIdOf } from '@/plugins/context';
import { toIsoMonth } from '@coinkeeper/shared/lib/date-helpers';
import { listOf } from '@coinkeeper/shared/schema/common';
import {
  breakdownQuerySchema,
  cashFlowQuerySchema,
  cashPointSchema,
  categorySliceSchema,
  currencyTotalsSchema,
  groupSliceSchema,
  monthQuerySchema,
  netWorthBucketSchema,
  summaryQuerySchema,
  summarySchema,
} from '@coinkeeper/shared/schema/reports';

import { withErrors } from './responses';

const Tags = ['reports'];
const DEFAULT_CASH_FLOW_MONTHS = 8;

export const reportsRoutes: FastifyPluginAsyncZod = async app => {
  const { accounts, ledger, reports } = app.services;

  app.get(
    '/reports/summary',
    {
      schema: {
        querystring: summaryQuerySchema,
        response: withErrors({ [HttpStatus.ok]: summarySchema }),
        tags: Tags,
      },
    },
    async request => {
      const userId = userIdOf(request);
      const month = request.query.month ?? toIsoMonth(new Date());
      const cashFlowMonths = request.query.cashFlowMonths ?? DEFAULT_CASH_FLOW_MONTHS;

      const [totals, breakdown, netWorth, cashFlow, needsReviewCount, accountList, settings] =
        await Promise.all([
          reports.monthlyTotals(userId, month),
          reports.breakdownByGroup(userId, month),
          reports.netWorth(userId),
          reports.cashFlow(userId, month, cashFlowMonths),
          ledger.needsReviewCount(userId),
          accounts.list(userId),
          app.services.getSettings(userId),
        ]);

      const converted = settings.showConvertedTotals
        ? await reports.convertedTotals(userId, settings.primaryCurrency, { netWorth, totals })
        : null;

      return {
        accounts: accountList,
        breakdown,
        cashFlow,
        converted,
        month,
        needsReviewCount,
        netWorth,
        totals,
      };
    }
  );

  app.get(
    '/reports/monthly-totals',
    {
      schema: {
        querystring: monthQuerySchema,
        response: withErrors({ [HttpStatus.ok]: listOf(currencyTotalsSchema) }),
        tags: Tags,
      },
    },
    async request => ({
      items: await reports.monthlyTotals(userIdOf(request), request.query.month),
    })
  );

  app.get(
    '/reports/breakdown',
    {
      schema: {
        querystring: breakdownQuerySchema,
        response: withErrors({
          [HttpStatus.ok]: listOf(z.union([groupSliceSchema, categorySliceSchema])),
        }),
        tags: Tags,
      },
    },
    async request => {
      const userId = userIdOf(request);
      const { by, currency, month } = request.query;

      if (by === 'group') return { items: await reports.breakdownByGroup(userId, month) };

      const target = currency ?? (await app.services.getSettings(userId)).primaryCurrency;

      return { items: await reports.breakdownByCategory(userId, month, target.toUpperCase()) };
    }
  );

  app.get(
    '/reports/net-worth',
    {
      schema: {
        response: withErrors({ [HttpStatus.ok]: listOf(netWorthBucketSchema) }),
        tags: Tags,
      },
    },
    async request => ({ items: await reports.netWorth(userIdOf(request)) })
  );

  app.get(
    '/reports/cash-flow',
    {
      schema: {
        querystring: cashFlowQuerySchema,
        response: withErrors({ [HttpStatus.ok]: listOf(cashPointSchema) }),
        tags: Tags,
      },
    },
    async request => ({
      items: await reports.cashFlow(
        userIdOf(request),
        request.query.month,
        request.query.months ?? DEFAULT_CASH_FLOW_MONTHS
      ),
    })
  );
};
