// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { HttpStatus } from '@/constants/http';
import { ServiceError } from '@/modules/db';

import {
  createSignInThrottle,
  SIGN_IN_FAILURE_MEMORY_MS,
  SIGN_IN_MAX_DELAY_MS,
  SIGN_IN_MAX_WAIT_MS,
} from './sign-in-throttle';

const wrongPassword = () =>
  Promise.reject(
    new ServiceError(
      'The email or password is incorrect',
      HttpStatus.unauthorized,
      'INVALID_CREDENTIALS'
    )
  );

const rightPassword = () => Promise.resolve('signed in');

const createClock = () => {
  let current = Date.UTC(2026, 0, 1);
  const waits: number[] = [];

  return {
    advance: (milliseconds: number) => {
      current += milliseconds;
    },
    now: () => current,
    wait: (milliseconds: number) => {
      waits.push(milliseconds);
      current += milliseconds;

      return Promise.resolve();
    },
    waits,
  };
};

const codeOf = (promise: Promise<unknown>) =>
  promise.then(
    () => 'OK',
    (error: ServiceError) => error.code
  );

const throttleWith = (freeFailures: number) => {
  const clock = createClock();

  const throttle = createSignInThrottle({
    freeFailures,
    now: clock.now,
    wait: clock.wait,
  });

  return { clock, throttle };
};

describe('createSignInThrottle', () => {
  it('lets the free failures through without any delay', async () => {
    const { clock, throttle } = throttleWith(3);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await codeOf(throttle.attempt('ada@example.com', wrongPassword));
    }

    expect(clock.waits).toEqual([]);
  });

  it('slows further attempts with a growing delay capped at the maximum', async () => {
    const { clock, throttle } = throttleWith(1);

    for (let attempt = 0; attempt < 7; attempt += 1) {
      await codeOf(throttle.attempt(' ADA@example.com ', wrongPassword));
    }

    expect(clock.waits).toEqual([1000, 2000, 4000, SIGN_IN_MAX_DELAY_MS, SIGN_IN_MAX_DELAY_MS]);
  });

  it('never locks the account: the right password still signs in after the delay', async () => {
    const { clock, throttle } = throttleWith(1);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await codeOf(throttle.attempt('ada@example.com', wrongPassword));
    }

    expect(await codeOf(throttle.attempt('Ada@Example.com', rightPassword))).toBe('OK');
    expect(clock.waits.at(-1)).toBe(SIGN_IN_MAX_DELAY_MS);
    expect(throttle.trackedAccounts()).toBe(0);
  });

  it('queues concurrent attempts one slot apart and refuses them only past the maximum wait', async () => {
    const clock = createClock();
    const pending: number[] = [];

    const throttle = createSignInThrottle({
      freeFailures: 1,
      now: clock.now,
      wait: milliseconds => {
        pending.push(milliseconds);

        return new Promise<void>(() => undefined);
      },
    });

    await codeOf(throttle.attempt('ada@example.com', wrongPassword));

    const results = Array.from({ length: 20 }, () =>
      codeOf(throttle.attempt('ada@example.com', wrongPassword))
    );

    expect(await results.at(-1)).toBe('RATE_LIMITED');
    expect(pending.every(delay => delay <= SIGN_IN_MAX_WAIT_MS)).toBe(true);
    expect(pending.at(-1)).toBe(SIGN_IN_MAX_WAIT_MS);
  });

  it('forgets failures after a quiet period and after a success', async () => {
    const { clock, throttle } = throttleWith(1);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await codeOf(throttle.attempt('ada@example.com', wrongPassword));
    }

    clock.advance(SIGN_IN_FAILURE_MEMORY_MS);
    await codeOf(throttle.attempt('ada@example.com', wrongPassword));
    expect(clock.waits).toEqual([1000]);

    await codeOf(throttle.attempt('ada@example.com', rightPassword));
    expect(throttle.trackedAccounts()).toBe(0);
  });

  it('counts only wrong credentials and keeps other accounts unaffected', async () => {
    const { clock, throttle } = throttleWith(1);
    const outage = () => Promise.reject(new ServiceError('Down', HttpStatus.serviceUnavailable));

    expect(await codeOf(throttle.attempt('ada@example.com', outage))).toBe('UNAVAILABLE');
    await codeOf(throttle.attempt('ada@example.com', wrongPassword));
    expect(await codeOf(throttle.attempt('bob@example.com', rightPassword))).toBe('OK');
    expect(clock.waits).toEqual([]);
  });

  it('keeps memory bounded by dropping the oldest account when full', async () => {
    const clock = createClock();

    const throttle = createSignInThrottle({
      freeFailures: 1,
      maxTrackedAccounts: 2,
      now: clock.now,
      wait: clock.wait,
    });

    for (const email of ['a@example.com', 'b@example.com', 'c@example.com']) {
      await codeOf(throttle.attempt(email, wrongPassword));
    }

    expect(throttle.trackedAccounts()).toBe(2);
  });
});
