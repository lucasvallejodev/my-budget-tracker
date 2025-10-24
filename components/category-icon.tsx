import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface CategoryIconProps {
  icon: string;
  color: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
  fallbackIcon?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  icon,
  color,
  size = 20,
  className = '',
  strokeWidth = 2,
}) => {
  const IconComponent: LucideIcon = LucideIcons[icon as keyof typeof LucideIcons] as LucideIcon;

  if (!IconComponent) {
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
