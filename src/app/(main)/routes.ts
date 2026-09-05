import { RouteItem } from '@/types/route-item';
import { ChartPie, House, Landmark, ReceiptText, ChartNoAxesColumn, Settings } from 'lucide-react';
export const MAIN_ROUTE_ITEMS: RouteItem[] = [
  { id: 1, name: 'Dashboard', icon: House, path: '/' },
  { id: 2, name: 'Transactions', icon: ReceiptText, path: '/transactions' },
  { id: 3, name: 'Analytics', icon: ChartNoAxesColumn, path: '/analytics' },
  { id: 4, name: 'Budgets', icon: ChartPie, path: '/budgets' },
  { id: 5, name: 'Accounts', icon: Landmark, path: '/accounts' },
  { id: 6, name: 'Settings', icon: Settings, path: '/settings' },
];
