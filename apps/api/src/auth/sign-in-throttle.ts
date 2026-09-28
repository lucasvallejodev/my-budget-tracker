import { setTimeout as sleep } from 'node:timers/promises';

import { HttpStatus } from '@/constants/http';
import { ServiceError } from '@/modules/db';

import { normaliseEmail } from './service';

const FAILURE_MEMORY_MINUTES = 15;
const MILLISECONDS_PER_MINUTE = 60_000;
const MAX_TRACKED_ACCOUNTS = 10_000;
const BASE_DELAY_MS = 1000;
const DELAY_GROWTH_FACTOR = 2;

export const SIGN_IN_FAILURE_MEMORY_MS = FAILURE_MEMORY_MINUTES * MILLISECONDS_PER_MINUTE;
export const SIGN_IN_MAX_DELAY_MS = 5000;
export const SIGN_IN_MAX_WAIT_MS = 15_000;

type AccountState = {
  failures: number;
  forgetAt: number;
  nextSlotAt: number;
};

export type SignInThrottleOptions = {
  freeFailures: number;
  maxTrackedAccounts?: number;
  now?: () => number;
  wait?: (milliseconds: number) => Promise<unknown>;
};

const tooManyAttempts = (): never => {
  throw new ServiceError(
    'Too many sign-in attempts for this account. Try again in a few seconds.',
    HttpStatus.tooManyRequests,
    'RATE_LIMITED'
  );
};

const isInvalidCredentials = (error: unknown): boolean =>
  error instanceof ServiceError && error.code === 'INVALID_CREDENTIALS';

const spacingFor = (failures: number, freeFailures: number): number =>
  failures < freeFailures
    ? 0
    : Math.min(
        BASE_DELAY_MS * DELAY_GROWTH_FACTOR ** (failures - freeFailures),
        SIGN_IN_MAX_DELAY_MS
      );

export const createSignInThrottle = ({
  freeFailures,
  maxTrackedAccounts = MAX_TRACKED_ACCOUNTS,
  now = Date.now,
  wait = sleep,
}: SignInThrottleOptions) => {
  const accounts = new Map<string, AccountState>();

  const stateOf = (account: string): AccountState | undefined => {
    const state = accounts.get(account);

    if (state && state.forgetAt <= now()) {
      accounts.delete(account);

      return undefined;
    }

    return state;
  };

  const makeRoom = () => {
    for (const [account, state] of accounts) {
      if (accounts.size < maxTrackedAccounts && state.forgetAt > now()) return;
      accounts.delete(account);
    }
  };

  const reserveSlot = (state: AccountState): number => {
    const slotAt = Math.max(now(), state.nextSlotAt);
    const delay = slotAt - now();

    if (delay > SIGN_IN_MAX_WAIT_MS) return tooManyAttempts();

    state.nextSlotAt = slotAt + spacingFor(state.failures, freeFailures);

    return delay;
  };

  const recordFailure = (account: string) => {
    const state = stateOf(account);
    const forgetAt = now() + SIGN_IN_FAILURE_MEMORY_MS;

    if (state) {
      state.failures += 1;
      state.forgetAt = forgetAt;

      return;
    }

    makeRoom();
    accounts.set(account, {
      failures: 1,
      forgetAt,
      nextSlotAt: now(),
    });
  };

  return {
    async attempt<Result>(email: string, signIn: () => Promise<Result>): Promise<Result> {
      const account = normaliseEmail(email);
      const state = stateOf(account);
      const delay = state ? reserveSlot(state) : 0;

      if (delay > 0) await wait(delay);

      try {
        const result = await signIn();

        accounts.delete(account);

        return result;
      } catch (error) {
        if (isInvalidCredentials(error)) recordFailure(account);
        throw error;
      }
    },
    trackedAccounts: () => accounts.size,
  };
};

export type SignInThrottle = ReturnType<typeof createSignInThrottle>;
