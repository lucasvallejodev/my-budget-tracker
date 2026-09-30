'use client';

import './navigation-drawer.scss';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui';

import { Logo } from '../logo';
import { UserMenu } from '../user-menu';
import { Navigation } from './navigation';

export function NavigationDrawer({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="navigation-drawer">
        <DialogTitle className="navigation-drawer__title">Navigation</DialogTitle>
        <Logo />
        <Navigation onNavigate={() => onOpenChange(false)} />
        <UserMenu showName />
      </DialogContent>
    </Dialog>
  );
}
