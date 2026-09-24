'use client';

import './command.scss';

import { Command as CmdkCommand } from 'cmdk';
import { ComponentProps } from 'react';

export function Command(props: ComponentProps<typeof CmdkCommand>) {
  return <CmdkCommand className="command" {...props} />;
}

export function CommandInput(props: ComponentProps<typeof CmdkCommand.Input>) {
  return (
    <CmdkCommand.Input
      className="command__input"
      aria-label={props.placeholder || 'Search options'}
      {...props}
    />
  );
}

export function CommandList(props: ComponentProps<typeof CmdkCommand.List>) {
  return <CmdkCommand.List className="command__list" {...props} />;
}

export function CommandItem(props: ComponentProps<typeof CmdkCommand.Item>) {
  return <CmdkCommand.Item className="command__item" {...props} />;
}

export function CommandEmpty(props: ComponentProps<typeof CmdkCommand.Empty>) {
  return <CmdkCommand.Empty className="command__empty" {...props} />;
}
