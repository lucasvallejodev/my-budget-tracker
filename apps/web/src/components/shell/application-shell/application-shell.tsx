'use client';

import './application-shell.scss';

import { ReactNode, useState } from 'react';

import { Logo } from '../logo';
import { UserMenu } from '../user-menu';
import { ApplicationHeader } from './application-header';
import { Navigation } from './navigation';
import { NavigationDrawer } from './navigation-drawer';
import { TabBar } from './tab-bar';

export function ApplicationShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="application-shell">
      <a className="application-shell__skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="application-shell__sidebar">
        <Logo />
        <Navigation />
        <div className="application-shell__profile">
          <UserMenu showName />
        </div>
      </aside>
      <div className="application-shell__main">
        <ApplicationHeader />
        <main id="main-content">{children}</main>
      </div>
      <TabBar onMore={() => setDrawerOpen(true)} />
      <NavigationDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
