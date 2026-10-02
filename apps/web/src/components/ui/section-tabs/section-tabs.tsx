import './section-tabs.scss';

import Link from 'next/link';

export type SectionTab = {
  count?: number;
  current: boolean;
  href: string;
  label: string;
};

export function SectionTabs({ items, label }: { items: SectionTab[]; label: string }) {
  return (
    <nav className="section-tabs" aria-label={label}>
      {items.map(item => (
        <Link
          key={item.href}
          className="section-tabs__tab"
          href={item.href}
          aria-current={item.current ? 'page' : undefined}
        >
          {item.label}
          {item.count !== undefined && item.count > 0 && (
            <>
              {' '}
              <span className="section-tabs__count">{item.count}</span>
            </>
          )}
        </Link>
      ))}
    </nav>
  );
}
