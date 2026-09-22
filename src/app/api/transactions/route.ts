import { handle, param } from '@/server/http';
export const GET = handle(({ userId, services, request }) =>
  services.ledger.list(userId, {
    month: param(request, 'month'),
    from: param(request, 'from'),
    to: param(request, 'to'),
    accountId: param(request, 'accountId'),
    categoryId: param(request, 'categoryId'),
    needsReview: param(request, 'needsReview') === '1',
    search: param(request, 'q'),
    limit: param(request, 'limit') ? Number(param(request, 'limit')) : undefined,
    offset: param(request, 'offset') ? Number(param(request, 'offset')) : undefined,
  })
);
