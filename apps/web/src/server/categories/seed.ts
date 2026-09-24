import { eq, sql } from 'drizzle-orm';

import { categories, categoryGroups, userSettings } from '@/db/schema';

import { Db } from '../db';
import { DEFAULT_TAXONOMY_VERSION, DefaultTaxonomy } from './default-taxonomy';

export const ensureUserBootstrap = async (db: Db, userId: string, primaryCurrency = 'EUR') => {
  const [existing] = await db
    .select({ seededVersion: userSettings.seededVersion })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (existing?.seededVersion) return { seeded: false };

  return db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId}))`);

    const [settings] = await tx
      .insert(userSettings)
      .values({ primaryCurrency, userId })
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
          color: group.color,
          isSystem: !!group.isSystem,
          kind: group.kind,
          name: group.name,
          sortOrder: groupIndex,
          userId,
        })
        .returning({ id: categoryGroups.id });

      await tx.insert(categories).values(
        group.categories.map((category, index) => ({
          groupId: created.id,
          icon: category.icon,
          name: category.name,
          sortOrder: index,
          userId,
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
