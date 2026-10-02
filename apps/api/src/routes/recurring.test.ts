// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, signUp, TestClient, TestContext } from '@/test/app';
import { toIsoDate } from '@coinkeeper/shared/lib/date-helpers';
import { addDays } from '@coinkeeper/shared/lib/periods';

let context: TestContext;
let ada: TestClient;
let bob: TestClient;

type Series = {
  amountMaxMinor: number;
  amountMinMinor: number;
  amountMinor: number;
  id: string;
  lastPaidOn: null | string;
  monthlyEquivalentMinor: number;
  nextDueOn: null | string;
  paidCount: number;
};

type Occurrence = {
  dueOn: string;
  seriesId: string;
  status: string;
  transactionId: null | string;
};

type Row = {
  id: string;
  needsReview: boolean;
  recurringSeriesId: null | string;
  status: string;
};

const TODAY = '2026-09-20';

const createAccount = async (client: TestClient, currency = 'EUR') => {
  const response = await client.request('POST', '/accounts', {
    currency,
    name: `Checking ${currency}`,
    type: 'checking',
  });

  expect(response.statusCode).toBe(201);

  return response.json<{ id: string }>().id;
};

const createPayee = async (client: TestClient, name: string) =>
  (await client.request('POST', '/payees', { name })).json<{ id: string }>().id;

const seriesBody = (accountId: string, extra: Record<string, unknown> = {}) => ({
  accountId,
  amount: '12.99',
  anchorDate: '2026-01-15',
  cadence: 'monthly',
  interval: 1,
  kind: 'subscription',
  name: 'Streaming',
  recordMode: 'match_only',
  ...extra,
});

const createSeries = async (client: TestClient, body: Record<string, unknown>) => {
  const response = await client.request('POST', `/recurring-series?today=${TODAY}`, body);

  expect(response.statusCode, response.body).toBe(201);

  return response.json<Series>();
};

const spend = async (
  client: TestClient,
  accountId: string,
  fields: Record<string, unknown> & { amount: string; date: string }
) => {
  const response = await client.request('POST', '/transactions', {
    accountId,
    direction: 'expense',
    ...fields,
  });

  expect(response.statusCode, response.body).toBe(201);

  return response.json<Row>();
};

const upcoming = async (client: TestClient, today = TODAY) =>
  (await client.request('GET', `/recurring-series/upcoming?today=${today}`)).json<{
    items: Occurrence[];
  }>().items;

beforeAll(async () => {
  context = await createTestApp();
}, 30000);
afterAll(async () => {
  await context.close();
});
beforeEach(async () => {
  await context.database.reset();
  ada = await signUp(context.app, 'ada@example.com');
  bob = await signUp(context.app, 'bob@example.com');
});

