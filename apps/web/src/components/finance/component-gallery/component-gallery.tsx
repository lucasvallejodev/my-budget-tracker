'use client';

import {
  Columns,
  Grid,
  Notice,
  Page,
  PageHeading,
  Panel,
  ProgressBar,
  Stack,
  TabList,
  TabPanel,
  TabRoot,
  TabTrigger,
} from '@/components/ui';
import { formatMajorAmount } from '@coinkeeper/shared/lib/money';

import { CashFlowChart } from '../cash-flow-chart';
import { MetricCard } from '../metric-card';
import { SampleCashFlow, SampleSpending, SampleTransactions } from '../sample-data';
import { SettingsView } from '../settings-view';
import { SpendingBars } from '../spending-bars';
import { TransactionExplorer } from '../transaction-explorer';

const GalleryPreviewRowCount = 4;
const GalleryVisibleGroups = 3;
const SampleMonth = '2026-09';
const GalleryTabs = ['Home', 'Transactions', 'Analytics', 'Budgets', 'Settings'];

function DashboardPreview() {
  return (
    <Columns>
      <Stack>
        <Grid>
          <MetricCard
            kind="income"
            label="Monthly Income"
            value="$38,420"
            trend="+11.2%"
            detail="Since last month"
          />
          <MetricCard
            kind="spending"
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
        <Panel title="Where your money went">
          <SpendingBars
            slices={SampleSpending}
            format={formatMajorAmount}
            month={SampleMonth}
            comparison="last month"
          />
        </Panel>
      </Stack>
    </Columns>
  );
}

function AnalyticsPreview() {
  return (
    <Stack>
      <Grid>
        <MetricCard
          kind="income"
          label="Avg Monthly Income"
          value="$36,780"
          trend="+11.2%"
          detail="Based on last 6 months"
        />
        <MetricCard
          kind="spending"
          label="Avg Monthly Expense"
          value="$26,140"
          trend="−5.3%"
          detail="Based on last 6 months"
        />
        <MetricCard
          kind="rate"
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
              <ProgressBar label="Sample budget" max={10000} value={3457} marker={8000} />
            </Panel>
          </Grid>
        </Stack>
        <Panel title="Top groups">
          <SpendingBars
            slices={SampleSpending}
            format={formatMajorAmount}
            month={SampleMonth}
            comparison="last month"
            visible={GalleryVisibleGroups}
          />
        </Panel>
      </Columns>
    </Stack>
  );
}

export function ComponentGallery() {
  return (
    <Page>
      <PageHeading
        title="Component Gallery"
        description="The building blocks of CoinKeeper with sample data."
      />
      <Notice>
        All values in this gallery are sample data. Preview actions do not create financial records.
      </Notice>
      <TabRoot defaultValue="Home">
        <TabList aria-label="Reference pages">
          {GalleryTabs.map(tab => (
            <TabTrigger key={tab} value={tab}>
              {tab}
            </TabTrigger>
          ))}
        </TabList>
        <TabPanel value="Home">
          <DashboardPreview />
        </TabPanel>
        <TabPanel value="Transactions">
          <TransactionExplorer transactions={SampleTransactions} />
        </TabPanel>
        <TabPanel value="Analytics">
          <AnalyticsPreview />
        </TabPanel>
        <TabPanel value="Budgets">
          <Panel title="Category budget (sample)">
            <ProgressBar label="Food & Dining budget" max={5000} value={2224} tone="warning" />
            <Notice>
              Sample values. Real budgets live on the Budgets page and are compared with the ledger.
            </Notice>
          </Panel>
        </TabPanel>
        <TabPanel value="Settings">
          <SettingsView demo />
        </TabPanel>
      </TabRoot>
    </Page>
  );
}
