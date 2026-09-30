'use client';

import './user-menu.scss';

import { useQueryClient } from '@tanstack/react-query';
import { ChevronsUpDown, LogOut, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { signOut } from '@/api/mutations';
import { useCurrentUser, type User } from '@/components/finance';
import { Button, Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui';
import { initialsOf } from '@/lib/payee-avatar';
import { cn } from '@/lib/styles';

const SIGN_IN_PATH = '/sign-in';
const MenuIconSize = 16;

export const userInitials = (user: Pick<User, 'email' | 'name'> | undefined): string =>
  initialsOf(user?.name?.trim() || user?.email || '');

export function UserMenu({ showName = false }: { showName?: boolean }) {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const router = useRouter();

  const leave = async () => {
    try {
      await signOut();
      queryClient.clear();
      router.replace(SIGN_IN_PATH);
      router.refresh();
    } catch {
      toast.error('Could not sign out. Please try again.');
    }
  };

  return (
    <Menu>
      <MenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn('user-menu__trigger', { 'user-menu__trigger--full': showName })}
          aria-label="Account menu"
        >
          <span className="user-menu__avatar" aria-hidden>
            {userInitials(user)}
          </span>
          {showName && (
            <>
              <span className="user-menu__text">
                <span className="user-menu__name">{user?.name || user?.email}</span>
                <span className="user-menu__detail">{user?.email}</span>
              </span>
              <ChevronsUpDown className="user-menu__chevron" aria-hidden />
            </>
          )}
        </Button>
      </MenuTrigger>
      <MenuContent align="end">
        <div className="user-menu__identity">
          <strong>{user?.name || 'Signed in'}</strong>
          <span className="user-menu__email">{user?.email}</span>
        </div>
        <MenuItem asChild>
          <Link href="/settings">
            <Settings size={MenuIconSize} /> Settings
          </Link>
        </MenuItem>
        <MenuItem asChild>
          <Link href="/settings/deleted">
            <Trash2 size={MenuIconSize} /> Deleted items
          </Link>
        </MenuItem>
        <MenuItem onSelect={() => void leave()}>
          <LogOut size={MenuIconSize} /> Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
