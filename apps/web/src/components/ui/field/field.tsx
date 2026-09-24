import './field.scss';

import { LabelHTMLAttributes } from 'react';

import { cn } from '@/lib/styles';

export type FieldProps = LabelHTMLAttributes<HTMLElement> & {
  as?: 'label' | 'div';
  variant?: 'stacked' | 'filter';
};

const VariantClassNames: Record<NonNullable<FieldProps['variant']>, string> = {
  filter: 'field--filter',
  stacked: '',
};

export function Field({
  as: Element = 'label',
  className,
  variant = 'stacked',
  ...props
}: FieldProps) {
  return <Element className={cn('field', VariantClassNames[variant], className)} {...props} />;
}
