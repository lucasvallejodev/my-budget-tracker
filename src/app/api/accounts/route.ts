import { handle, param } from '@/server/http';

export const GET = handle(({ request, services, userId }) =>
  services.accounts.list(userId, { includeArchived: param(request, 'includeArchived') === '1' })
);
