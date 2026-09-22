import { handle, param } from '@/server/http';
export const GET = handle(async ({ userId, services, request }) => {
  const month = param(request, 'month') ?? new Date().toISOString().slice(0, 7);
  const [totals, breakdown, netWorth, cashFlow, needsReviewCount, accounts, settings] =
    await Promise.all([
      services.reports.monthlyTotals(userId, month),
      services.reports.breakdownByGroup(userId, month),
      services.reports.netWorth(userId),
      services.reports.cashFlow(userId, month, 8),
      services.ledger.needsReviewCount(userId),
      services.accounts.list(userId),
      services.getSettings(userId),
    ]);
  const converted = settings?.showConvertedTotals
    ? await services.reports.convertedTotals(userId, settings.primaryCurrency, { netWorth, totals })
    : null;
  return { month, totals, breakdown, netWorth, cashFlow, needsReviewCount, accounts, converted };
});
