import type { FastifyRequest } from 'fastify';

export const AuditEvents = {
  passwordChanged: 'password_changed',
  sessionRevoked: 'session_revoked',
  signedIn: 'signed_in',
  signedOut: 'signed_out',
  signedUp: 'signed_up',
  signInFailed: 'sign_in_failed',
} as const;

type AuditEvent = (typeof AuditEvents)[keyof typeof AuditEvents];

type AuditDetails = {
  reason?: string;
  sessionId?: string;
  userId?: string;
};

export const AUDIT_MESSAGE = 'Security event';

const WarningEvents: ReadonlySet<AuditEvent> = new Set([AuditEvents.signInFailed]);

const unboundDetails = (request: FastifyRequest, details: AuditDetails): AuditDetails =>
  details.userId === request.auth?.user.id ? { ...details, userId: undefined } : details;

export const audit = (
  request: FastifyRequest,
  event: AuditEvent,
  details: AuditDetails = {}
): void => {
  const entry = { audit: event, ...unboundDetails(request, details) };

  if (WarningEvents.has(event)) request.log.warn(entry, AUDIT_MESSAGE);
  else request.log.info(entry, AUDIT_MESSAGE);
};
