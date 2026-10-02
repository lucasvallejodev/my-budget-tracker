import { type DemoEntry, transfer } from './entries';
import {
  type AccountKey,
  CashWithdrawal,
  DemoAccounts,
  Salary,
  SavingsTopUp,
  SavingsTransfer,
} from './persona';

type Balances = Record<AccountKey, number>;

const openingOf = (): Balances =>
  Object.fromEntries(
    (Object.keys(DemoAccounts) as AccountKey[]).map(key => [
      key,
      DemoAccounts[key].openingBalanceMinor,
    ])
  ) as Balances;

const effectsOf = (entry: DemoEntry): Partial<Balances> => {
  if (entry.kind === 'standard') return entry.deleted ? {} : { [entry.account]: entry.amountMinor };

  return {
    [entry.from]: -entry.amountFromMinor,
    [entry.to]: entry.amountToMinor ?? entry.amountFromMinor,
  };
};

const roundUp = (amountMinor: number, stepMinor: number): number =>
  Math.ceil(amountMinor / stepMinor) * stepMinor;

const roundDown = (amountMinor: number, stepMinor: number): number =>
  Math.floor(amountMinor / stepMinor) * stepMinor;

const isSalary = (entry: DemoEntry): boolean =>
  entry.kind === 'standard' && entry.payee === Salary.payee;

export const balanceAccounts = (entries: DemoEntry[]): DemoEntry[] => {
  const balances = openingOf();
  const result: DemoEntry[] = [];

  const apply = (entry: DemoEntry): void => {
    result.push(entry);

    for (const [account, change] of Object.entries(effectsOf(entry)) as [AccountKey, number][]) {
      balances[account] += change;
    }
  };

  const keepEverydayAbove = (date: string, debitMinor: number): void => {
    const after = balances.everyday - debitMinor;

    if (after >= SavingsTopUp.floorMinor) return;

    apply(
      transfer({
        amountFromMinor: roundUp(SavingsTopUp.targetMinor - after, SavingsTopUp.stepMinor),
        date,
        from: 'savings',
        memo: SavingsTopUp.memo,
        to: 'everyday',
      })
    );
  };

  const keepCashAbove = (date: string, debitMinor: number): void => {
    if (balances.cash - debitMinor >= 0) return;

    keepEverydayAbove(date, CashWithdrawal.amountMinor);
    apply(
      transfer({
        amountFromMinor: CashWithdrawal.amountMinor,
        date,
        from: 'everyday',
        memo: CashWithdrawal.memo,
        to: 'cash',
      })
    );
  };

  const saveAfterPayday = (date: string): void => {
    const amountFromMinor = Math.min(
      SavingsTransfer.maxMinor,
      roundDown(balances.everyday - SavingsTransfer.bufferMinor, SavingsTransfer.stepMinor)
    );

    if (amountFromMinor <= 0) return;

    apply(
      transfer({
        amountFromMinor,
        date,
        from: 'everyday',
        memo: SavingsTransfer.memo,
        to: 'savings',
      })
    );
  };

  for (const entry of entries) {
    const effects = effectsOf(entry);

    keepCashAbove(entry.date, -Math.min(0, effects.cash ?? 0));
    keepEverydayAbove(entry.date, -Math.min(0, effects.everyday ?? 0));
    apply(entry);

    if (isSalary(entry)) saveAfterPayday(entry.date);
  }

  return result;
};
