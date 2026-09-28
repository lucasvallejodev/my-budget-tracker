// @vitest-environment node
import { isDeepStrictEqual } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, TestContext } from '@/test/app';

type JsonValue = boolean | JsonValue[] | null | number | string | { [key: string]: JsonValue };

type JsonObject = Record<string, JsonValue>;

type OpenApiDocument = {
  paths: Record<string, Record<string, JsonObject>>;
};

const ERROR_STATUS = '4XX';
const ERROR_REFERENCE = 'ErrorResponse';
const JSON_MEDIA_TYPE = 'application/json';

const isObject = (value: JsonValue | undefined): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const schemaOf = (response: JsonValue | undefined): JsonValue | undefined => {
  if (!isObject(response) || !isObject(response.content)) return undefined;
  const media = response.content[JSON_MEDIA_TYPE];

  return isObject(media) ? media.schema : undefined;
};

const sharedErrorSchema = (document: OpenApiDocument): JsonValue => {
  const operation = Object.values(document.paths).flatMap(item => Object.values(item))[0];
  const responses = operation.responses as JsonObject;

  return schemaOf(responses[ERROR_STATUS])!;
};

const collapseErrors = (responses: JsonObject, errorSchema: JsonValue): JsonObject =>
  Object.fromEntries(
    Object.entries(responses).map(([status, response]) => [
      status,
      isDeepStrictEqual(schemaOf(response), errorSchema) ? ERROR_REFERENCE : response,
    ])
  );

const contractOf = (document: OpenApiDocument) => {
  const errorSchema = sharedErrorSchema(document);

  const paths = Object.fromEntries(
    Object.entries(document.paths).map(([path, item]) => [
      path,
      Object.fromEntries(
        Object.entries(item).map(([method, operation]) => [
          method,
          {
            ...operation,
            responses: collapseErrors(operation.responses as JsonObject, errorSchema),
          },
        ])
      ),
    ])
  );

  return { [ERROR_REFERENCE]: errorSchema, paths };
};

let context: TestContext;

beforeAll(async () => {
  context = await createTestApp();
}, 30000);

afterAll(async () => {
  await context.close();
});

describe('OpenAPI contract', () => {
  it('matches the reviewed snapshot of every path, parameter and schema', () => {
    const document = context.app.swagger() as unknown as OpenApiDocument;

    expect(contractOf(document)).toMatchSnapshot();
  });

  it('shares one error schema across every 4xx and 5xx response', () => {
    const document = context.app.swagger() as unknown as OpenApiDocument;
    const errorSchema = sharedErrorSchema(document);

    const mismatched = Object.entries(document.paths).flatMap(([path, item]) =>
      Object.entries(item).flatMap(([method, operation]) =>
        Object.entries(operation.responses as JsonObject)
          .filter(([status]) => !status.startsWith('2'))
          .filter(([, response]) => !isDeepStrictEqual(schemaOf(response), errorSchema))
          .map(([status]) => `${method} ${path} ${status}`)
      )
    );

    expect(mismatched).toEqual([]);
  });
});
