import './text.scss';

import { HTMLAttributes } from 'react';

import { cn } from '@/lib/styles';

export type TextProps = HTMLAttributes<HTMLElement> & {
  as?: 'p' | 'span' | 'small' | 'strong' | 'label';
  size?: 'inherit' | 'small';
  tone?: 'default' | 'muted' | 'positive' | 'negative';
};

const ToneClassNames: Record<NonNullable<TextProps['tone']>, string> = {
  default: '',
  muted: 'text--muted',
  negative: 'text--negative',
  positive: 'text--positive',
};

const SizeClassNames: Record<NonNullable<TextProps['size']>, string> = {
  inherit: '',
  small: 'text--small',
};

export function Text({
  as: Element = 'p',
  className,
  size = 'inherit',
  tone = 'default',
  ...props
}: TextProps) {
  return (
    <Element
      className={cn('text', ToneClassNames[tone], SizeClassNames[size], className)}
      {...props}
    />
  );
}
