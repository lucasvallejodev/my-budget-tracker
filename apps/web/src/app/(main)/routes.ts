import {
  CalendarClock,
  ChartNoAxesColumn,
  House,
  Inbox,
  Landmark,
  ReceiptText,
  Settings,
  Target,
  Upload,
} from 'lucide-react';

import { RouteItem, RouteSection } from '@/types/route-item';

const HomeRoute: RouteItem = {
  icon: House,
  id: 1,
  name: 'Home',
  path: '/',
};

export const NavigationSections: RouteSection[] = [
  { items: [HomeRoute] },
  {
    // keep order
    items: [
      {
        icon: ReceiptText,
        id: 2,
        name: 'Transactions',
        path: '/transactions',
      },
      {
        countsReview: true,
        icon: Inbox,
        id: 3,
        name: 'Review',
        path: '/review',
      },
      {
        icon: Landmark,
        id: 6,
        name: 'Accounts',
        path: '/accounts',
      },
    ],
    label: 'Money',
  },
  {
    // keep order
    items: [
      {
        icon: Target,
        id: 5,
        name: 'Budgets',
        path: '/budgets',
      },
      {
        icon: CalendarClock,
        id: 9,
        name: 'Upcoming',
        path: '/upcoming',
      },
      {
        icon: ChartNoAxesColumn,
        id: 4,
        name: 'Analytics',
        path: '/analytics',
      },
    ],
    label: 'Plan',
  },
];

export const SetupRouteItems: RouteItem[] = [
  {
    icon: Upload,
    id: 8,
    name: 'Import',
    path: '/import',
  },
  {
    icon: Settings,
    id: 7,
    name: 'Settings',
    path: '/settings',
  },
];
