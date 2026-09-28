// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import {
  EXIT_FAILURE,
  EXIT_SUCCESS,
  shutDown,
  shutDownAfterFatal,
  type ShutdownOptions,
} from './shutdown';

const SHORT_TIMEOUT_MS = 20;

const optionsWith = (overrides: Partial<ShutdownOptions>) => {
  const options = {
    closeApp: vi.fn(() => Promise.resolve()),
    closeDatabase: vi.fn(() => Promise.resolve()),
    exit: vi.fn(),
    log: {
      error: vi.fn(),
      fatal: vi.fn(),
      info: vi.fn(),
    },
    timeoutMs: SHORT_TIMEOUT_MS,
    ...overrides,
  };

  return options;
};

const never = () => new Promise<void>(() => undefined);

describe('shutDown', () => {
  it('closes the server, then the database, and exits with 0', async () => {
    const order: string[] = [];

    const options = optionsWith({
      closeApp: vi.fn(() => {
        order.push('app');

        return Promise.resolve();
      }),
      closeDatabase: vi.fn(() => {
        order.push('database');

        return Promise.resolve();
      }),
    });

    await shutDown(options);

    expect(order).toEqual(['app', 'database']);
    expect(options.exit).toHaveBeenCalledWith(EXIT_SUCCESS);
  });

  it('still closes the database and exits non-zero when closing the server fails', async () => {
    const failure = new Error('close failed');
    const options = optionsWith({ closeApp: vi.fn(() => Promise.reject(failure)) });

    await shutDown(options);

    expect(options.closeDatabase).toHaveBeenCalled();
    expect(options.log.error).toHaveBeenCalledWith(failure, 'Shutdown failed');
    expect(options.exit).toHaveBeenCalledWith(EXIT_FAILURE);
  });

  it('gives up after the timeout and exits non-zero', async () => {
    const options = optionsWith({ closeApp: vi.fn(never) });

    await shutDown(options);

    expect(options.closeDatabase).not.toHaveBeenCalled();
    expect(options.exit).toHaveBeenCalledOnce();
    expect(options.exit).toHaveBeenCalledWith(EXIT_FAILURE);
  });
});

describe('shutDownAfterFatal', () => {
  it('logs the error as fatal, closes everything and exits non-zero even when closing succeeds', async () => {
    const failure = new Error('boom');
    const options = optionsWith({});

    await shutDownAfterFatal(failure, options);

    expect(options.log.fatal).toHaveBeenCalledWith({ err: failure }, 'Fatal error, shutting down');
    expect(options.closeApp).toHaveBeenCalled();
    expect(options.closeDatabase).toHaveBeenCalled();
    expect(options.exit).toHaveBeenCalledWith(EXIT_FAILURE);
  });

  it('still exits non-zero when the shutdown times out', async () => {
    const options = optionsWith({ closeApp: vi.fn(never) });

    await shutDownAfterFatal(new Error('boom'), options);

    expect(options.exit).toHaveBeenCalledOnce();
    expect(options.exit).toHaveBeenCalledWith(EXIT_FAILURE);
  });
});
