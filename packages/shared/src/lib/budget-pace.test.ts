import { describe, expect, it } from 'vitest';

import { budgetPace, MIN_DAYS_FOR_PROJECTION } from './budget-pace';
import { calendarPeriod } from './periods';

const september = calendarPeriod('2026-09');

describe('budget pace', () => {
  it('matches the documented example', () => {
    expect(
      budgetPace({
        limitMinor: 40000,
        period: september,
        spentMinor: 30000,
        today: '2026-09-18',
      })
    ).toEqual({
      aheadMinor: 6000,
      daysLeft: 13,
      expectedMinor: 24000,
      isCurrent: true,
      perDayLeftMinor: 769,
      projectedMinor: 50000,
      tooFast: true,
    });
  });

  it('is on track when spending follows the even pace', () => {
    const pace = budgetPace({
      limitMinor: 30000,
      period: september,
      spentMinor: 10000,
      today: '2026-09-10',
    });

    expect(pace).toMatchObject({
      aheadMinor: 0,
      projectedMinor: 30000,
      tooFast: false,
    });
  });

  it('waits a few days before calling the pace too fast', () => {
    const early = budgetPace({
      limitMinor: 30000,
      period: september,
      spentMinor: 5000,
      today: `2026-09-0${MIN_DAYS_FOR_PROJECTION - 1}`,
    });

    expect(early.projectedMinor).toBeGreaterThan(30000);
    expect(early.tooFast).toBe(false);
  });

  it('stops calling it too fast once the limit is exceeded, and allows nothing per day', () => {
    const over = budgetPace({
      limitMinor: 30000,
      period: september,
      spentMinor: 31000,
      today: '2026-09-20',
    });

    expect(over).toMatchObject({ perDayLeftMinor: 0, tooFast: false });
  });

  it('uses the amount spent as the projection for past and future periods', () => {
    const past = budgetPace({
      limitMinor: 30000,
      period: calendarPeriod('2026-08'),
      spentMinor: 12000,
      today: '2026-09-18',
    });

    const future = budgetPace({
      limitMinor: 30000,
      period: calendarPeriod('2026-10'),
      spentMinor: 0,
      today: '2026-09-18',
    });

    expect(past).toMatchObject({
      daysLeft: 0,
      isCurrent: false,
      perDayLeftMinor: 0,
      projectedMinor: 12000,
    });
    expect(future).toMatchObject({
      expectedMinor: 0,
      isCurrent: false,
      perDayLeftMinor: 967,
    });
  });
});
