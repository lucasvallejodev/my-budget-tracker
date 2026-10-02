'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  restoreAccount,
  restoreExchangeRate,
  restoreRule,
  restoreSeries,
  restoreTemplate,
  restoreTransaction,
} from '@/api/mutations';
import {
  Amount,
  Button,
  EmptyState,
  ListRow,
  Page,
  PageHeading,
  Panel,
  QueryContent,
  TabList,
  TabPanel,
  TabRoot,
  TabTrigger,
  Text,
} from '@/components/ui';

import { describeTransaction } from '../transaction-labels';
import {
  useDeletedAccounts,
  useDeletedExchangeRates,
  useDeletedRules,
  useDeletedSeries,
  useDeletedTemplates,
  useDeletedTransactions,
  useRefreshFinance,
} from '../use-finance-data';

const Tabs = {
  accounts: 'Accounts',
  rates: 'Exchange rates',
  recurring: 'Recurring',
  rules: 'Rules',
  templates: 'Templates',
  transactions: 'Transactions',
} as const;

const TabOrder = [
  Tabs.transactions,
  Tabs.accounts,
  Tabs.rules,
  Tabs.templates,
  Tabs.recurring,
  Tabs.rates,
];

const deletedOn = (deletedAt: string | null): string =>
  deletedAt ? `Deleted ${new Date(deletedAt).toLocaleDateString()}` : '';

function useRestore<Input>(restore: (input: Input) => Promise<unknown>) {
  const refresh = useRefreshFinance();

  return useMutation({
    mutationFn: restore,
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success('Restored');
      await refresh();
    },
  });
}

function RestoreButton({
  label,
  onClick,
  pending,
}: {
  label: string;
  onClick: () => void;
  pending: boolean;
}) {
  return (
    <Button variant="outline" size="sm" aria-label={label} disabled={pending} onClick={onClick}>
      Restore
    </Button>
  );
}

function DeletedTransactions() {
  const query = useDeletedTransactions();
  const restore = useRestore(restoreTransaction);
  const rows = query.data ?? [];

  return (
    <QueryContent
      pending={query.isPending}
      error={query.isError}
      loading="Loading deleted transactions…"
      empty={!rows.length && <EmptyState title="No deleted transactions" />}
    >
      {() =>
        rows.map(row => (
          <ListRow
            key={row.id}
            title={describeTransaction(row)}
            description={`${row.date} · ${row.accountName} · ${deletedOn(row.deletedAt)}`}
          >
            <Amount amountMinor={row.amountMinor} currency={row.currency} signed />
            <RestoreButton
              label={`Restore ${describeTransaction(row)}`}
              pending={restore.isPending}
              onClick={() => restore.mutate(row)}
            />
          </ListRow>
        ))
      }
    </QueryContent>
  );
}

function DeletedAccounts() {
  const query = useDeletedAccounts();
  const restore = useRestore(restoreAccount);
  const rows = query.data ?? [];

  return (
    <QueryContent
      pending={query.isPending}
      error={query.isError}
      loading="Loading deleted accounts…"
      empty={!rows.length && <EmptyState title="No deleted accounts" />}
    >
      {() =>
        rows.map(row => (
          <ListRow
            key={row.id}
            title={row.name}
            description={`${row.currency} · ${deletedOn(row.deletedAt)}`}
          >
            <RestoreButton
              label={`Restore ${row.name}`}
              pending={restore.isPending}
              onClick={() => restore.mutate(row.id)}
            />
          </ListRow>
        ))
      }
    </QueryContent>
  );
}

function DeletedRules() {
  const query = useDeletedRules();
  const restore = useRestore(restoreRule);
  const rows = query.data ?? [];

  return (
    <QueryContent
      pending={query.isPending}
      error={query.isError}
      loading="Loading deleted rules…"
      empty={!rows.length && <EmptyState title="No deleted rules" />}
    >
      {() =>
        rows.map(row => (
          <ListRow
            key={row.id}
            title={row.name}
            description={`“${row.pattern}” → ${row.categoryName ?? 'Unknown category'} · ${deletedOn(row.deletedAt)}`}
          >
            <RestoreButton
              label={`Restore ${row.name}`}
              pending={restore.isPending}
              onClick={() => restore.mutate(row.id)}
            />
          </ListRow>
        ))
      }
    </QueryContent>
  );
}

