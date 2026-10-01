// @vitest-environment node
import { eq, sql } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { categoryGroups } from '@/db/schema';
import { Db } from '@/modules/db';
import { createTestDatabase, insertUser, TestDatabase } from '@/test/database';
import { GroupPalette } from '@coinkeeper/shared/constants/palette';

const MigrationFile = path.join(
  import.meta.dirname,
  '..',
  '..',
  'drizzle',
  '0003_mute_group_palette.sql'
);

const StatementBreakpoint = '--> statement-breakpoint';
const CustomColor = '#123456';
const owner = 'user_owner';

const BrightPalette: Record<keyof typeof GroupPalette, string> = {
  amber: '#D97706',
  blue: '#2563EB',
  cyan: '#0891B2',
  emerald: '#059669',
  green: '#16A34A',
  orange: '#EA580C',
  pink: '#DB2777',
  purple: '#9333EA',
  red: '#DC2626',
  rose: '#E11D48',
  slate: '#475569',
  slateLight: '#64748B',
  stone: '#78716C',
  teal: '#0F766E',
  violet: '#7C3AED',
  yellow: '#CA8A04',
};

let database: TestDatabase;
let db: Db;

const runPaletteMigration = async () => {
  const statements = readFileSync(MigrationFile, 'utf8').split(StatementBreakpoint);

  await db.transaction(async transaction => {
    for (const statement of statements) await transaction.execute(sql.raw(statement));
  });
};

const insertGroup = async (name: string, color: string) => {
  const [group] = await db
    .insert(categoryGroups)
    .values({
      color,
      kind: 'expense',
      name,
      userId: owner,
    })
    .returning();

  return group;
};

const colorOf = async (id: string) => {
  const [group] = await db
    .select({ color: categoryGroups.color })
    .from(categoryGroups)
    .where(eq(categoryGroups.id, id));

  return group.color;
};

beforeAll(async () => {
  database = await createTestDatabase();
  db = database.db;
}, 30000);
afterAll(async () => {
  await database.close();
});
beforeEach(async () => {
  await database.reset();
  await insertUser(db, owner);
});

describe('0003_mute_group_palette', () => {
  it('moves every bright palette colour to its muted entry, in any letter case', async () => {
    const keys = Object.keys(BrightPalette) as (keyof typeof GroupPalette)[];

    const groups = await Promise.all(
      keys.map((key, index) =>
        insertGroup(key, index % 2 === 0 ? BrightPalette[key] : BrightPalette[key].toLowerCase())
      )
    );

    await runPaletteMigration();

    const colors = await Promise.all(groups.map(group => colorOf(group.id)));

    expect(colors).toEqual(keys.map(key => GroupPalette[key]));
  });

  it('keeps custom colours as the user chose them', async () => {
    const group = await insertGroup('Custom', CustomColor);

    await runPaletteMigration();

    expect(await colorOf(group.id)).toBe(CustomColor);
  });
});
