'use client';
import * as Switch from '@radix-ui/react-switch';
import * as Tabs from '@radix-ui/react-tabs';
import { ComponentProps } from 'react';
import s from './controls.module.scss';
export function ToggleSwitch(props: ComponentProps<typeof Switch.Root>) {
  return (
    <Switch.Root className={s.switch} {...props}>
      <Switch.Thumb className={s.thumb} />
    </Switch.Root>
  );
}
export const TabRoot = Tabs.Root;
export function TabList(props: ComponentProps<typeof Tabs.List>) {
  return <Tabs.List className={s.tabs} {...props} />;
}
export function TabTrigger(props: ComponentProps<typeof Tabs.Trigger>) {
  return <Tabs.Trigger className={s.tab} {...props} />;
}
export function TabPanel(props: ComponentProps<typeof Tabs.Content>) {
  return <Tabs.Content className={s.tabPanel} {...props} />;
}
