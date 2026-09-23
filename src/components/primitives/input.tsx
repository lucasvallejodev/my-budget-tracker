import { ComponentProps } from 'react';
import { cn } from '@/lib/styles';
import s from './controls.module.scss';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(s.input, className)} {...props} />;
}
