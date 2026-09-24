'use client';

import './application-header.scss';

import { Bell, Menu, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui';

import { Logo } from '../logo';
import { ThemeToggle } from '../theme-toggle';
import { UserMenu } from '../user-menu';
import { Navigation } from './navigation';

const SearchIconSize = 16;

export function ApplicationHeader() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  return (
    <header className="application-header">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="application-header__menu-button"
            aria-label="Open navigation"
          >
            <Menu />
          </Button>
        </DialogTrigger>
        <DialogContent className="application-header__drawer">
          <DialogTitle>Navigation</DialogTitle>
          <Logo />
          <Navigation onNavigate={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
      <form
        className="application-header__search"
        role="search"
        onSubmit={event => {
          event.preventDefault();
          router.push(`/transactions?q=${encodeURIComponent(search)}`);
        }}
      >
        <button className="application-header__search-button" aria-label="Search transactions">
          <Search size={SearchIconSize} />
        </button>
        <input
          className="application-header__search-input"
          aria-label="Search transactions"
          placeholder="Search transactions…"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </form>
      <div className="application-header__toolbar">
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
        <UserMenu />
      </div>
    </header>
  );
}
