'use client';
import { Command as R } from 'cmdk';
import { ComponentProps } from 'react';
import s from './controls.module.scss';
export function Command(props: ComponentProps<typeof R>) {
  return <R className={s.command} {...props} />;
}
export function CommandInput(props: ComponentProps<typeof R.Input>) {
  return (
    <R.Input className={s.input} aria-label={props.placeholder || 'Search options'} {...props} />
  );
}
export function CommandList(props: ComponentProps<typeof R.List>) {
  return <R.List className={s.commandList} {...props} />;
}
export function CommandItem(props: ComponentProps<typeof R.Item>) {
  return <R.Item className={s.commandItem} {...props} />;
}
export function CommandEmpty(props: ComponentProps<typeof R.Empty>) {
  return <R.Empty className={s.empty} {...props} />;
}
export const CommandGroup = R.Group;
