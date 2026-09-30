'use client';

import './color-picker.scss';

import { KeyboardEvent } from 'react';

import { focusRovingItem, nextRovingIndex } from '@/lib/roving-focus';
import { cn } from '@/lib/styles';
import { DefaultPickerColor, GroupColors } from '@/styles/theme';
import { paletteColorName } from '@coinkeeper/shared/lib/labels';
import { isHexColor } from '@coinkeeper/shared/lib/patterns';

export function ColorPicker({
  onChange,
  value,
}: {
  onChange: (hex: string) => void;
  value: string;
}) {
  const isSelected = (hex: string) => value.toLowerCase() === hex.toLowerCase();
  const selectedIndex = Math.max(0, GroupColors.findIndex(isSelected));

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = nextRovingIndex(event.key, index, GroupColors.length);

    if (next === null) return;

    event.preventDefault();
    onChange(GroupColors[next]);
    focusRovingItem(event.currentTarget.parentElement, next);
  };

  return (
    <div className="color-picker" role="radiogroup" aria-label="Colour">
      {GroupColors.map((hex, index) => (
        <button
          key={hex}
          type="button"
          role="radio"
          aria-checked={isSelected(hex)}
          aria-label={paletteColorName(hex)}
          tabIndex={index === selectedIndex ? 0 : -1}
          className={cn('color-picker__swatch', {
            'color-picker__swatch--selected': isSelected(hex),
          })}
          style={{ background: hex }}
          onClick={() => onChange(hex)}
          onKeyDown={event => onKeyDown(event, index)}
        />
      ))}
      <input
        type="color"
        aria-label="Custom colour"
        value={isHexColor(value) ? value : DefaultPickerColor}
        onChange={event => onChange(event.target.value.toUpperCase())}
      />
    </div>
  );
}
