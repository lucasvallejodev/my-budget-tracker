'use client';

import { useState } from 'react';

import {
  Button,
  Columns,
  Dialog,
  DialogContent,
  DialogTitle,
  Field,
  Grid,
  Input,
  Notice,
  Page,
  PageHeading,
  Panel,
  PromotionPanel,
  Stack,
  TabList,
  TabPanel,
  TabRoot,
  TabTrigger,
} from '@/components/ui';
import { formatMajorAmount } from '@coinkeeper/shared/lib/money';

import { BalanceCard } from '../balance-card';
import { BudgetProgress } from '../budget-progress';
import { CashFlowChart } from '../cash-flow-chart';
import { DistributionChart } from '../distribution-chart';
import { MetricCard } from '../metric-card';
import { PaymentCards } from '../payment-cards';
import { SampleCards, SampleCashFlow, SampleExpenses, SampleTransactions } from '../sample-data';
import { SettingsView } from '../settings-view';
import { TargetCard } from '../target-card';
import { TransactionExplorer } from '../transaction-explorer';

const GalleryPreviewRowCount = 4;
const SampleBalance = 124580.45;
const GalleryTabs = ['Dashboard', 'Transactions', 'Analytics', 'Budgets', 'Settings'];

function DashboardPreview({ onAction }: { onAction: (action: string) => void }) {
  return (
    <Columns>
      <Stack>
        <Grid>
          <MetricCard
            label="Monthly Income"
            value="$38,420"
            trend="+11.2%"
            detail="Since last month"
          />
          <MetricCard
            label="Monthly Expense"
            value="$24,910"
            trend="−5.3%"
            detail="Since last month"
            negative
          />
        </Grid>
        <CashFlowChart data={SampleCashFlow} />
        <TransactionExplorer transactions={SampleTransactions.slice(0, GalleryPreviewRowCount)} />
      </Stack>
      <Stack>
        <BalanceCard
          title="Total balance"
          label="USD"
          caption="Available to use"
          value={formatMajorAmount(SampleBalance)}
          actions={
            <>
              <Button variant="secondary" onClick={() => onAction('Send')}>
                Send ↗
              </Button>
              <Button variant="secondary" onClick={() => onAction('Received')}>
                Received ↙
              </Button>
            </>
          }
        />
        <PaymentCards
          cards={SampleCards}
          action={
            <Button variant="outline" size="sm" onClick={() => onAction('Add card')}>
              Add card
            </Button>
          }
        />
        <DistributionChart title="Budget" data={SampleExpenses.slice(0, GalleryPreviewRowCount)} />
        <PromotionPanel
          title="Upgrade to pro"
          description="A reusable promotional block matching the reference design."
          href="/test"
          actionLabel="Explore components"
        />
      </Stack>
    </Columns>
  );
}

function AnalyticsPreview() {
  return (
    <Stack>
      <Grid>
        <MetricCard
          label="Avg Monthly Income"
          value="$36,780"
          trend="+11.2%"
          detail="Based on last 6 months"
        />
        <MetricCard
          label="Avg Monthly Expense"
          value="$26,140"
          trend="−5.3%"
          detail="Based on last 6 months"
        />
        <MetricCard
          label="Average Savings Rate"
          value="28%"
          trend="+2.5%"
          detail="Based on last 6 months"
        />
      </Grid>
      <Columns>
        <Stack>
          <CashFlowChart data={SampleCashFlow} />
          <Grid>
            <Panel title="Budget" description="Monthly expense budget">
              <MetricCard label="Progress" value="$3,457" />
              <BudgetProgress spent={3457} limit={10000} />
            </Panel>
            <TargetCard value={4480} target={10000} />
          </Grid>
        </Stack>
        <DistributionChart data={SampleExpenses} />
      </Columns>
    </Stack>
  );
}

export function ComponentGallery() {
  const [action, setAction] = useState('');

  return (
    <Page>
      <PageHeading
        title="Component Gallery"
        description="Fundex-inspired blocks · SCSS modules · Radix accessibility"
      />
      <Notice>
        All values in this gallery are sample data. Preview actions do not create financial records.
      </Notice>
      <TabRoot defaultValue="Dashboard">
        <TabList aria-label="Reference pages">
          {GalleryTabs.map(tab => (
            <TabTrigger key={tab} value={tab}>
              {tab}
            </TabTrigger>
          ))}
        </TabList>
        <TabPanel value="Dashboard">
          <DashboardPreview onAction={setAction} />
        </TabPanel>
        <TabPanel value="Transactions">
          <TransactionExplorer transactions={SampleTransactions} />
        </TabPanel>
        <TabPanel value="Analytics">
          <AnalyticsPreview />
        </TabPanel>
        <TabPanel value="Budgets">
          <Panel title="Category budget (sample)">
            <BudgetProgress spent={2224} limit={5000} label="Food & Dining budget" />
            <Notice>
              Sample values. Real budgets live on the Budgets page and are compared with the ledger.
            </Notice>
          </Panel>
        </TabPanel>
        <TabPanel value="Settings">
          <SettingsView demo />
        </TabPanel>
      </TabRoot>
      <Dialog
        open={!!action}
        onOpenChange={open => {
          if (!open) setAction('');
        }}
      >
        <DialogContent>
          <DialogTitle>{action} — component preview</DialogTitle>
          <p>This demonstrates the dialog layout only. No banking service is connected.</p>
          <Field>
            {action === 'Add card' ? 'Card display name' : 'Description'}
            <Input placeholder="Preview text" />
          </Field>
          <Button onClick={() => setAction('')}>Close preview</Button>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
