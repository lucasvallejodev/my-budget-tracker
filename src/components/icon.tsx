import { Icons, isIconName } from './icons/registry';

type IconProps = {
  icon?: string | null;
  color?: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
};

export const Icon: React.FC<IconProps> = ({
  icon,
  color = 'currentColor',
  size = 20,
  className = '',
  strokeWidth = 2,
}) => {
  const IconComponent = icon && isIconName(icon) ? Icons[icon] : Icons.CircleHelp;

  return (
    <IconComponent size={size} color={color} className={className} strokeWidth={strokeWidth} />
  );
};
