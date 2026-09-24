import type { Algorithm } from '@node-rs/argon2';
import { hash, verify } from '@node-rs/argon2';

const ARGON2ID_IDENTIFIER = 2;
const ARGON2ID = ARGON2ID_IDENTIFIER as Algorithm;

const HashOptions = {
  algorithm: ARGON2ID,
  memoryCost: 19_456,
  parallelism: 1,
  timeCost: 2,
} as const;

const TIMING_REFERENCE_INPUT = 'coinkeeper-timing-reference';

let referenceHash: Promise<string> | undefined;

export const hashPassword = (password: string): Promise<string> => hash(password, HashOptions);

export const verifyPassword = (passwordHash: string, password: string): Promise<boolean> =>
  verify(passwordHash, password);

export const spendVerificationTime = async (password: string): Promise<false> => {
  referenceHash ??= hashPassword(TIMING_REFERENCE_INPUT);
  await verify(await referenceHash, password);

  return false;
};
