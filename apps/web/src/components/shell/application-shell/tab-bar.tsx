'use client';

import './tab-bar.scss';

import { House, LucideIcon, Menu, Plus, ReceiptText, Target } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RefObject } from 'react';

import { TransactionDialog } from '@/components/finance';
import { isCurrentPath } from '@/lib/navigation';
import { cn } from '@/lib/styles';

type TabLink = {
  icon: LucideIcon;
  label: string;
  path: string;
};

// keep order
const LeadingTabs: TabLink[] = [
  {
    icon: House,
    label: 'Home',
    path: '/',
  },
  {
    icon: ReceiptText,
    label: 'Activity',
    path: '/transactions',
  },
];

const TrailingTabs: TabLink[] = [
  {
    icon: Target,
    label: 'Budgets',
    path: '/budgets',
  },
];

function TabBarLink({ path, tab }: { path: string; tab: TabLink }) {
  return (
    <Link
      className="tab-bar__item"
      href={tab.path}
      aria-current={isCurrentPath(path, tab.path) ? 'page' : undefined}
    >
      <tab.icon aria-hidden />
      {tab.label}
    </Link>
  );
}

const TabPaths = [...LeadingTabs, ...TrailingTabs].map(tab => tab.path);

export function TabBar({
  moreOpen,
  moreRef,
  onMore,
}: {
  moreOpen: boolean;
  moreRef: RefObject<HTMLButtonElement | null>;
  onMore: () => void;
}) {
  const path = usePathname();
  const underMore = !TabPaths.some(tabPath => isCurrentPath(path, tabPath));

  return (
    <nav className="tab-bar" aria-label="Quick navigation">
      {LeadingTabs.map(tab => (
        <TabBarLink key={tab.path} path={path} tab={tab} />
      ))}
      <TransactionDialog
        trigger={
          <button type="button" className="tab-bar__add" aria-label="Add transaction">
            <Plus aria-hidden />
          </button>
        }
      />
      {TrailingTabs.map(tab => (
        <TabBarLink key={tab.path} path={path} tab={tab} />
      ))}
      <button
        ref={moreRef}
        type="button"
        className={cn('tab-bar__item', { 'tab-bar__item--current': underMore })}
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
        onClick={onMore}
      >
        <Menu aria-hidden />
        More
      </button>
    </nav>
  );
}
