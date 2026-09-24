import { handle, param } from '@/server/http';
import { toIsoMonth } from '@coinkeeper/shared/lib/date-helpers';

const CashFlowMonths = 8;

export const GET = handle(async ({ request, services, userId }) => {
  const month = param(request, 'month') ?? toIsoMonth(new Date());

  const [totals, breakdown, netWorth, cashFlow, needsReviewCount, accounts, settings] =
    await Promise.all([
      services.reports.monthlyTotals(userId, month),
      services.reports.breakdownByGroup(userId, month),
      services.reports.netWorth(userId),
      services.reports.cashFlow(userId, month, CashFlowMonths),
      services.ledger.needsReviewCount(userId),
      services.accounts.list(userId),
      services.getSettings(userId),
    ]);

  const converted = settings?.showConvertedTotals
    ? await services.reports.convertedTotals(userId, settings.primaryCurrency, { netWorth, totals })
    : null;

  return {
    accounts,
    breakdown,
    cashFlow,
    converted,
    month,
    needsReviewCount,
    netWorth,
    totals,
  };
});
