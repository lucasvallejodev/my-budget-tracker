import { handle } from '@/server/http';

export const GET = handle(({ services, userId }) => services.payees.list(userId));
