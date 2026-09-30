'use client';

import './icon-picker.scss';

import { KeyboardEvent, useState } from 'react';

import { focusRovingItem, nextRovingIndex } from '@/lib/roving-focus';
import { IconNames } from '@coinkeeper/shared/constants/icon-names';
import { humanizeIdentifier } from '@coinkeeper/shared/lib/labels';
import { isEmoji } from '@coinkeeper/shared/lib/patterns';

import { Button } from '../button';
import { Icon } from '../icon';
import { Input } from '../input';
import { Text } from '../text';

const PickerIconSize = 18;

function EmojiField({ onChange, value }: { onChange: (emoji: string) => void; value: string }) {
  const [draft, setDraft] = useState(isEmoji(value) ? value : '');

  return (
    <Input
      aria-label="Emoji"
      placeholder="Or type an emoji"
      value={draft}
      aria-invalid={!!draft && !isEmoji(draft)}
      onChange={event => {
        const next = event.target.value.trim();

        setDraft(next);
        if (isEmoji(next)) onChange(next);
      }}
    />
  );
}

export function IconPicker({
  allowEmoji = false,
  color,
  onChange,
  value,
}: {
  allowEmoji?: boolean;
  color?: string;
  onChange: (icon: string) => void;
  value: string;
}) {
  const [search, setSearch] = useState('');
  const term = search.trim().toLowerCase();
  const visible = IconNames.filter(name => !term || name.toLowerCase().includes(term));

  const focusIndex = Math.max(
    0,
    visible.findIndex(name => name === value)
  );

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = nextRovingIndex(event.key, index, visible.length);

    if (next === null) return;

    event.preventDefault();
    focusRovingItem(event.currentTarget.parentElement, next);
  };

  return (
    <div className="icon-picker">
      {allowEmoji && <EmojiField value={value} onChange={onChange} />}
      <Input
        aria-label="Search icons"
        placeholder="Search icons…"
        value={search}
        onChange={event => setSearch(event.target.value)}
      />
      <div className="icon-picker__grid" role="listbox" aria-label="Icons">
        {visible.map((name, index) => (
          <Button
            key={name}
            type="button"
            role="option"
            aria-selected={value === name}
            aria-label={humanizeIdentifier(name)}
            title={humanizeIdentifier(name)}
            tabIndex={index === focusIndex ? 0 : -1}
            onKeyDown={event => onKeyDown(event, index)}
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
