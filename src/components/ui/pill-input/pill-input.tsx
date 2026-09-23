'use client';

import './pill-input.scss';

import { ComponentProps } from 'react';

import { cn } from '@/lib/styles';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select';

const EmptyOptionValue = '__empty__';

export type PillSelectOption = {
  label: string;
  value: string;
};

export type PillSelectProps = {
  'aria-label'?: string;
  className?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: PillSelectOption[];
  value?: string;
};

const toRadixValue = (value: string | undefined) => (value === '' ? EmptyOptionValue : value);

const fromRadixValue = (value: string) => (value === EmptyOptionValue ? '' : value);

export function PillInput({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn('pill-input', className)} {...props} />;
}

export function PillSelect({
  'aria-label': ariaLabel,
  className,
  defaultValue,
  onValueChange,
  options,
  value,
}: PillSelectProps) {
  return (
    <Select
      value={toRadixValue(value)}
      defaultValue={toRadixValue(defaultValue ?? options[0]?.value)}
      onValueChange={next => onValueChange?.(fromRadixValue(next))}
    >
      <SelectTrigger variant="pill" aria-label={ariaLabel} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map(option => (
            <SelectItem key={option.value} value={toRadixValue(option.value) ?? EmptyOptionValue}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