type NamedRow = {
  deletedAt: string | null;
  id: string;
  name: string;
};

function DeletedNamedRows({
  noun,
  query,
  restore,
}: {
  noun: string;
  query: { data?: NamedRow[]; isError: boolean; isPending: boolean };
  restore: (id: string) => Promise<unknown>;
}) {
  const restoring = useRestore(restore);
  const rows = query.data ?? [];

  return (
    <QueryContent
      pending={query.isPending}
      error={query.isError}
      loading={`Loading deleted ${noun}…`}
      empty={!rows.length && <EmptyState title={`No deleted ${noun}`} />}
    >
      {() =>
        rows.map(row => (
          <ListRow key={row.id} title={row.name} description={deletedOn(row.deletedAt)}>
            <RestoreButton
              label={`Restore ${row.name}`}
              pending={restoring.isPending}
              onClick={() => restoring.mutate(row.id)}
            />
          </ListRow>
        ))
      }
    </QueryContent>
  );
}

function DeletedSeries() {
  return (
    <DeletedNamedRows
      noun="recurring payments"
      query={useDeletedSeries()}
      restore={restoreSeries}
    />
  );
}

function DeletedTemplates() {
  return (
    <DeletedNamedRows noun="templates" query={useDeletedTemplates()} restore={restoreTemplate} />
  );
}

function DeletedExchangeRates() {
  const query = useDeletedExchangeRates();
  const restore = useRestore(restoreExchangeRate);
  const rows = query.data ?? [];

  return (
    <QueryContent
      pending={query.isPending}
      error={query.isError}
      loading="Loading deleted exchange rates…"
      empty={!rows.length && <EmptyState title="No deleted exchange rates" />}
    >
      {() =>
        rows.map(row => {
          const name = `1 ${row.base} = ${row.rate} ${row.quote}`;

          return (
            <ListRow
              key={`${row.base}-${row.quote}-${row.date}`}
              title={name}
              description={`${row.date} · ${deletedOn(row.deletedAt)}`}
            >
              <RestoreButton
                label={`Restore ${name} on ${row.date}`}
                pending={restore.isPending}
                onClick={() => restore.mutate(row)}
              />
            </ListRow>
          );
        })
      }
    </QueryContent>
  );
}

export function DeletedItems() {
  return (
    <Page>
      <PageHeading
        title="Deleted items"
        description="Nothing you delete is lost. Deleted entries are left out of balances, reports and budgets until you restore them."
      />
      <Panel title="Restore deleted entries">
        <TabRoot defaultValue={Tabs.transactions}>
          <TabList aria-label="Deleted item types">
            {TabOrder.map(tab => (
              <TabTrigger key={tab} value={tab}>
                {tab}
              </TabTrigger>
            ))}
          </TabList>
          <TabPanel value={Tabs.transactions}>
            <DeletedTransactions />
          </TabPanel>
          <TabPanel value={Tabs.accounts}>
            <DeletedAccounts />
          </TabPanel>
          <TabPanel value={Tabs.rules}>
            <DeletedRules />
          </TabPanel>
          <TabPanel value={Tabs.templates}>
            <DeletedTemplates />
          </TabPanel>
          <TabPanel value={Tabs.recurring}>
            <DeletedSeries />
          </TabPanel>
          <TabPanel value={Tabs.rates}>
            <DeletedExchangeRates />
          </TabPanel>
        </TabRoot>
        <Text tone="muted">
          Deleted budgets come back when you set a limit for the same category and month again.
        </Text>
      </Panel>
    </Page>
  );
}
