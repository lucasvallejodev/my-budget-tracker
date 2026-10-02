'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

import { recordDuePayments } from '@/api/mutations';
import { localIsoDate } from '@coinkeeper/shared/lib/date-helpers';

import { useRefreshFinance } from '../use-finance-data';

const RecordedDays = new Set<string>();

const recordedMessage = (created: number): string =>
  created === 1
    ? '1 payment is due and waits on Review'
    : `${created} payments are due and wait on Review`;

export function useRecordDue() {
  const refresh = useRefreshFinance();
  const today = localIsoDate(new Date());

  useEffect(() => {
    if (RecordedDays.has(today)) return;

    RecordedDays.add(today);
    recordDuePayments(today)
      .then(({ created }) => {
        if (!created) return;

        toast.info(recordedMessage(created));
        void refresh();
      })
      .catch(() => RecordedDays.delete(today));
  }, [refresh, today]);
}
