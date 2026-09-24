import { Icons } from '@/constants/icons';
import { isIconName } from '@coinkeeper/shared/constants/icon-names';

type IconProps = {
  className?: string;
  color?: string;
  icon?: string | null;
  size?: number;
  strokeWidth?: number;
};

export const Icon: React.FC<IconProps> = ({
  className = '',
  color = 'currentColor',
  icon,
  size = 20,
  strokeWidth = 2,
}) => {
  const IconComponent = icon && isIconName(icon) ? Icons[icon] : Icons.CircleHelp;

  return (
    <IconComponent size={size} color={color} className={className} strokeWidth={strokeWidth} />
  );
};
