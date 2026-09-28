// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createDatabase, NO_STATEMENT_TIMEOUT, poolConfig, statementTimeoutFor } from '.';

const UnreachableUrl = 'postgres://coinkeeper:secret@127.0.0.1:1/coinkeeper';
const RequestTimeouts = { statementTimeoutMs: statementTimeoutFor(20_000) };

describe('statementTimeoutFor', () => {
  it('ends a statement one second before the request handler times out', () => {
    expect(statementTimeoutFor(20_000)).toBe(19_000);
    expect(statementTimeoutFor(120_000)).toBe(119_000);
  });

  it('never disables the limit for the shortest handler timeout', () => {
    expect(statementTimeoutFor(1_000)).toBe(500);
  });
});

describe('poolConfig', () => {
  it('bounds statements and idle transactions and names the application', () => {
    expect(poolConfig(UnreachableUrl, RequestTimeouts)).toMatchObject({
      application_name: 'coinkeeper-api',
      connectionString: UnreachableUrl,
      idle_in_transaction_session_timeout: 30_000,
      statement_timeout: 19_000,
    });
  });

  it('lets the migrator run without a statement timeout', () => {
    expect(
      poolConfig(UnreachableUrl, { statementTimeoutMs: NO_STATEMENT_TIMEOUT }).statement_timeout
    ).toBe(0);
  });
});

describe('createDatabase', () => {
  const opened: (() => Promise<void>)[] = [];

  afterEach(async () => {
    await Promise.all(opened.splice(0).map(close => close()));
    vi.restoreAllMocks();
  });

  it('logs an idle client error instead of crashing the process', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { close, db } = createDatabase(UnreachableUrl, RequestTimeouts);
    const failure = new Error('terminating connection due to administrator command');

    opened.push(close);

    expect(() => db.$client.emit('error', failure)).not.toThrow();
    expect(consoleError).toHaveBeenCalledWith('Idle database client failed', failure);
  });

  it('sends idle client errors to the handler the server registers', () => {
    const { close, db, reportErrorsTo } = createDatabase(UnreachableUrl, RequestTimeouts);
    const handler = vi.fn();
    const failure = new Error('Connection terminated unexpectedly');

    opened.push(close);
    reportErrorsTo(handler);
    db.$client.emit('error', failure);

    expect(handler).toHaveBeenCalledWith(failure);
  });
});
