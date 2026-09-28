export const REQUEST_ID_HEADER = 'x-request-id';

export const HttpStatus = {
  badRequest: 400,
  conflict: 409,
  created: 201,
  forbidden: 403,
  internalError: 500,
  noContent: 204,
  notFound: 404,
  ok: 200,
  serviceUnavailable: 503,
  tooManyRequests: 429,
  unauthorized: 401,
  unprocessable: 422,
  unsupportedMediaType: 415,
} as const;

export const ServerTimeoutsMs = {
  connectionGrace: 10_000,
  keepAlive: 72_000,
  request: 30_000,
} as const;
