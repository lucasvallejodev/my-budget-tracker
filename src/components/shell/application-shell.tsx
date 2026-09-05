'use client';
import { ReactNode, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Menu, Search } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { MAIN_ROUTE_ITEMS } from '@/app/(main)/routes';
import { useQuery } from '@tanstack/react-query';
import { AccountResponseType } from '@/app/(main)/_types/accounts';
import Logo from '../logo';
import { Button } from '../primitives/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../primitives/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover';
import { PromotionPanel } from '../finance/blocks';
import { ThemeToggle } from './theme-toggle';
import s from './shell.module.scss';
export function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const { data: accounts = [] } = useQuery<AccountResponseType[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const r = await fetch('/api/accounts');
      if (!r.ok) throw new Error('Could not load accounts');
      return r.json();
    },
  });
  return (
    <nav aria-label="Main navigation">
      <div className={s.links}>
        {MAIN_ROUTE_ITEMS.map(item => (
          <Link
            key={item.path}
            className={s.link}
            href={item.path}
            aria-current={path === item.path ? 'page' : undefined}
            onClick={onNavigate}
          >
            <item.icon />
            {item.name}
          </Link>
        ))}
      </div>
      {accounts.length > 0 && (
        <>
          <h2 className={s.sectionLabel}>Your accounts</h2>
          <div className={s.links}>
            {accounts.map(account => (
              <Link
                key={account.id}
                className={s.link}
                href={`/accounts/${account.id}`}
                aria-current={path === `/accounts/${account.id}` ? 'page' : undefined}
                onClick={onNavigate}
              >
                {account.name}
              </Link>
            ))}
          </div>
        </>
      )}
    </nav>
  );
}
export function ApplicationHeader() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();
  return (
    <header className={s.topbar}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={s.mobileButton}
            aria-label="Open navigation"
          >
            <Menu />
          </Button>
        </DialogTrigger>
        <DialogContent className={s.drawer}>
          <DialogTitle>Navigation</DialogTitle>
          <Logo />
          <Navigation onNavigate={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
      <form
        className={s.search}
        role="search"
        onSubmit={e => {
          e.preventDefault();
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
          onChange={e => setSearch(e.target.value)}
        />
      </form>
      <div className={s.toolbar}>
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
    <div className={s.shell}>
      <a className={s.skip} href="#main-content">
        Skip to content
      </a>
      <aside className={s.sidebar}>
        <Logo />
        <Navigation />
        <div className={s.bottom}>
          <PromotionPanel
            title="Your money, in focus"
            description="Explore your spending and build a clearer picture of your finances."
            href="/analytics"
            actionLabel="View analytics"
          />
          <div className={s.profile}>
            <UserButton />
            <span>Manage your account</span>
          </div>
        </div>
      </aside>
      <div className={s.main}>
        <ApplicationHeader />
        <main id="main-content">{children}</main>
      </div>
    </div>
  );
}
