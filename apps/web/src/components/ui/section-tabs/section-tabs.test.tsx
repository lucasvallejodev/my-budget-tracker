import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SectionTabs } from './section-tabs';

afterEach(cleanup);

describe('SectionTabs', () => {
  it('links every section, marks the current one and shows non-zero counts', () => {
    render(
      <SectionTabs
        label="Upcoming sections"
        items={[
          {
            current: true,
            href: '/upcoming',
            label: 'What is due',
          },
          {
            count: 3,
            current: false,
            href: '/upcoming/suggestions',
            label: 'Found in your history',
          },
          {
            count: 0,
            current: false,
            href: '/upcoming/recurring',
            label: 'Recurring payments',
          },
        ]}
      />
    );

    const nav = screen.getByRole('navigation', { name: 'Upcoming sections' });

    expect(screen.getByRole('link', { name: 'What is due' }).getAttribute('aria-current')).toBe(
      'page'
    );
    expect(screen.getByRole('link', { name: 'Found in your history 3' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Recurring payments' })).toBeTruthy();
    expect(nav.querySelectorAll('a')).toHaveLength(3);
  });
});
