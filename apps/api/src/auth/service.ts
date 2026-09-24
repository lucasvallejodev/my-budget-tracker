import { eq } from 'drizzle-orm';

import { HttpStatus } from '@/constants/http';
import { users } from '@/db/schema';
import { ensureUserBootstrap } from '@/modules/categories/seed';
import { conflict, Db, notFound, ServiceError } from '@/modules/db';
import type { User } from '@coinkeeper/shared/schema/auth';

import { hashPassword, spendVerificationTime, verifyPassword } from './passwords';

const UNIQUE_VIOLATION = '23505';

type UserRecord = typeof users.$inferSelect;

const normaliseEmail = (email: string): string => email.trim().toLowerCase();

const isUniqueViolation = (error: unknown): boolean =>
  !!error &&
  typeof error === 'object' &&
  (('code' in error && error.code === UNIQUE_VIOLATION) ||
    ('cause' in error && isUniqueViolation(error.cause)));

const emailTaken = (): never =>
  conflict('An account with that email already exists', 'EMAIL_TAKEN');

const invalidCredentials = (): never => {
  throw new ServiceError(
    'The email or password is incorrect',
    HttpStatus.unauthorized,
    'INVALID_CREDENTIALS'
  );
};

export const toUser = (row: Pick<UserRecord, 'createdAt' | 'email' | 'id' | 'name'>): User => ({
  createdAt: row.createdAt.toISOString(),
  email: row.email,
  id: row.id,
  name: row.name,
});

const findByEmail = async (db: Db, email: string) => {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.email, normaliseEmail(email)))
    .limit(1);

  return row;
};

const findById = async (db: Db, id: string) => {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return row ?? notFound('User');
};

const signUp = async (
  db: Db,
  data: { email: string; name?: string; password: string }
): Promise<User> => {
  const passwordHash = await hashPassword(data.password);

  try {
    return await db.transaction(async tx => {
      const [user] = await tx
        .insert(users)
        .values({
          email: normaliseEmail(data.email),
          name: data.name?.trim() || null,
          passwordHash,
        })
        .returning();

      await ensureUserBootstrap(tx, user.id);

      return toUser(user);
    });
  } catch (error) {
    if (isUniqueViolation(error)) return emailTaken();
    throw error;
  }
};

export const createAuthService = (db: Db) => {
  return {
    async changePassword(userId: string, currentPassword: string, newPassword: string) {
      const user = await findById(db, userId);

      if (!(await verifyPassword(user.passwordHash, currentPassword))) {
        throw new ServiceError(
          'The current password is incorrect',
          HttpStatus.forbidden,
          'FORBIDDEN'
        );
      }

      await db
        .update(users)
        .set({ passwordHash: await hashPassword(newPassword) })
        .where(eq(users.id, userId));
    },
    async get(userId: string): Promise<User> {
      return toUser(await findById(db, userId));
    },
    async resetPassword(email: string, newPassword: string): Promise<User> {
      const user = (await findByEmail(db, email)) ?? notFound('User');

      await db
        .update(users)
        .set({ passwordHash: await hashPassword(newPassword) })
        .where(eq(users.id, user.id));

      return toUser(user);
    },
    async signIn(email: string, password: string): Promise<User> {
      const user = await findByEmail(db, email);

      if (!user) {
        await spendVerificationTime(password);

        return invalidCredentials();
      }

      if (!(await verifyPassword(user.passwordHash, password))) return invalidCredentials();

      await db.update(users).set({ lastSignInAt: new Date() }).where(eq(users.id, user.id));

      return toUser(user);
    },
    signUp: (data: { email: string; name?: string; password: string }) => signUp(db, data),
    async updateProfile(userId: string, data: { email?: string; name?: string | null }) {
      const patch: Partial<typeof users.$inferInsert> = {};

      if (data.email !== undefined) patch.email = normaliseEmail(data.email);
      if (data.name !== undefined) patch.name = data.name?.trim() || null;

      try {
        const [updated] = await db.update(users).set(patch).where(eq(users.id, userId)).returning();

        return toUser(updated ?? notFound('User'));
      } catch (error) {
        if (isUniqueViolation(error)) return emailTaken();
        throw error;
      }
    },
  };
};

export type AuthService = ReturnType<typeof createAuthService>;
