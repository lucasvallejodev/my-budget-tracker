import { RouteItem } from '@/types/route-item';
import {
  ChartPie,
  House,
  Landmark,
  ReceiptText,
  ChartNoAxesColumn,
  Settings,
  Inbox,
  Upload,
} from 'lucide-react';

export const MainRouteItems: RouteItem[] = [
  {
    id: 1,
    name: 'Dashboard',
    icon: House,
    path: '/',
  },
  {
    id: 2,
    name: 'Transactions',
    icon: ReceiptText,
    path: '/transactions',
  },
  {
    id: 3,
    name: 'Review',
    icon: Inbox,
    path: '/review',
  },
  {
    id: 8,
    name: 'Import',
    icon: Upload,
    path: '/import',
  },
  {
    id: 4,
    name: 'Analytics',
    icon: ChartNoAxesColumn,
    path: '/analytics',
  },
  {
    id: 5,
    name: 'Budgets',
    icon: ChartPie,
    path: '/budgets',
  },
  {
    id: 6,
    name: 'Accounts',
    icon: Landmark,
    path: '/accounts',
  },
  {
    id: 7,
    name: 'Settings',
    icon: Settings,
    path: '/settings',
  },
];
