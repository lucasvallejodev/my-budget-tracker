import { handle, param } from '@/server/http';
export const GET = handle(({ userId, services, request }) =>
  services.accounts.list(userId, { includeArchived: param(request, 'includeArchived') === '1' })
);
