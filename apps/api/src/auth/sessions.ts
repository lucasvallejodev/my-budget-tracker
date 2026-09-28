import { and, desc, eq, gt, lt, or } from 'drizzle-orm';
import { createHash, randomBytes } from 'node:crypto';

import { sessions, users } from '@/db/schema';
import { Db, DbOrTx, notFound } from '@/modules/db';
import { MILLISECONDS_PER_DAY } from '@coinkeeper/shared/constants/time';
import type { Session } from '@coinkeeper/shared/schema/auth';

const TOKEN_BYTES = 32;
const TOUCH_INTERVAL_MS = 60_000;
const RENEW_WHEN_REMAINING_FRACTION = 0.5;

export type SessionLifetime = {
  maxAgeDays: number;
  sessionDays: number;
};

type LifetimeMs = {
  maxAge: number;
  sliding: number;
};

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

const oldestLiveCreation = (maxAgeMs: number): Date => new Date(Date.now() - maxAgeMs);

const listSessions = async (
  db: Db,
  maxAgeMs: number,
  userId: string,
  currentId: string
): Promise<Session[]> => {
  const rows = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        gt(sessions.expiresAt, new Date()),
        gt(sessions.createdAt, oldestLiveCreation(maxAgeMs))
      )
    )
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

const insertSession = async (
  db: DbOrTx,
  lifetime: LifetimeMs,
  userId: string,
  metadata: SessionMetadata
) => {
  const token = randomBytes(TOKEN_BYTES).toString('base64url');
  const expiresAt = new Date(Date.now() + Math.min(lifetime.sliding, lifetime.maxAge));

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
};

const resolveSession = async (
  db: Db,
  lifetime: LifetimeMs,
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
      sessionCreatedAt: sessions.createdAt,
      userId: users.id,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.tokenHash, hashToken(token)))
    .limit(1);

  if (!row) return null;

  const now = Date.now();
  const endOfLife = row.sessionCreatedAt.getTime() + lifetime.maxAge;

  if (row.expiresAt.getTime() <= now || endOfLife <= now) {
    await db.delete(sessions).where(eq(sessions.id, row.id));

    return null;
  }

  const renewed =
    row.expiresAt.getTime() < endOfLife &&
    row.expiresAt.getTime() - now < lifetime.sliding * RENEW_WHEN_REMAINING_FRACTION;

  const expiresAt = renewed ? new Date(Math.min(now + lifetime.sliding, endOfLife)) : row.expiresAt;

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

export const createSessionStore = (db: Db, { maxAgeDays, sessionDays }: SessionLifetime) => {
  const lifetime: LifetimeMs = {
    maxAge: maxAgeDays * MILLISECONDS_PER_DAY,
    sliding: sessionDays * MILLISECONDS_PER_DAY,
  };

  return {
    create: (userId: string, metadata: SessionMetadata = {}) =>
      insertSession(db, lifetime, userId, metadata),
    list: (userId: string, currentId: string) =>
      listSessions(db, lifetime.maxAge, userId, currentId),
    async purgeExpired() {
      await db
        .delete(sessions)
        .where(
          or(
            lt(sessions.expiresAt, new Date()),
            lt(sessions.createdAt, oldestLiveCreation(lifetime.maxAge))
          )
        );
    },
    resolve: (token: string) => resolveSession(db, lifetime, token),
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
    async revokeToken(token: string) {
      await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
    },
    rotate: (userId: string, metadata: SessionMetadata = {}) =>
      db.transaction(async tx => {
        await tx.delete(sessions).where(eq(sessions.userId, userId));

        return insertSession(tx, lifetime, userId, metadata);
      }),
  };
};

export type SessionStore = ReturnType<typeof createSessionStore>;
