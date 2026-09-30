import './avatar.scss';

import { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/styles';

export type AvatarShape = 'circle' | 'square';

export type AvatarSize = 'default' | 'small';

export type AvatarFill = {
  background: string;
  foreground: string;
};

const ShapeClassNames: Record<AvatarShape, string> = {
  circle: '',
  square: 'avatar--square',
};

const SizeClassNames: Record<AvatarSize, string> = {
  default: '',
  small: 'avatar--small',
};

const avatarStyle = (color?: string | null, fill?: AvatarFill): CSSProperties | undefined => {
  if (fill) {
    return {
      '--avatar-background': fill.background,
      '--avatar-foreground': fill.foreground,
    } as CSSProperties;
  }

  return color ? ({ '--avatar-color': color } as CSSProperties) : undefined;
};

export function Avatar({
  children,
  color,
  fill,
  label,
  shape = 'circle',
  size = 'default',
}: {
  children: ReactNode;
  color?: string | null;
  fill?: AvatarFill;
  label?: string;
  shape?: AvatarShape;
  size?: AvatarSize;
}) {
  return (
    <span
      className={cn('avatar', ShapeClassNames[shape], SizeClassNames[size], {
        'avatar--filled': !!fill,
      })}
      style={avatarStyle(color, fill)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {children}
    </span>
  );
}
