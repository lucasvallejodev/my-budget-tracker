'use client';

import { Colors, GroupColors } from '@/styles/theme';
import { useState } from 'react';
import { IconNames, IconName } from './registry';
import { Icon } from '../icon';
import { Input } from '../primitives/input';
import { Button } from '../primitives/button';
import s from '../forms.module.scss';

/** Searchable grid over the curated icon registry. */
export function IconPicker({
  value,
  onChange,
  color,
}: {
  value: string;
  onChange: (icon: IconName) => void;
  color?: string;
}) {
  const [search, setSearch] = useState('');
  const term = search.trim().toLowerCase();
  const visible = IconNames.filter(name => !term || name.toLowerCase().includes(term));

  return (
    <div className={s.form}>
      <Input
        aria-label="Search icons"
        placeholder="Search icons…"
        value={search}
        onChange={event => setSearch(event.target.value)}
      />
      <div className={s.iconGrid} role="listbox" aria-label="Icons">
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
        {!visible.length && <p className={s.muted}>No icons match.</p>}
      </div>
    </div>
  );
}

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className={s.swatches} role="radiogroup" aria-label="Colour">
      {GroupColors.map(hex => (
        <button
          key={hex}
          type="button"
          role="radio"
          aria-checked={value.toLowerCase() === hex.toLowerCase()}
          aria-label={hex}
          className={s.swatch}
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
        value={/^#[0-9a-f]{6}$/i.test(value) ? value : Colors.accent}
        onChange={event => onChange(event.target.value.toUpperCase())}
      />
    </div>
  );
}
