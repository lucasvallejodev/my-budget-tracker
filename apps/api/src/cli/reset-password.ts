import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';

import { FieldLengths } from '@coinkeeper/shared/constants/field-lengths';

import { openRuntime } from '../environment';
import { createServices } from '../modules/services';

const USAGE = 'Usage: npm run user:reset-password -- <email>';

const readPassword = async (): Promise<string> => {
  const fromEnvironment = process.env.NEW_PASSWORD;

  if (fromEnvironment) return fromEnvironment;

  const prompt = createInterface({
    input: stdin,
    output: stdout,
    terminal: true,
  });

  try {
    return await prompt.question(
      `New password (at least ${FieldLengths.passwordMin} characters): `
    );
  } finally {
    prompt.close();
  }
};

const main = async () => {
  const email = process.argv[2];

  if (!email) throw new Error(USAGE);

  const password = await readPassword();

  if (password.length < FieldLengths.passwordMin || password.length > FieldLengths.passwordMax) {
    throw new Error(
      `The password must have between ${FieldLengths.passwordMin} and ${FieldLengths.passwordMax} characters.`
    );
  }

  const { close, db } = openRuntime();
  const services = createServices(db);

  try {
    const user = await services.auth.resetPassword(email, password);

    await services.sessions.revokeAll(user.id);
    console.log(`Password updated for ${user.email}; every session was signed out.`);
  } finally {
    await close();
  }
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
