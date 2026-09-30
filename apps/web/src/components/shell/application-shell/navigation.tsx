'use client';

import './navigation.scss';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NavigationSections, SetupRouteItems } from '@/app/(main)/routes';
import { useNeedsReviewCount } from '@/components/finance';
import { isCurrentPath } from '@/lib/navigation';
import { RouteItem } from '@/types/route-item';

type NavigationLinkProps = {
  count?: number;
  item: RouteItem;
  onNavigate?: () => void;
  path: string;
};

function NavigationLink({ count, item, onNavigate, path }: NavigationLinkProps) {
  return (
    <Link
      className="navigation__link"
      href={item.path}
      aria-current={isCurrentPath(path, item.path) ? 'page' : undefined}
      onClick={onNavigate}
    >
      <item.icon aria-hidden />
      {item.name}
      {!!count && (
        <span className="navigation__badge">
          <span aria-hidden="true">{count}</span>
          <span className="navigation__badge-label">{`, ${count} to review`}</span>
        </span>
      )}
    </Link>
  );
}

export function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const { data: reviewCount } = useNeedsReviewCount();

  return (
    <nav aria-label="Main navigation" className="navigation">
      {NavigationSections.map(section => (
        <div key={section.label ?? 'start'} className="navigation__section">
          {section.label && <p className="navigation__label">{section.label}</p>}
          {section.items.map(item => (
            <NavigationLink
              key={item.path}
              count={item.countsReview ? reviewCount : undefined}
              item={item}
              onNavigate={onNavigate}
              path={path}
            />
          ))}
        </div>
      ))}
      <div className="navigation__section navigation__section--setup">
        {SetupRouteItems.map(item => (
          <NavigationLink key={item.path} item={item} onNavigate={onNavigate} path={path} />
        ))}
      </div>
    </nav>
  );
}
