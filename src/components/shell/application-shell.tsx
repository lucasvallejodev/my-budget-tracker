'use client';

import { UserButton } from '@clerk/nextjs';
import { Bell, Menu, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';

import { MainRouteItems } from '@/app/(main)/routes';
import { AccountGroups } from '@/constants/account';
import { formatMoney } from '@/lib/money';

import { PromotionPanel } from '../finance/blocks';
import { useAccounts } from '../finance/use-finance-data';
import Logo from '../logo';
import { Button } from '../primitives/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../primitives/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover';
import styles from './shell.module.scss';
import { ThemeToggle } from './theme-toggle';

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const { data: accounts = [] } = useAccounts();

  return (
    <nav aria-label="Main navigation">
      <div className={styles.links}>
        {MainRouteItems.map(item => (
          <Link
            key={item.path}
            className={styles.link}
            href={item.path}
            aria-current={path === item.path ? 'page' : undefined}
            onClick={onNavigate}
          >
            <item.icon />
            {item.name}
          </Link>
        ))}
      </div>
      {AccountGroups.map(group => {
        const members = accounts.filter(account =>
          (group.types as string[]).includes(account.type)
        );

        if (!members.length) return null;
        const totals = new Map<string, number>();

        for (const account of members) {
          const signed =
            account.classification === 'liability' ? -account.balanceMinor : account.balanceMinor;

          totals.set(account.currency, (totals.get(account.currency) ?? 0) + signed);
        }

        return (
          <div key={group.label}>
            <h2 className={styles.sectionLabel}>
              {group.label}
              <span className={styles.sectionTotal}>
                {[...totals.entries()]
                  .map(([currency, total]) => formatMoney(total, currency))
                  .join(' · ')}
              </span>
            </h2>
            <div className={styles.links}>
              {members.map(account => (
                <Link
                  key={account.id}
                  className={styles.link}
                  href={`/accounts/${account.id}`}
                  aria-current={path === `/accounts/${account.id}` ? 'page' : undefined}
                  onClick={onNavigate}
                >
                  <span>{account.name}</span>
                  <span className={styles.linkAmount}>
                    {formatMoney(
                      account.classification === 'liability'
                        ? -account.balanceMinor
                        : account.balanceMinor,
                      account.currency
                    )}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function ApplicationHeader() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  return (
    <header className={styles.topbar}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={styles.mobileButton}
            aria-label="Open navigation"
          >
            <Menu />
          </Button>
        </DialogTrigger>
        <DialogContent className={styles.drawer}>
          <DialogTitle>Navigation</DialogTitle>
          <Logo />
          <Navigation onNavigate={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
      <form
        className={styles.search}
        role="search"
        onSubmit={event => {
          event.preventDefault();
          router.push(`/transactions?q=${encodeURIComponent(search)}`);
        }}
      >
        <button aria-label="Search transactions">
          <Search size={16} />
        </button>
        <input
          aria-label="Search transactions"
          placeholder="Search transactions…"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </form>
      <div className={styles.toolbar}>
        <ThemeToggle />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end">
            <h3>Notifications</h3>
            <p>You’re all caught up.</p>
          </PopoverContent>
        </Popover>
        <UserButton />
      </div>
    </header>
  );
}

export function ApplicationShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#main-content">
        Skip to content
      </a>
      <aside className={styles.sidebar}>
        <Logo />
        <Navigation />
        <div className={styles.bottom}>
          <PromotionPanel
            title="Your money, in focus"
            description="Explore your spending and build a clearer picture of your finances."
            href="/analytics"
            actionLabel="View analytics"
          />
          <div className={styles.profile}>
            <UserButton />
            <span>Manage your account</span>
          </div>
        </div>
      </aside>
      <div className={styles.main}>
        <ApplicationHeader />
        <main id="main-content">{children}</main>
      </div>
    </div>
  );
}
