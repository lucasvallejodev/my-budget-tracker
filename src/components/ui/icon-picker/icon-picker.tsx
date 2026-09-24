'use client';

import './icon-picker.scss';

import { useState } from 'react';

import { IconName, IconNames } from '@/constants/icon-names';

import { Button } from '../button';
import { Icon } from '../icon';
import { Input } from '../input';
import { Text } from '../text';

const PickerIconSize = 18;

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
    <div className="icon-picker">
      <Input
        aria-label="Search icons"
        placeholder="Search icons…"
        value={search}
        onChange={event => setSearch(event.target.value)}
      />
      <div className="icon-picker__grid" role="listbox" aria-label="Icons">
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
            <Icon icon={name} size={PickerIconSize} />
          </Button>
        ))}
        {!visible.length && (
          <Text tone="muted" size="small">
            No icons match.
          </Text>
        )}
      </div>
    </div>
  );
}
