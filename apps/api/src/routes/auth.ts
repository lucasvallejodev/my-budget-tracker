import type { FastifyReply, FastifyRequest } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { createSignInThrottle } from '@/auth/sign-in-throttle';
import { HttpStatus } from '@/constants/http';
import { ServiceError } from '@/modules/db';
import { audit, AuditEvents } from '@/plugins/audit';
import { clearSessionCookie, sessionTokenOf, setSessionCookie } from '@/plugins/authentication';
import { requireAuth, userIdOf } from '@/plugins/context';
import {
  changePasswordSchema,
  sessionSchema,
  signInSchema,
  signUpSchema,
  updateProfileSchema,
  userSchema,
} from '@coinkeeper/shared/schema/auth';
import { idParamsSchema, listOf } from '@coinkeeper/shared/schema/common';

import { noContent, withErrors } from './responses';

const ONE_MINUTE = '1 minute';

const metadataOf = (request: FastifyRequest) => ({
  ipAddress: request.ip,
  userAgent: request.headers['user-agent'] ?? null,
});

const startSession = async (request: FastifyRequest, reply: FastifyReply, userId: string) => {
  const { config, services } = request.server;
  const previousToken = sessionTokenOf(request, config);

  if (previousToken) await services.sessions.revokeToken(previousToken);

  const session = await services.sessions.create(userId, metadataOf(request));

  setSessionCookie(reply, config, session.token, session.expiresAt);
};

const auditSignInFailure =
  (request: FastifyRequest) =>
  (error: unknown): never => {
    if (error instanceof ServiceError) {
      audit(request, AuditEvents.signInFailed, { reason: error.code });
    }

    throw error;
  };

export const publicAuthRoutes: FastifyPluginAsyncZod = async app => {
  const rateLimit = { max: app.config.authAttemptsPerMinute, timeWindow: ONE_MINUTE };

  const signInThrottle = createSignInThrottle({
    freeFailures: app.config.signInFailuresPerAccount,
  });

  app.post(
    '/auth/sign-up',
    {
      config: { rateLimit },
      schema: {
        body: signUpSchema,
        response: withErrors({ [HttpStatus.created]: userSchema }),
        security: [],
        tags: ['auth'],
      },
    },
    async (request, reply) => {
      const user = await app.services.auth.signUp(request.body);

      await startSession(request, reply, user.id);
      audit(request, AuditEvents.signedUp, { userId: user.id });

      return reply.status(HttpStatus.created).send(user);
    }
  );

  app.post(
    '/auth/sign-in',
    {
      config: { rateLimit },
      schema: {
        body: signInSchema,
        response: withErrors({ [HttpStatus.ok]: userSchema }),
        security: [],
        tags: ['auth'],
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const user = await signInThrottle
        .attempt(email, () => app.services.auth.signIn(email, password))
        .catch(auditSignInFailure(request));

      await startSession(request, reply, user.id);
      audit(request, AuditEvents.signedIn, { userId: user.id });

      return user;
    }
  );

  app.post(
    '/auth/sign-out',
    {
      schema: {
        response: withErrors({ [HttpStatus.noContent]: noContent }),
        security: [],
        tags: ['auth'],
      },
    },
    async (request, reply) => {
      const token = sessionTokenOf(request, app.config);

      if (token) await app.services.sessions.revokeToken(token);
      clearSessionCookie(reply, app.config);
      audit(request, AuditEvents.signedOut, { userId: request.auth?.user.id });

      return reply.status(HttpStatus.noContent).send();
    }
  );
};

export const meRoutes: FastifyPluginAsyncZod = async app => {
  app.get(
    '/me',
    { schema: { response: withErrors({ [HttpStatus.ok]: userSchema }), tags: ['me'] } },
    async request => app.services.auth.get(userIdOf(request))
  );

  app.patch(
    '/me',
    {
      schema: {
        body: updateProfileSchema,
        response: withErrors({ [HttpStatus.ok]: userSchema }),
        tags: ['me'],
      },
    },
    async request => app.services.auth.updateProfile(userIdOf(request), request.body)
  );

  app.put(
    '/me/password',
    {
      config: { rateLimit: { max: app.config.authAttemptsPerMinute, timeWindow: ONE_MINUTE } },
      schema: {
        body: changePasswordSchema,
        response: withErrors({ [HttpStatus.noContent]: noContent }),
        tags: ['me'],
      },
    },
    async (request, reply) => {
      const { user } = requireAuth(request);

      await app.services.auth.changePassword(
        user.id,
        request.body.currentPassword,
        request.body.newPassword
      );

      const session = await app.services.sessions.rotate(user.id, metadataOf(request));

      setSessionCookie(reply, app.config, session.token, session.expiresAt);
      audit(request, AuditEvents.passwordChanged, { userId: user.id });

      return reply.status(HttpStatus.noContent).send();
    }
  );

  app.get(
    '/me/sessions',
    {
      schema: { response: withErrors({ [HttpStatus.ok]: listOf(sessionSchema) }), tags: ['me'] },
    },
    async request => {
      const { sessionId, user } = requireAuth(request);

      return { items: await app.services.sessions.list(user.id, sessionId) };
    }
  );

  app.delete(
    '/me/sessions/:id',
    {
      schema: {
        params: idParamsSchema,
        response: withErrors({ [HttpStatus.noContent]: noContent }),
        tags: ['me'],
      },
    },
    async (request, reply) => {
      const userId = userIdOf(request);

      await app.services.sessions.revoke(userId, request.params.id);
      audit(request, AuditEvents.sessionRevoked, { sessionId: request.params.id, userId });

      return reply.status(HttpStatus.noContent).send();
    }
  );
};
