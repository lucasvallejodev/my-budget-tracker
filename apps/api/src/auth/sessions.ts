import { and, desc, eq, gt, lt, ne } from 'drizzle-orm';
import { createHash, randomBytes } from 'node:crypto';

import { sessions, users } from '@/db/schema';
import { Db, notFound } from '@/modules/db';
import { MILLISECONDS_PER_DAY } from '@coinkeeper/shared/constants/time';
import type { Session } from '@coinkeeper/shared/schema/auth';

const TOKEN_BYTES = 32;
const TOUCH_INTERVAL_MS = 60_000;
const RENEW_WHEN_REMAINING_FRACTION = 0.5;

export type SessionMetadata = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AuthenticatedUser = {
  createdAt: Date;
  email: string;
  id: string;
  name: string | null;
};

export type ActiveSession = {
  expiresAt: Date;
  id: string;
  renewed: boolean;
  user: AuthenticatedUser;
};

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

const listSessions = async (db: Db, userId: string, currentId: string): Promise<Session[]> => {
  const rows = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date())))
    .orderBy(desc(sessions.lastUsedAt));

  return rows.map(row => ({
    createdAt: row.createdAt.toISOString(),
    current: row.id === currentId,
    expiresAt: row.expiresAt.toISOString(),
    id: row.id,
    ipAddress: row.ipAddress,
    lastUsedAt: row.lastUsedAt.toISOString(),
    userAgent: row.userAgent,
  }));
};

const resolveSession = async (
  db: Db,
  lifetimeMs: number,
  token: string
): Promise<ActiveSession | null> => {
  const [row] = await db
    .select({
      createdAt: users.createdAt,
      email: users.email,
      expiresAt: sessions.expiresAt,
      id: sessions.id,
      lastUsedAt: sessions.lastUsedAt,
      name: users.name,
      userId: users.id,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.tokenHash, hashToken(token)))
    .limit(1);

  const now = Date.now();

  if (!row || row.expiresAt.getTime() <= now) return null;

  const renewed = row.expiresAt.getTime() - now < lifetimeMs * RENEW_WHEN_REMAINING_FRACTION;
  const expiresAt = renewed ? new Date(now + lifetimeMs) : row.expiresAt;

  if (renewed || now - row.lastUsedAt.getTime() > TOUCH_INTERVAL_MS) {
    await db
      .update(sessions)
      .set({ expiresAt, lastUsedAt: new Date(now) })
      .where(eq(sessions.id, row.id));
  }

  return {
    expiresAt,
    id: row.id,
    renewed,
    user: {
      createdAt: row.createdAt,
      email: row.email,
      id: row.userId,
      name: row.name,
    },
  };
};

export const createSessionStore = (db: Db, sessionDays: number) => {
  const lifetimeMs = sessionDays * MILLISECONDS_PER_DAY;

  return {
    async create(userId: string, metadata: SessionMetadata = {}) {
      const token = randomBytes(TOKEN_BYTES).toString('base64url');
      const expiresAt = new Date(Date.now() + lifetimeMs);

      const [session] = await db
        .insert(sessions)
        .values({
          expiresAt,
          ipAddress: metadata.ipAddress ?? null,
          tokenHash: hashToken(token),
          userAgent: metadata.userAgent ?? null,
          userId,
        })
        .returning({ id: sessions.id });

      return {
        expiresAt,
        id: session.id,
        token,
      };
    },
    list: (userId: string, currentId: string) => listSessions(db, userId, currentId),
    async purgeExpired() {
      await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
    },
    resolve: (token: string) => resolveSession(db, lifetimeMs, token),
    async revoke(userId: string, id: string) {
      const deleted = await db
        .delete(sessions)
        .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
        .returning({ id: sessions.id });

      if (!deleted.length) notFound('Session');
    },
    async revokeAll(userId: string) {
      await db.delete(sessions).where(eq(sessions.userId, userId));
    },
    async revokeOthers(userId: string, keepId: string) {
      await db.delete(sessions).where(and(eq(sessions.userId, userId), ne(sessions.id, keepId)));
    },
    async revokeToken(token: string) {
      await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
    },
  };
};

export type SessionStore = ReturnType<typeof createSessionStore>;
