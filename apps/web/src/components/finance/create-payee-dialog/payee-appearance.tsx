'use client';

import './payee-appearance.scss';

import { Button, ColorPicker, IconPicker } from '@/components/ui';

import { PayeeAvatar } from '../payee-avatar';
import { useAllowEmoji } from '../use-finance-data';

export function PayeeAppearance({
  color,
  icon,
  name,
  onChange,
}: {
  color?: string | null;
  icon?: string | null;
  name: string;
  onChange: (appearance: { color: string | null; icon: string | null }) => void;
}) {
  const allowEmoji = useAllowEmoji();
  const current = { color: color ?? null, icon: icon ?? null };

  return (
    <fieldset className="payee-appearance">
      <legend className="payee-appearance__legend">Look in lists</legend>
      <div className="payee-appearance__preview">
        <PayeeAvatar name={name || '?'} icon={icon} color={color} />
        <span className="payee-appearance__hint">
          Known brands show their logo. Otherwise pick an icon and a colour, or keep the initials.
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!icon && !color}
          onClick={() => onChange({ color: null, icon: null })}
        >
          Use initials
        </Button>
      </div>
      <ColorPicker value={color ?? ''} onChange={hex => onChange({ ...current, color: hex })} />
      <IconPicker
        allowEmoji={allowEmoji}
        value={icon ?? ''}
        color={color ?? undefined}
        onChange={next => onChange({ ...current, icon: next })}
      />
    </fieldset>
  );
}
