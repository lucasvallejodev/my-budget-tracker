// @vitest-environment node
import Fastify, { type FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { REQUEST_ID_HEADER } from '@/constants/http';

import { audit, AUDIT_MESSAGE, AuditEvents } from './audit';
import { registerRequestUser } from './request-id';

const SignedInUserId = '6f1c2a54-9f59-4a0e-8b1e-0d6c3c1f7a10';
const OtherUserId = 'a7d5b0c2-3e41-4f6a-9d7b-2c8e1f0a5b34';
const SessionId = 'c3e8f1a2-7b64-4d59-8e0f-1a2b3c4d5e6f';
const RequestId = '0b9d7a52-2f5e-4c43-9a36-3f1c0b6f4a11';
const WARN_LEVEL = 40;
const INFO_LEVEL = 30;

type LogEntry = Record<string, unknown>;

const lines: string[] = [];
let app: FastifyInstance;

const auditLines = (): string[] => lines.filter(line => line.includes(AUDIT_MESSAGE));
const auditEntries = (): LogEntry[] => auditLines().map(line => JSON.parse(line) as LogEntry);

beforeAll(async () => {
  app = Fastify({
    genReqId: request => String(request.headers[REQUEST_ID_HEADER]),
    logger: { stream: { write: (line: string) => lines.push(line) } },
  });
  app.decorateRequest('auth', null);
  app.addHook('onRequest', async request => {
    if (request.url !== '/revoke') return;

    request.auth = {
      sessionId: SessionId,
      user: { id: SignedInUserId } as NonNullable<typeof request.auth>['user'],
    };
  });
  await registerRequestUser(app);
  app.post('/sign-in-failed', async request => {
    audit(request, AuditEvents.signInFailed, { reason: 'INVALID_CREDENTIALS' });

    return {};
  });
  app.post('/revoke', async request => {
    audit(request, AuditEvents.sessionRevoked, { sessionId: SessionId, userId: SignedInUserId });
    audit(request, AuditEvents.signedIn, { userId: OtherUserId });

    return {};
  });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('audit', () => {
  it('logs a failed sign-in as a warning tagged with the request id', async () => {
    await app.inject({
      headers: { [REQUEST_ID_HEADER]: RequestId },
      method: 'POST',
      url: '/sign-in-failed',
    });

    expect(auditEntries().at(-1)).toMatchObject({
      audit: 'sign_in_failed',
      level: WARN_LEVEL,
      reason: 'INVALID_CREDENTIALS',
      reqId: RequestId,
    });
  });

  it('logs other events at info with the user id written once', async () => {
    await app.inject({
      headers: { [REQUEST_ID_HEADER]: RequestId },
      method: 'POST',
      url: '/revoke',
    });

    const [revoked, signedIn] = auditEntries().slice(-2);
    const [revokedLine] = auditLines().slice(-2);

    expect(revoked).toMatchObject({
      audit: 'session_revoked',
      level: INFO_LEVEL,
      sessionId: SessionId,
      userId: SignedInUserId,
    });
    expect(revokedLine?.split(SignedInUserId)).toHaveLength(2);
    expect(signedIn).toMatchObject({ audit: 'signed_in', userId: OtherUserId });
  });
});
