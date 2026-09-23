import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Spinner } from './spinner';

afterEach(cleanup);

describe('Spinner', () => {
  it('is announced with its label', () => {
    render(<Spinner label="Saving" />);

    expect(screen.getByRole('img', { name: 'Saving' })).toBeTruthy();
  });
});
