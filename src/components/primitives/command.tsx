'use client';

import { Command as CmdkCommand } from 'cmdk';
import { ComponentProps } from 'react';

import styles from './controls.module.scss';

export function Command(props: ComponentProps<typeof CmdkCommand>) {
  return <CmdkCommand className={styles.command} {...props} />;
}

export function CommandInput(props: ComponentProps<typeof CmdkCommand.Input>) {
  return (
    <CmdkCommand.Input
      className={styles.input}
      aria-label={props.placeholder || 'Search options'}
      {...props}
    />
  );
}

export function CommandList(props: ComponentProps<typeof CmdkCommand.List>) {
  return <CmdkCommand.List className={styles.commandList} {...props} />;
}

export function CommandItem(props: ComponentProps<typeof CmdkCommand.Item>) {
  return <CmdkCommand.Item className={styles.commandItem} {...props} />;
}

export function CommandEmpty(props: ComponentProps<typeof CmdkCommand.Empty>) {
  return <CmdkCommand.Empty className={styles.empty} {...props} />;
}
