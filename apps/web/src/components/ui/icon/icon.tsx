import './icon.scss';

import { Icons } from '@/constants/icons';
import { isIconName } from '@coinkeeper/shared/constants/icon-names';
import { isEmoji } from '@coinkeeper/shared/lib/patterns';

type IconProps = {
  className?: string;
  color?: string;
  icon?: string | null;
  size?: number;
  strokeWidth?: number;
};

const DefaultSize = 20;
const DefaultStrokeWidth = 2;

export const Icon: React.FC<IconProps> = ({
  className = '',
  color = 'currentColor',
  icon,
  size = DefaultSize,
  strokeWidth = DefaultStrokeWidth,
}) => {
  if (icon && isEmoji(icon)) {
    return (
      <span className="icon" style={{ fontSize: size }} aria-hidden>
        {icon}
      </span>
    );
  }

  const IconComponent = icon && isIconName(icon) ? Icons[icon] : Icons.CircleHelp;

  return (
    <IconComponent size={size} color={color} className={className} strokeWidth={strokeWidth} />
  );
};
