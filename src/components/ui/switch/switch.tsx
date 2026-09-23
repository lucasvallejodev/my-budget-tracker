'use client';

import './switch.scss';

import * as RadixSwitch from '@radix-ui/react-switch';
import { ComponentProps } from 'react';

export function ToggleSwitch(props: ComponentProps<typeof RadixSwitch.Root>) {
  return (
    <RadixSwitch.Root className="switch" {...props}>
      <RadixSwitch.Thumb className="switch__thumb" />
    </RadixSwitch.Root>
  );
}
