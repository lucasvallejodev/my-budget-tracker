import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface IconProps {
  icon?: string;
  color?: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
  fallbackIcon?: string;
}

export const Icon: React.FC<IconProps> = ({
  icon,
  color = 'black',
  size = 20,
  className = '',
  strokeWidth = 2,
}) => {
  const IconComponent: LucideIcon = LucideIcons[icon as keyof typeof LucideIcons] as LucideIcon;

  if (!icon || !IconComponent) {
    return (
      <LucideIcons.HelpCircle
        size={size}
        color={color}
        className={className}
        strokeWidth={strokeWidth}
      />
    );
  }

  return (
    <IconComponent size={size} color={color} className={className} strokeWidth={strokeWidth} />
  );
};
