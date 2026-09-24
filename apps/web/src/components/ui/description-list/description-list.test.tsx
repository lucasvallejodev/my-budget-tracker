import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DescriptionList } from './description-list';

afterEach(cleanup);

describe('DescriptionList', () => {
  it('pairs each term with its detail', () => {
    render(<DescriptionList items={[{ detail: 'Checking', term: 'Account' }]} />);

    expect(screen.getByText('Account').tagName).toBe('DT');
    expect(screen.getByText('Checking').tagName).toBe('DD');
  });
});
