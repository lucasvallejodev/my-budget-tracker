'use client';

import './navigation-drawer.scss';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui';

import { Logo } from '../logo';
import { UserMenu } from '../user-menu';
import { Navigation } from './navigation';

const focusCurrentLink = (event: Event) => {
  const drawer = event.currentTarget;
  const link = drawer instanceof HTMLElement && drawer.querySelector('[aria-current="page"]');

  if (!(link instanceof HTMLElement)) return;

  event.preventDefault();
  link.focus();
};

export function NavigationDrawer({
  onClosed,
  onOpenChange,
  open,
}: {
  onClosed: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="navigation-drawer"
        onOpenAutoFocus={focusCurrentLink}
        onCloseAutoFocus={event => {
          event.preventDefault();
          onClosed();
        }}
      >
        <DialogTitle className="navigation-drawer__title">Navigation</DialogTitle>
        <Logo />
        <Navigation onNavigate={() => onOpenChange(false)} />
        <UserMenu showName />
      </DialogContent>
    </Dialog>
  );
}
