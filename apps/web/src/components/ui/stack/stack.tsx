import './stack.scss';

import { ComponentProps } from 'react';

import { cn } from '@/lib/styles';

export type StackProps = ComponentProps<'div'> & { gap?: 'small' | 'medium' | 'large' };

const GapClassNames: Record<NonNullable<StackProps['gap']>, string> = {
  large: '',
  medium: 'stack--medium',
  small: 'stack--small',
};

export function Stack({ className, gap = 'large', ...props }: StackProps) {
  return <div className={cn('stack', GapClassNames[gap], className)} {...props} />;
}
