import { localIsoDate } from '@coinkeeper/shared/lib/date-helpers';

import { demoCredentials } from '../demo/credentials';
import { seedDemoAccount } from '../demo/seed';
import { openRuntime } from '../environment';
import { createServices } from '../modules/services';

const ProductionEnvironment = 'production';

const main = async () => {
  if (process.env.NODE_ENV === ProductionEnvironment) {
    throw new Error(
      'The demo account is for local development and tests; it is never seeded in production.'
    );
  }

  const { close, db } = openRuntime();

  try {
    const result = await seedDemoAccount(
      createServices(db),
      localIsoDate(new Date()),
      demoCredentials(process.env)
    );

    console.log(
      `Demo account ready: ${result.email} (password from DEMO_USER_PASSWORD) with ${result.accounts} accounts, ` +
        `${result.transactions} entries, ${result.budgets} budgets, ${result.series} recurring payments ` +
        `and ${result.templates} templates up to today.`
    );
  } finally {
    await close();
  }
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
