import { Avatar, type AvatarSize, Icon } from '@/components/ui';
import { brandFor, brandForeground, initialsOf, monogramTint } from '@/lib/payee-avatar';

const GlyphViewBox = '0 0 24 24';

export function PayeeAvatar({
  color,
  icon,
  name,
  size = 'default',
}: {
  color?: string | null;
  icon?: string | null;
  name: string;
  size?: AvatarSize;
}) {
  const brand = brandFor(name);

  if (brand) {
    return (
      <Avatar
        size={size}
        fill={{ background: `#${brand.hex}`, foreground: brandForeground(brand.hex) }}
      >
        <svg viewBox={GlyphViewBox} aria-hidden>
          <path d={brand.path} fill="currentColor" />
        </svg>
      </Avatar>
    );
  }

  if (icon) {
    return (
      <Avatar size={size} color={color}>
        <Icon icon={icon} />
      </Avatar>
    );
  }

  return (
    <Avatar
      size={size}
      fill={{
        background: color ?? monogramTint(name),
        foreground: color ? 'var(--color-on-brand)' : 'var(--color-avatar-text)',
      }}
    >
      {initialsOf(name)}
    </Avatar>
  );
}
