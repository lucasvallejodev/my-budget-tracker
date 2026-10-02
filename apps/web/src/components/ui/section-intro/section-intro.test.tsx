import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SectionIntro } from './section-intro';

afterEach(cleanup);

const renderIntro = () =>
  render(
    <SectionIntro
      topic="What is due"
      steps={['Record a payment you forgot.', 'Link one you already entered.']}
    >
      Bills and income expected soon.
    </SectionIntro>
  );

describe('SectionIntro', () => {
  it('starts collapsed behind a question naming the topic', () => {
    const { container } = renderIntro();

    expect(screen.getByText('How does this work?')).toBeTruthy();
    expect(screen.getByText('About What is due')).toBeTruthy();
    expect(container.querySelector('details')?.open).toBe(false);
  });

  it('opens to explain the section and list what you can do', () => {
    const { container } = renderIntro();

    fireEvent.click(screen.getByText('How does this work?'));

    expect(container.querySelector('details')?.open).toBe(true);
    expect(screen.getByText('Bills and income expected soon.')).toBeTruthy();
    expect(screen.getAllByRole('listitem').map(item => item.textContent)).toEqual([
      'Record a payment you forgot.',
      'Link one you already entered.',
    ]);
  });
});
