import type { FastifyReply, FastifyRequest } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

import { HttpStatus } from '@/constants/http';
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

const startSession = async (request: FastifyRequest, reply: FastifyReply, userId: string) => {
  const session = await request.server.services.sessions.create(userId, {
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'] ?? null,
  });

  setSessionCookie(reply, request.server.config, session.token, session.expiresAt);
};

export const publicAuthRoutes: FastifyPluginAsyncZod = async app => {
  const rateLimit = { max: app.config.authAttemptsPerMinute, timeWindow: ONE_MINUTE };

  app.post(
    '/auth/sign-up',
    {
      config: { rateLimit },
      schema: {
        body: signUpSchema,
        response: withErrors({ [HttpStatus.created]: userSchema }),
        tags: ['auth'],
      },
    },
    async (request, reply) => {
      const user = await app.services.auth.signUp(request.body);

      await startSession(request, reply, user.id);

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
        tags: ['auth'],
      },
    },
    async (request, reply) => {
      const user = await app.services.auth.signIn(request.body.email, request.body.password);

      await startSession(request, reply, user.id);

      return user;
    }
  );

  app.post(
    '/auth/sign-out',
    { schema: { response: withErrors({ [HttpStatus.noContent]: noContent }), tags: ['auth'] } },
    async (request, reply) => {
      const token = sessionTokenOf(request, app.config);

      if (token) await app.services.sessions.revokeToken(token);
      clearSessionCookie(reply, app.config);

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
      const { sessionId, user } = requireAuth(request);

      await app.services.auth.changePassword(
        user.id,
        request.body.currentPassword,
        request.body.newPassword
      );
      await app.services.sessions.revokeOthers(user.id, sessionId);

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
      await app.services.sessions.revoke(userIdOf(request), request.params.id);

      return reply.status(HttpStatus.noContent).send();
    }
  );
};
