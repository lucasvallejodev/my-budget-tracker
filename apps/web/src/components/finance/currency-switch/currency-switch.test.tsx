import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConvertedView, CurrencySwitch, useCurrencyView } from './currency-switch';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('CurrencySwitch', () => {
  it('offers each currency and the approximate converted view', () => {
    const onChange = vi.fn();

    render(
      <CurrencySwitch
        converted
        currencies={['EUR', 'USD']}
        primary="EUR"
        value="EUR"
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole('radio', { name: '≈ All in EUR' }));

    expect(onChange).toHaveBeenCalledWith(ConvertedView);
  });

  it('hides itself when there is nothing to switch', () => {
    const { container } = render(
      <CurrencySwitch currencies={['EUR']} primary="EUR" value="EUR" onChange={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('useCurrencyView', () => {
  it('starts on the primary currency and remembers the last choice in this browser', () => {
    const { result } = renderHook(() => useCurrencyView(['EUR', 'USD'], 'EUR', true));

    expect(result.current[0]).toBe('EUR');

    act(() => result.current[1]('USD'));

    expect(result.current[0]).toBe('USD');
    expect(renderHook(() => useCurrencyView(['EUR', 'USD'], 'EUR')).result.current[0]).toBe('USD');
  });

  it('falls back when the remembered view is not available', () => {
    localStorage.setItem('coinkeeper-remembered-currency-view', ConvertedView);

    expect(renderHook(() => useCurrencyView(['USD'], 'EUR')).result.current[0]).toBe('USD');
  });
});
