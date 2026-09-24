import { cleanup, render, screen } from '@testing-library/react';
import Link from 'next/link';
import { afterEach, describe, expect, it } from 'vitest';

import { Button } from './button';

afterEach(cleanup);

describe('Button', () => {
  it('renders a non-submitting button by default', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' }).getAttribute('type')).toBe('button');
  });

  it('renders its child element when asChild is set', () => {
    render(
      <Button asChild>
        <Link href="/accounts">Accounts</Link>
      </Button>
    );

    const link = screen.getByRole('link', { name: 'Accounts' });

    expect(link.getAttribute('href')).toBe('/accounts');
    expect(link.getAttribute('type')).toBeNull();
  });
});
