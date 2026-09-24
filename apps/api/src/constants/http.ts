export const HttpStatus = {
  badRequest: 400,
  conflict: 409,
  created: 201,
  forbidden: 403,
  internalError: 500,
  noContent: 204,
  notFound: 404,
  ok: 200,
  tooManyRequests: 429,
  unauthorized: 401,
  unprocessable: 422,
} as const;
