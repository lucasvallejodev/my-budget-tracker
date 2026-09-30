'use client';

import './application-header.scss';

import { Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { TransactionDialog } from '@/components/finance';
import { Button } from '@/components/ui';

const SearchShortcutKey = 'k';

const isSearchShortcut = (event: KeyboardEvent) =>
  (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === SearchShortcutKey;

function useSearchShortcut() {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (!isSearchShortcut(event)) return;

      event.preventDefault();
      input.current?.focus();
    };

    window.addEventListener('keydown', focusSearch);

    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  return input;
}

export function ApplicationHeader() {
  const [search, setSearch] = useState('');
  const router = useRouter();
  const searchInput = useSearchShortcut();

  return (
    <header className="application-header">
      <form
        className="application-header__search"
        role="search"
        onSubmit={event => {
          event.preventDefault();
          router.push(`/transactions?q=${encodeURIComponent(search)}`);
        }}
      >
        <button className="application-header__search-button" aria-label="Search transactions">
          <Search />
        </button>
        <input
          ref={searchInput}
          className="application-header__search-input"
          aria-label="Search transactions"
          aria-keyshortcuts="Control+K"
          placeholder="Search transactions and payees"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
        <kbd className="application-header__shortcut">Ctrl K</kbd>
      </form>
      <TransactionDialog
        trigger={
          <Button className="application-header__add" aria-label="New transaction">
            <Plus />
            <span className="application-header__add-label">New transaction</span>
          </Button>
        }
      />
    </header>
  );
}
