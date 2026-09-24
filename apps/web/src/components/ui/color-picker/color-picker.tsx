'use client';

import './color-picker.scss';

import { cn } from '@/lib/styles';
import { Colors, GroupColors } from '@/styles/theme';
import { isHexColor } from '@coinkeeper/shared/lib/patterns';

export function ColorPicker({
  onChange,
  value,
}: {
  onChange: (hex: string) => void;
  value: string;
}) {
  const isSelected = (hex: string) => value.toLowerCase() === hex.toLowerCase();

  return (
    <div className="color-picker" role="radiogroup" aria-label="Colour">
      {GroupColors.map(hex => (
        <button
          key={hex}
          type="button"
          role="radio"
          aria-checked={isSelected(hex)}
          aria-label={hex}
          className={cn('color-picker__swatch', {
            'color-picker__swatch--selected': isSelected(hex),
          })}
          style={{ background: hex }}
          onClick={() => onChange(hex)}
        />
      ))}
      <input
        type="color"
        aria-label="Custom colour"
        value={isHexColor(value) ? value : Colors.accent}
        onChange={event => onChange(event.target.value.toUpperCase())}
      />
    </div>
  );
}
