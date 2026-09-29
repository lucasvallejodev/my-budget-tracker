import { FieldLengths } from '@coinkeeper/shared/constants/field-lengths';

export type DemoCredentials = {
  email: string;
  password: string;
};

export const DEFAULT_DEMO_EMAIL = 'test@test.com';

export const demoCredentials = (environment: NodeJS.ProcessEnv): DemoCredentials => {
  const email = environment.DEMO_USER_EMAIL?.trim() || DEFAULT_DEMO_EMAIL;
  const password = environment.DEMO_USER_PASSWORD ?? '';

  if (password.length < FieldLengths.passwordMin || password.length > FieldLengths.passwordMax) {
    throw new Error(
      `Set DEMO_USER_PASSWORD in .env (${FieldLengths.passwordMin} to ${FieldLengths.passwordMax} ` +
        'characters) before seeding the demo account.'
    );
  }

  return { email, password };
};
