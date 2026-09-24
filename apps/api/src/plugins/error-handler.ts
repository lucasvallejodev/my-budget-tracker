import type { FastifyError, FastifyInstance } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';

import { HttpStatus } from '@/constants/http';
import { ServiceError } from '@/modules/db';
import { isForeignKeyViolation, isUniqueViolation } from '@/modules/errors';
import type { ErrorCode, ErrorResponse } from '@coinkeeper/shared/schema/common';

type ErrorBody = ErrorResponse['error'];

const FIRST_SERVER_ERROR = 500;

const StatusCodes: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.forbidden]: 'FORBIDDEN',
  [HttpStatus.notFound]: 'NOT_FOUND',
  [HttpStatus.tooManyRequests]: 'RATE_LIMITED',
  [HttpStatus.unauthorized]: 'UNAUTHENTICATED',
};

const fieldName = (instancePath: string): string =>
  instancePath.split('/').filter(Boolean).join('.') || 'body';

const validationFields = (error: FastifyError): Record<string, string> =>
  Object.fromEntries(
    (error.validation ?? []).map(issue => [
      fieldName(issue.instancePath),
      issue.message ?? 'Invalid value',
    ])
  );

const describe = (error: FastifyError): { body: ErrorBody; status: number } => {
  if (hasZodFastifySchemaValidationErrors(error)) {
    const fields = validationFields(error);

    return {
      body: {
        code: 'INVALID_REQUEST',
        fields,
        message: Object.values(fields)[0] ?? 'The request is not valid',
      },
      status: HttpStatus.badRequest,
    };
  }

  if (error instanceof ServiceError) {
    return { body: { code: error.code, message: error.message }, status: error.status };
  }

  if (isUniqueViolation(error)) {
    return {
      body: { code: 'CONFLICT', message: 'That value is already in use' },
      status: HttpStatus.conflict,
    };
  }

  if (isForeignKeyViolation(error)) {
    return {
      body: { code: 'RULE_VIOLATION', message: 'A referenced record does not exist' },
      status: HttpStatus.unprocessable,
    };
  }

  const status = error.statusCode ?? HttpStatus.internalError;

  if (status < FIRST_SERVER_ERROR) {
    return {
      body: { code: StatusCodes[status] ?? 'INVALID_REQUEST', message: error.message },
      status,
    };
  }

  return {
    body: { code: 'INTERNAL', message: 'Unexpected error' },
    status: HttpStatus.internalError,
  };
};

export const registerErrorHandler = (app: FastifyInstance): void => {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    const { body, status } = describe(error);

    if (status >= FIRST_SERVER_ERROR) request.log.error(error);

    return reply.status(status).send({ error: body });
  });

  app.setNotFoundHandler((request, reply) =>
    reply.status(HttpStatus.notFound).send({
      error: { code: 'NOT_FOUND', message: `No route for ${request.method} ${request.url}` },
    })
  );
};
