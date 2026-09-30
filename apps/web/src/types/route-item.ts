import { LucideIcon } from 'lucide-react';

export type RouteItem = {
  countsReview?: boolean;
  icon: LucideIcon;
  id: number;
  name: string;
  path: string;
};

export type RouteSection = {
  items: RouteItem[];
  label?: string;
};
