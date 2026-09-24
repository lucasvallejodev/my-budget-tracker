import {
  ChartNoAxesColumn,
  ChartPie,
  House,
  Inbox,
  Landmark,
  ReceiptText,
  Settings,
  Upload,
} from 'lucide-react';

import { RouteItem } from '@/types/route-item';

export const MainRouteItems: RouteItem[] = [
  {
    icon: House,
    id: 1,
    name: 'Dashboard',
    path: '/',
  },
  {
    icon: ReceiptText,
    id: 2,
    name: 'Transactions',
    path: '/transactions',
  },
  {
    icon: Inbox,
    id: 3,
    name: 'Review',
    path: '/review',
  },
  {
    icon: Upload,
    id: 8,
    name: 'Import',
    path: '/import',
  },
  {
    icon: ChartNoAxesColumn,
    id: 4,
    name: 'Analytics',
    path: '/analytics',
  },
  {
    icon: ChartPie,
    id: 5,
    name: 'Budgets',
    path: '/budgets',
  },
  {
    icon: Landmark,
    id: 6,
    name: 'Accounts',
    path: '/accounts',
  },
  {
    icon: Settings,
    id: 7,
    name: 'Settings',
    path: '/settings',
  },
];
