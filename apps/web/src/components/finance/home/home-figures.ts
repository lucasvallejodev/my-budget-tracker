import type { AttentionItem } from '../attention-strip';
import type { BudgetFigures } from '../budget-status';
import type { SpendingSlice } from '../spending-bars';
import type { Summary } from '../use-finance-data';

type Format = (value: number) => string;

const BudgetsPath = '/budgets';

const reviewItems = (count: number): AttentionItem[] =>
  count
    ? [
        {
          href: '/review',
          id: 'review',
          label: `${count} transaction${count === 1 ? ' needs' : 's need'} a category`,
          tone: 'brand',
        },
      ]
    : [];

const overItems = (over: BudgetFigures[], format: Format): AttentionItem[] => {
  if (!over.length) return [];

  const label =
    over.length === 1
      ? `${over[0].budget.categoryName} is ${format(-over[0].leftMinor)} over budget`
      : `${over.length} budgets are over`;

  return [
    {
      href: BudgetsPath,
      id: 'over',
      label,
      tone: 'danger',
    },
  ];
};

const fastItems = (fast: BudgetFigures[]): AttentionItem[] => {
  if (!fast.length) return [];

  const subject =
    fast.length === 1 ? `${fast[0].budget.categoryName} is` : `${fast.length} budgets are`;

  return [
    {
      href: BudgetsPath,
      id: 'fast',
      label: `${subject} spending too fast`,
      tone: 'warning',
    },
  ];
};

export const attentionItems = (
  reviewCount: number,
  figures: BudgetFigures[],
  format: Format
): AttentionItem[] => [
  ...reviewItems(reviewCount),
  ...overItems(
    figures.filter(item => item.state === 'over'),
    format
  ),
  ...fastItems(figures.filter(item => item.state === 'fast')),
];

export const spendingSlices = (
  summary: Summary,
  previous: Summary | undefined,
  currency: string
): SpendingSlice[] =>
  summary.breakdown
    .filter(slice => slice.currency === currency)
    .map(slice => ({
      color: slice.color,
      name: slice.groupName,
      previousMinor: previous?.breakdown.find(
        candidate => candidate.currency === currency && candidate.groupName === slice.groupName
      )?.spentMinor,
      spentMinor: slice.spentMinor,
    }));

export const heroTotals = (
  summary: Summary,
  previous: Summary | undefined,
  currency: string
): {
  incomeMinor: number;
  previousIncomeMinor: number;
  previousSpendingMinor: number;
  spendingMinor: number;
} => {
  const current = summary.totals.find(total => total.currency === currency);
  const before = previous?.totals.find(total => total.currency === currency);

  return {
    incomeMinor: current?.incomeMinor ?? 0,
    previousIncomeMinor: before?.incomeMinor ?? 0,
    previousSpendingMinor: before?.spendingMinor ?? 0,
    spendingMinor: current?.spendingMinor ?? 0,
  };
};
