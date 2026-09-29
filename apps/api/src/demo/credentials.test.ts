import { describe, expect, it } from 'vitest';

import { DEFAULT_DEMO_EMAIL, demoCredentials } from './credentials';

const ValidPassword = 'a local demo passphrase';

describe('demo credentials', () => {
  it('reads the email and the password from the environment', () => {
    expect(
      demoCredentials({ DEMO_USER_EMAIL: ' jhon@example.com ', DEMO_USER_PASSWORD: ValidPassword })
    ).toEqual({ email: 'jhon@example.com', password: ValidPassword });
  });

  it('falls back to the default email', () => {
    expect(demoCredentials({ DEMO_USER_PASSWORD: ValidPassword }).email).toBe(DEFAULT_DEMO_EMAIL);
    expect(demoCredentials({ DEMO_USER_EMAIL: '', DEMO_USER_PASSWORD: ValidPassword }).email).toBe(
      DEFAULT_DEMO_EMAIL
    );
  });

  it('refuses a missing or too short password', () => {
    expect(() => demoCredentials({})).toThrow('Set DEMO_USER_PASSWORD');
    expect(() => demoCredentials({ DEMO_USER_PASSWORD: 'short' })).toThrow(
      'Set DEMO_USER_PASSWORD'
    );
  });
});
