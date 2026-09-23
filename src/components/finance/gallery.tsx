'use client';

import { useState } from 'react';
import {
  PageHeading,
  MetricCard,
  BalanceCard,
  Panel,
  BudgetProgress,
  PromotionPanel,
} from './blocks';
import { CashFlowChart, DistributionChart, TargetCard } from './charts';
import { PaymentCards } from './payment-cards';
import { TransactionExplorer } from './transaction-explorer';
import { SettingsView } from './settings';
import { SampleCards, SampleCashFlow, SampleExpenses, SampleTransactions } from './sample-data';
import { Button } from '../primitives/button';
import { TabRoot, TabList, TabTrigger, TabPanel } from '../primitives/preferences';
import { Dialog, DialogContent, DialogTitle } from '../primitives/dialog';
import { Input } from '../primitives/input';
import s from './finance.module.scss';

export function ComponentGallery() {
  const [action, setAction] = useState('');

  return (
    <div className={s.page}>
      <PageHeading
        title="Component Gallery"
        description="Fundex-inspired blocks · SCSS modules · Radix accessibility"
      />
      <p className={s.notice}>
        All values in this gallery are sample data. Preview actions do not create financial records.
      </p>
      <TabRoot defaultValue="Dashboard">
        <TabList aria-label="Reference pages">
          {['Dashboard', 'Transactions', 'Analytics', 'Budgets', 'Settings'].map(tab => (
            <TabTrigger key={tab} value={tab}>
              {tab}
            </TabTrigger>
          ))}
        </TabList>
        <TabPanel value="Dashboard">
          <div className={s.columns}>
            <div className={s.stack}>
              <div className={s.grid}>
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
              </div>
              <CashFlowChart data={SampleCashFlow} />
              <TransactionExplorer transactions={SampleTransactions.slice(0, 4)} />
            </div>
            <div className={s.stack}>
              <BalanceCard
                amount={124580.45}
                actions={
                  <>
                    <Button variant="secondary" onClick={() => setAction('Send')}>
                      Send ↗
                    </Button>
                    <Button variant="secondary" onClick={() => setAction('Received')}>
                      Received ↙
                    </Button>
                  </>
                }
              />
              <PaymentCards
                cards={SampleCards}
                action={
                  <Button variant="outline" size="sm" onClick={() => setAction('Add card')}>
                    Add card
                  </Button>
                }
              />
              <DistributionChart title="Budget" data={SampleExpenses.slice(0, 4)} />
              <PromotionPanel
                title="Upgrade to pro"
                description="A reusable promotional block matching the reference design."
                href="/test"
                actionLabel="Explore components"
              />
            </div>
          </div>
        </TabPanel>
        <TabPanel value="Transactions">
          <TransactionExplorer transactions={SampleTransactions} />
        </TabPanel>
        <TabPanel value="Analytics">
          <div className={s.stack}>
            <div className={s.grid}>
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
            </div>
            <div className={s.columns}>
              <div className={s.stack}>
                <CashFlowChart data={SampleCashFlow} />
                <div className={s.grid}>
                  <Panel title="Budget" description="Monthly expense budget">
                    <MetricCard label="Progress" value="$3,457" />
                    <BudgetProgress spent={3457} limit={10000} />
                  </Panel>
                  <TargetCard value={4480} target={10000} />
                </div>
              </div>
              <DistributionChart data={SampleExpenses} />
            </div>
          </div>
        </TabPanel>
        <TabPanel value="Budgets">
          <Panel title="Category budget (sample)">
            <BudgetProgress spent={2224} limit={5000} label="Food & Dining budget" />
            <p className={s.notice}>
              Sample values. Real budgets live on the Budgets page and are compared with the ledger.
            </p>
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
          <label className={s.field}>
            {action === 'Add card' ? 'Card display name' : 'Description'}
            <Input placeholder="Preview text" />
          </label>
          <Button onClick={() => setAction('')}>Close preview</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
