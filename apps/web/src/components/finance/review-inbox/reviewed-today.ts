export type ReviewedItem = {
  accountName: string;
  amountMinor: number;
  categoryIcon: string | null;
  categoryName: string | null;
  currency: string;
  groupColor: string | null;
  id: string;
  previousCategoryId: string | null;
  source: 'manual' | 'rule' | 'payee';
  title: string;
};

type ReviewedLog = {
  date: string;
  items: ReviewedItem[];
};

const StorageKey = 'coinkeeper-reviewed-today';

const readLog = (): ReviewedLog | undefined => {
  try {
    const stored = localStorage.getItem(StorageKey);

    return stored ? (JSON.parse(stored) as ReviewedLog) : undefined;
  } catch {
    return undefined;
  }
};

const writeLog = (log: ReviewedLog) => {
  try {
    localStorage.setItem(StorageKey, JSON.stringify(log));
  } catch {
    return;
  }
};

export const reviewedToday = (today: string): ReviewedItem[] => {
  const log = readLog();

  return log?.date === today ? log.items : [];
};

export const addReviewed = (today: string, item: ReviewedItem): ReviewedItem[] => {
  const items = [item, ...reviewedToday(today).filter(existing => existing.id !== item.id)];

  writeLog({ date: today, items });

  return items;
};

export const removeReviewed = (today: string, id: string): ReviewedItem[] => {
  const items = reviewedToday(today).filter(item => item.id !== id);

  writeLog({ date: today, items });

  return items;
};
