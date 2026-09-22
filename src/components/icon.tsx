import { ICONS, isIconName } from './icons/registry';

interface IconProps {
  icon?: string | null;
  color?: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export const Icon: React.FC<IconProps> = ({
  icon,
  color = 'currentColor',
  size = 20,
  className = '',
  strokeWidth = 2,
}) => {
  const IconComponent = icon && isIconName(icon) ? ICONS[icon] : ICONS.CircleHelp;
  return (
    <IconComponent size={size} color={color} className={className} strokeWidth={strokeWidth} />
  );
};
