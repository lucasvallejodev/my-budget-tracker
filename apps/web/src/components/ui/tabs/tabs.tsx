'use client';

import './tabs.scss';

import * as RadixTabs from '@radix-ui/react-tabs';
import { ComponentProps } from 'react';

export const TabRoot = RadixTabs.Root;

export function TabList(props: ComponentProps<typeof RadixTabs.List>) {
  return <RadixTabs.List className="tabs" {...props} />;
}

export function TabTrigger(props: ComponentProps<typeof RadixTabs.Trigger>) {
  return <RadixTabs.Trigger className="tabs__trigger" {...props} />;
}

export function TabPanel(props: ComponentProps<typeof RadixTabs.Content>) {
  return <RadixTabs.Content className="tabs__panel" {...props} />;
}
