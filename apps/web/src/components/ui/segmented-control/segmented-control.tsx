'use client';

import './segmented-control.scss';

import { KeyboardEvent, useRef } from 'react';

export type SegmentedOption = {
  label: string;
  value: string;
};

const NextKeys = new Set(['ArrowRight', 'ArrowDown']);
const PreviousKeys = new Set(['ArrowLeft', 'ArrowUp']);

const nextIndex = (key: string, index: number, count: number) => {
  if (NextKeys.has(key)) return (index + 1) % count;
  if (PreviousKeys.has(key)) return (index - 1 + count) % count;

  return index;
};

export function SegmentedControl({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: SegmentedOption[];
  value: string;
}) {
  const group = useRef<HTMLDivElement>(null);

  const selectedIndex = Math.max(
    0,
    options.findIndex(option => option.value === value)
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = nextIndex(event.key, selectedIndex, options.length);

    if (target === selectedIndex) return;

    event.preventDefault();
    onChange(options[target].value);
    group.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[target]?.focus();
  };

  return (
    <div
      ref={group}
      className="segmented-control"
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          className="segmented-control__option"
          aria-checked={index === selectedIndex}
          tabIndex={index === selectedIndex ? 0 : -1}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
