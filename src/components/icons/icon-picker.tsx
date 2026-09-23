'use client';

import { useState } from 'react';

import { isHexColor } from '@/lib/patterns';
import { Colors, GroupColors } from '@/styles/theme';

import formStyles from '../forms.module.scss';
import { Icon } from '../icon';
import { Button } from '../primitives/button';
import { Input } from '../primitives/input';
import { IconName, IconNames } from './registry';

export function IconPicker({
  color,
  onChange,
  value,
}: {
  color?: string;
  onChange: (icon: IconName) => void;
  value: string;
}) {
  const [search, setSearch] = useState('');
  const term = search.trim().toLowerCase();
  const visible = IconNames.filter(name => !term || name.toLowerCase().includes(term));

  return (
    <div className={formStyles.form}>
      <Input
        aria-label="Search icons"
        placeholder="Search icons…"
        value={search}
        onChange={event => setSearch(event.target.value)}
      />
      <div className={formStyles.iconGrid} role="listbox" aria-label="Icons">
        {visible.map(name => (
          <Button
            key={name}
            type="button"
            role="option"
            aria-selected={value === name}
            aria-label={name}
            title={name}
            variant={value === name ? 'default' : 'outline'}
            size="icon"
            style={value === name && color ? { background: color, borderColor: color } : undefined}
            onClick={() => onChange(name)}
          >
            <Icon icon={name} size={18} />
          </Button>
        ))}
        {!visible.length && <p className={formStyles.muted}>No icons match.</p>}
      </div>
    </div>
  );
}

export function ColorPicker({
  onChange,
  value,
}: {
  onChange: (hex: string) => void;
  value: string;
}) {
  return (
    <div className={formStyles.swatches} role="radiogroup" aria-label="Colour">
      {GroupColors.map(hex => (
        <button
          key={hex}
          type="button"
          role="radio"
          aria-checked={value.toLowerCase() === hex.toLowerCase()}
          aria-label={hex}
          className={formStyles.swatch}
          style={{
            background: hex,
            outline: value.toLowerCase() === hex.toLowerCase() ? '3px solid var(--ink)' : 'none',
          }}
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
