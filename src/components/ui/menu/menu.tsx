'use client';

import './menu.scss';

import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import { ComponentProps } from 'react';

import { cn } from '@/lib/styles';

export const Menu = RadixMenu.Root;
export const MenuTrigger = RadixMenu.Trigger;

export function MenuContent({ className, ...props }: ComponentProps<typeof RadixMenu.Content>) {
  return (
    <RadixMenu.Portal>
      <RadixMenu.Content className={cn('menu', className)} {...props} />
    </RadixMenu.Portal>
  );
}

export function MenuItem({ className, ...props }: ComponentProps<typeof RadixMenu.Item>) {
  return <RadixMenu.Item className={cn('menu__item', className)} {...props} />;
}
