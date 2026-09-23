import { eq, sql } from 'drizzle-orm';
import { categories, categoryGroups, userSettings } from '@/db/schema';
import { Db } from '../db';
import { DefaultTaxonomy, DEFAULT_TAXONOMY_VERSION } from './default-taxonomy';

/**
 * Idempotently creates the user's settings row and seeds the default taxonomy once.
 * Safe to call on every request: it returns early once the user is seeded.
 */
export const ensureUserBootstrap = async (db: Db, userId: string, primaryCurrency = 'EUR') => {
  const [existing] = await db
    .select({ seededVersion: userSettings.seededVersion })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (existing?.seededVersion) return { seeded: false };

  return db.transaction(async tx => {
    // Serialise concurrent first requests from the same user.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId}))`);

    const [settings] = await tx
      .insert(userSettings)
      .values({ userId, primaryCurrency })
      .onConflictDoNothing()
      .returning();

    const [current] = settings
      ? [settings]
      : await tx.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

    if (current?.seededVersion) return { seeded: false };

    for (const [groupIndex, group] of DefaultTaxonomy.entries()) {
      const [created] = await tx
        .insert(categoryGroups)
        .values({
          userId,
          name: group.name,
          kind: group.kind,
          color: group.color,
          sortOrder: groupIndex,
          isSystem: !!group.isSystem,
        })
        .returning({ id: categoryGroups.id });

      await tx.insert(categories).values(
        group.categories.map((category, index) => ({
          userId,
          groupId: created.id,
          name: category.name,
          icon: category.icon,
          sortOrder: index,
        }))
      );
    }

    await tx
      .update(userSettings)
      .set({ seededVersion: DEFAULT_TAXONOMY_VERSION })
      .where(eq(userSettings.userId, userId));

    return { seeded: true };
  });
};
