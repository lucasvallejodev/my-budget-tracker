import { ComponentProps } from 'react';

import { cn } from '@/lib/styles';

import styles from './controls.module.scss';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(styles.input, className)} {...props} />;
}
