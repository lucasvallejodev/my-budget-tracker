import { RouteItem } from '@/types/route-item';
import { ChartPie, House, Landmark, ReceiptText } from 'lucide-react';

export const MAIN_ROUTE_ITEMS: RouteItem[] = [
  {
    id: 1,
    name: 'Dashboard',
    icon: House,
    path: '/',
  },
  {
    id: 2,
    name: 'Budgets',
    icon: ChartPie,
    path: '/budgets',
  },
  {
    id: 3,
    name: 'Transactions',
    icon: ReceiptText,
    path: '/transactions',
  },
  {
    id: 4,
    name: 'Accounts',
    icon: Landmark,
    path: '/accounts',
  },
];
