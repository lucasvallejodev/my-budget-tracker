import type { ErrorResponse, ListResponse, PageResponse } from '@coinkeeper/shared/schema/common';

export const API_BASE_PATH = '/api/v1';
export const SIGN_IN_PATH = '/sign-in';

const UNAUTHORIZED = 401;
const NO_CONTENT = 204;
const GENERIC_MESSAGE = 'Something went wrong. Please try again.';
const AuthPathPrefix = '/auth/';

type Method = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

type QueryValue = boolean | number | string | null | undefined;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly fields?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const queryString = (params: Record<string, QueryValue> = {}): string => {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, boolean | number | string] =>
      entry[1] !== undefined && entry[1] !== null && entry[1] !== ''
  );

  return entries.length
    ? `?${new URLSearchParams(entries.map(([key, value]) => [key, String(value)])).toString()}`
    : '';
};

const readError = async (response: Response): Promise<ApiError> => {
  try {
    const { error } = (await response.json()) as ErrorResponse;

    return new ApiError(error.message, response.status, error.code, error.fields);
  } catch {
    return new ApiError(GENERIC_MESSAGE, response.status);
  }
};

const leaveOnExpiredSession = (path: string, status: number): void => {
  if (status !== UNAUTHORIZED || path.startsWith(AuthPathPrefix)) return;
  if (typeof window === 'undefined' || window.location.pathname === SIGN_IN_PATH) return;

  const next = encodeURIComponent(window.location.pathname + window.location.search);

  window.location.assign(new URL(`${SIGN_IN_PATH}?next=${next}`, window.location.origin));
};

export const apiRequest = async <Result>(
  method: Method,
  path: string,
  body?: unknown
): Promise<Result> => {
  const response = await fetch(`${API_BASE_PATH}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    method,
  });

  if (!response.ok) {
    leaveOnExpiredSession(path, response.status);
    throw await readError(response);
  }

  if (response.status === NO_CONTENT) return undefined as Result;

  return (await response.json()) as Result;
};

export const apiGet = <Result>(path: string, params?: Record<string, QueryValue>) =>
  apiRequest<Result>('GET', `${path}${queryString(params)}`);

export const apiList = async <Item>(
  path: string,
  params?: Record<string, QueryValue>
): Promise<Item[]> => (await apiGet<ListResponse<Item>>(path, params)).items;

export const apiPages = async <Item>(
  path: string,
  params: Record<string, QueryValue> = {}
): Promise<Item[]> => {
  const items: Item[] = [];
  let cursor: string | null | undefined;

  do {
    const page = await apiGet<PageResponse<Item>>(path, { ...params, cursor });

    items.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);

  return items;
};
