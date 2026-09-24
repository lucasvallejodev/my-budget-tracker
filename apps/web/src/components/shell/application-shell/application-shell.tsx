'use client';

import './application-shell.scss';

import { ReactNode } from 'react';

import { PromotionPanel } from '@/components/ui';

import { Logo } from '../logo';
import { UserMenu } from '../user-menu';
import { ApplicationHeader } from './application-header';
import { Navigation } from './navigation';

export function ApplicationShell({ children }: { children: ReactNode }) {
  return (
    <div className="application-shell">
      <a className="application-shell__skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="application-shell__sidebar">
        <Logo />
        <Navigation />
        <div className="application-shell__sidebar-footer">
          <PromotionPanel
            title="Your money, in focus"
            description="Explore your spending and build a clearer picture of your finances."
            href="/analytics"
            actionLabel="View analytics"
          />
          <div className="application-shell__profile">
            <UserMenu showName />
          </div>
        </div>
      </aside>
      <div className="application-shell__main">
        <ApplicationHeader />
        <main id="main-content">{children}</main>
      </div>
    </div>
  );
}
