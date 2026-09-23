import { handle } from '@/server/http';

export const GET = handle(({ services }) => services.listCurrencies());
