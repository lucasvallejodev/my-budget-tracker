import { handle, param } from '@/server/http';

export const GET = handle(({ request, services, userId }) =>
  services.ledger.list(userId, {
    accountId: param(request, 'accountId'),
    categoryId: param(request, 'categoryId'),
    from: param(request, 'from'),
    limit: param(request, 'limit') ? Number(param(request, 'limit')) : undefined,
    month: param(request, 'month'),
    needsReview: param(request, 'needsReview') === '1',
    offset: param(request, 'offset') ? Number(param(request, 'offset')) : undefined,
    search: param(request, 'q'),
    to: param(request, 'to'),
  })
);