describe('recurring series', () => {
  it('stores a signed amount with a default match range and computes the next due date', async () => {
    const accountId = await createAccount(ada);
    const series = await createSeries(ada, seriesBody(accountId));

    expect(series).toMatchObject({
      amountMaxMinor: -1201,
      amountMinMinor: -1397,
      amountMinor: -1299,
      monthlyEquivalentMinor: -1299,
      nextDueOn: '2026-10-15',
      paidCount: 0,
    });

    const income = await createSeries(
      ada,
      seriesBody(accountId, {
        amount: '2500',
        kind: 'income',
        name: 'Salary',
      })
    );

    expect(income.amountMinor).toBe(250000);
  });

  it('links a new payment of the same payee and amount to the nearest open occurrence', async () => {
    const accountId = await createAccount(ada);
    const payeeId = await createPayee(ada, 'StreamCo');
    const series = await createSeries(ada, seriesBody(accountId, { payeeId }));

    const paid = await spend(ada, accountId, {
      amount: '12.99',
      date: '2026-09-16',
      payeeId,
    });

    const tooDear = await spend(ada, accountId, {
      amount: '20.00',
      date: '2026-08-15',
      payeeId,
    });

    const elsewhere = await spend(ada, accountId, { amount: '12.99', date: '2026-08-15' });

    expect(paid.recurringSeriesId).toBe(series.id);
    expect(tooDear.recurringSeriesId).toBeNull();
    expect(elsewhere.recurringSeriesId).toBeNull();

    const september = (await upcoming(ada)).find(item => item.dueOn === '2026-09-15');

    expect(september).toMatchObject({ status: 'paid', transactionId: paid.id });
  });

  it('links earlier payments when a series is created, one per occurrence', async () => {
    const accountId = await createAccount(ada);
    const payeeId = await createPayee(ada, 'Gym');

    await spend(ada, accountId, {
      amount: '30',
      date: '2026-07-01',
      payeeId,
    });
    await spend(ada, accountId, {
      amount: '30',
      date: '2026-08-02',
      payeeId,
    });
    await spend(ada, accountId, {
      amount: '30',
      date: '2026-08-03',
      payeeId,
    });

    const series = await createSeries(
      ada,
      seriesBody(accountId, {
        amount: '30',
        anchorDate: '2026-07-01',
        name: 'Gym',
        payeeId,
      })
    );

    expect(series).toMatchObject({ lastPaidOn: '2026-08-01', paidCount: 2 });
  });

  it('labels occurrences overdue, due and upcoming around today', async () => {
    const accountId = await createAccount(ada);

    await createSeries(
      ada,
      seriesBody(accountId, {
        anchorDate: '2026-09-01',
        cadence: 'weekly',
        name: 'Lunch box',
      })
    );

    const statuses = Object.fromEntries(
      (await upcoming(ada)).map(item => [item.dueOn, item.status])
    );

    expect(statuses['2026-09-08']).toBe('overdue');
    expect(statuses['2026-09-22']).toBe('due');
    expect(statuses['2026-10-06']).toBe('upcoming');
  });

  it('records due payments of create-pending series once, as pending rows to review', async () => {
    const accountId = await createAccount(ada);

    const today = toIsoDate(new Date());
    const anchorDate = addDays(today, -2);

    const series = await createSeries(
      ada,
      seriesBody(accountId, {
        anchorDate,
        name: 'Rent',
        recordMode: 'create_pending',
      })
    );

    await createSeries(ada, seriesBody(accountId, { anchorDate, name: 'Quiet' }));

    const first = await ada.request('POST', '/recurring-series/record-due', { today });
    const second = await ada.request('POST', '/recurring-series/record-due', { today });

    expect(first.json().created).toBe(1);
    expect(second.json().created).toBe(0);

    const rows = (await ada.request('GET', '/transactions')).json<{ items: Row[] }>().items;

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      needsReview: true,
      recurringSeriesId: series.id,
      status: 'pending',
    });
  });

  it('links and unlinks a payment by hand and refuses a second payment for one date', async () => {
    const accountId = await createAccount(ada);
    const series = await createSeries(ada, seriesBody(accountId));
    const first = await spend(ada, accountId, { amount: '15', date: '2026-09-14' });
    const second = await spend(ada, accountId, { amount: '15', date: '2026-09-14' });
    const path = `/recurring-series/${series.id}/occurrences/2026-09-15`;

    const linked = await ada.request('PUT', path, { transactionId: first.id });

    expect(linked.json<Row>().recurringSeriesId).toBe(series.id);
    expect((await ada.request('PUT', path, { transactionId: second.id })).statusCode).toBe(409);

    const offDay = await ada.request(
      'PUT',
      `/recurring-series/${series.id}/occurrences/2026-09-16`,
      { transactionId: second.id }
    );

    expect(offDay.statusCode).toBe(422);
    expect((await ada.request('DELETE', path)).statusCode).toBe(204);
    expect((await ada.request('DELETE', path)).statusCode).toBe(404);
  });

  it('records a payment for an occurrence from the transaction form', async () => {
    const accountId = await createAccount(ada);
    const series = await createSeries(ada, seriesBody(accountId));
    const recurring = { dueOn: '2026-09-15', seriesId: series.id };

    const row = await spend(ada, accountId, {
      amount: '13.50',
      date: '2026-09-15',
      recurring,
    });

    expect(row.recurringSeriesId).toBe(series.id);

    const again = await ada.request('POST', '/transactions', {
      accountId,
      amount: '13.50',
      date: '2026-09-15',
      direction: 'expense',
      recurring,
    });

    expect(again.statusCode).toBe(409);
  });

  it('suggests regular payments from history until a series exists for the payee', async () => {
    const accountId = await createAccount(ada);
    const music = await createPayee(ada, 'MusicCo');
    const market = await createPayee(ada, 'Market');

    for (const date of ['2026-06-03', '2026-07-03', '2026-08-04', '2026-09-03']) {
      await spend(ada, accountId, {
        amount: '9.99',
        date: date,
        payeeId: music,
      });
    }

    for (const date of ['2026-06-01', '2026-06-04', '2026-08-20', '2026-09-12']) {
      await spend(ada, accountId, {
        amount: '40',
        date: date,
        payeeId: market,
      });
    }

    const suggestions = (
      await ada.request('GET', `/recurring-series/suggestions?today=${TODAY}`)
    ).json().items;

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      amountMinor: -999,
      cadence: 'monthly',
      interval: 1,
      kind: 'subscription',
      nextDueOn: '2026-10-03',
      payeeId: music,
    });

    await createSeries(
      ada,
      seriesBody(accountId, {
        amount: '9.99',
        anchorDate: '2026-06-03',
        payeeId: music,
      })
    );

    const after = (await ada.request('GET', `/recurring-series/suggestions?today=${TODAY}`)).json();

    expect(after.items).toEqual([]);
  });

  it('pauses, deletes softly and restores a series', async () => {
    const accountId = await createAccount(ada);
    const series = await createSeries(ada, seriesBody(accountId));

    const paused = await ada.request(
      'PUT',
      `/recurring-series/${series.id}?today=${TODAY}`,
      seriesBody(accountId, { status: 'paused' })
    );

    expect(paused.json<Series>().nextDueOn).toBeNull();
    expect(await upcoming(ada)).toEqual([]);

    expect((await ada.request('DELETE', `/recurring-series/${series.id}`)).statusCode).toBe(204);
    expect((await ada.request('GET', '/recurring-series')).json().items).toEqual([]);
    expect((await ada.request('GET', '/recurring-series?deleted=true')).json().items).toHaveLength(
      1
    );
    expect((await ada.request('POST', `/recurring-series/${series.id}/restore`)).statusCode).toBe(
      200
    );
  });

  it('keeps whole yen amounts and rejects an end date before the start', async () => {
    const accountId = await createAccount(ada, 'JPY');
    const series = await createSeries(ada, seriesBody(accountId, { amount: '980' }));

    expect(series.amountMinor).toBe(-980);

    const backwards = await ada.request(
      'POST',
      '/recurring-series',
      seriesBody(accountId, { amount: '980', endDate: '2025-12-31' })
    );

    expect(backwards.statusCode, backwards.body).toBe(422);
  });

  it("keeps series private and never links another user's transactions", async () => {
    const accountId = await createAccount(ada);
    const series = await createSeries(ada, seriesBody(accountId));
    const bobAccount = await createAccount(bob);
    const bobRow = await spend(bob, bobAccount, { amount: '12.99', date: '2026-09-15' });

    expect((await bob.request('GET', '/recurring-series')).json().items).toEqual([]);
    expect(await upcoming(bob)).toEqual([]);
    expect(bobRow.recurringSeriesId).toBeNull();

    const foreign = await ada.request(
      'PUT',
      `/recurring-series/${series.id}/occurrences/2026-09-15`,
      { transactionId: bobRow.id }
    );

    expect(foreign.statusCode).toBe(404);
    expect((await bob.request('POST', '/recurring-series', seriesBody(accountId))).statusCode).toBe(
      404
    );
  });
});
