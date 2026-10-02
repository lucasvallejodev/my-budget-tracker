import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SectionIntro } from './section-intro';

afterEach(cleanup);

describe('SectionIntro', () => {
  it('explains a section and lists what you can do', () => {
    render(
      <SectionIntro steps={['Record a payment you forgot.', 'Link one you already entered.']}>
        Bills and income expected soon.
      </SectionIntro>
    );

    expect(screen.getByText('Bills and income expected soon.')).toBeTruthy();
    expect(screen.getAllByRole('listitem').map(item => item.textContent)).toEqual([
      'Record a payment you forgot.',
      'Link one you already entered.',
    ]);
  });
});
