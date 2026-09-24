import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, apiList, apiPages, apiRequest, queryString } from './client';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('api client', () => {
  it('builds query strings from defined values only', () => {
    expect(
      queryString({
        deleted: true,
        empty: '',
        limit: 5,
        missing: undefined,
      })
    ).toBe('?deleted=true&limit=5');
    expect(queryString({})).toBe('');
  });

  it('sends JSON with the session cookie and unwraps lists', async () => {
    const fetchMock = vi.fn(async () => json({ items: [{ id: 'a' }] }));

    vi.stubGlobal('fetch', fetchMock);

    expect(await apiList('/accounts', { includeArchived: true })).toEqual([{ id: 'a' }]);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/accounts?includeArchived=true', {
      body: undefined,
      credentials: 'same-origin',
      headers: undefined,
      method: 'GET',
    });
  });

  it('returns nothing for 204 and throws the API error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 204 }))
        .mockResolvedValueOnce(json({ error: { code: 'CONFLICT', message: 'Name taken' } }, 409))
    );

    expect(await apiRequest('DELETE', '/rules/1')).toBeUndefined();

    const failure = apiRequest('POST', '/payees', { name: 'x' });

    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(failure).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Name taken',
      status: 409,
    });
  });

  it('follows cursors until the last page', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ items: [1, 2], nextCursor: 'next' }))
      .mockResolvedValueOnce(json({ items: [3], nextCursor: null }));

    vi.stubGlobal('fetch', fetchMock);

    expect(await apiPages('/transactions', { limit: 2 })).toEqual([1, 2, 3]);
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/transactions?limit=2&cursor=next');
  });

  it('sends the browser to sign-in when the session has ended', async () => {
    const assign = vi.fn();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ error: { code: 'UNAUTHENTICATED', message: 'Sign in' } }, 401))
    );
    vi.stubGlobal('location', {
      assign,
      origin: 'http://localhost:3000',
      pathname: '/budgets',
      search: '',
    });

    await expect(apiRequest('GET', '/budgets')).rejects.toBeInstanceOf(ApiError);
    expect(String(assign.mock.calls[0][0])).toBe('http://localhost:3000/sign-in?next=%2Fbudgets');
  });
});
