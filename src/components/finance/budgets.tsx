'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import {
  PageHeading,
  MetricCard,
  Panel,
  CategoryBudget,
  BudgetInsights,
  EmptyState,
  money,
} from './blocks';
import { DistributionChart } from './charts';
import { Button } from '../primitives/button';
import { Dialog, DialogContent, DialogTitle } from '../primitives/dialog';
import { Input } from '../primitives/input';
import s from './finance.module.scss';
type Budget = { id: string; name: string; limit: number; spent: number };
export const sampleBudgets: Budget[] = [
  { id: 'food', name: 'Food & Dining', limit: 5000, spent: 2224 },
  { id: 'transport', name: 'Transport', limit: 1000, spent: 820 },
  { id: 'rent', name: 'House Rent', limit: 1500, spent: 2300 },
];
export function BudgetOverview({ demo = false }: { demo?: boolean }) {
  const [budgets, setBudgets] = useState<Budget[]>(demo ? sampleBudgets : []);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState<Budget | null>(null);
  const limit = budgets.reduce((n, b) => n + b.limit, 0);
  const spent = budgets.reduce((n, b) => n + b.spent, 0);
  return (
    <div className={s.page}>
      <PageHeading
        title="Budgets"
        description="Plan your spending and keep your goals in sight."
        actions={
          <Button onClick={() => setEditing({ id: '', name: '', limit: 0, spent: 0 })}>
            <Plus />
            Add Budget
          </Button>
        }
      />
      <p className={s.notice}>
        {demo
          ? 'Component preview — sample budgets.'
          : 'Budget planner preview. Changes last for this visit only; budget storage is not connected yet.'}
      </p>
      <div className={s.grid}>
        <MetricCard label="Total Monthly Budget" value={money(limit)} />
        <MetricCard label="Spent So Far" value={money(spent)} />
        <MetricCard label="Remaining" value={money(limit - spent)} />
        <MetricCard
          label="Budget Status"
          value={limit ? `${Math.round((spent / limit) * 100)}% used` : '—'}
        />
      </div>
      <div className={s.columns}>
        <Panel title="Category Budgets">
          <div className={s.stack}>
            {budgets.length ? (
              budgets.map(b => (
                <CategoryBudget
                  key={b.id}
                  {...b}
                  actions={
                    <>
                      <Button variant="outline" size="sm" onClick={() => setEditing({ ...b })}>
                        Edit
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/transactions?q=${encodeURIComponent(b.name)}`}>
                          View Transactions
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setBudgets(all =>
                            all.map(row => (row.id === b.id ? { ...row, spent: 0 } : row))
                          )
                        }
                      >
                        Reset
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleting(b)}>
                        Delete
                      </Button>
                    </>
                  }
                />
              ))
            ) : (
              <EmptyState
                title="Plan your first budget"
                description="Add a category and a monthly spending limit."
              />
            )}
          </div>
        </Panel>
        <div className={s.stack}>
          <DistributionChart
            title="Monthly Budget Progress"
            data={[
              { name: 'Spent', value: spent },
              { name: 'Available', value: Math.max(0, limit - spent) },
            ]}
          />
          <BudgetInsights
            insights={
              budgets.length
                ? [
                    `${budgets.filter(b => b.spent <= b.limit).length} of ${budgets.length} categories are within limits`,
                    ...budgets
                      .filter(b => b.spent > b.limit)
                      .map(b => `${b.name} exceeded its budget by ${money(b.spent - b.limit)}`),
                  ]
                : ['Add a budget to start exploring your plan.']
            }
          />
        </div>
      </div>
      <Dialog
        open={!!editing}
        onOpenChange={open => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogTitle>{editing?.id ? 'Edit budget' : 'Add budget'}</DialogTitle>
          {editing && (
            <form
              className={s.form}
              onSubmit={e => {
                e.preventDefault();
                if (!editing.name.trim() || editing.limit <= 0) return;
                const budget = { ...editing, id: editing.id || crypto.randomUUID() };
                setBudgets(all =>
                  all.some(b => b.id === budget.id)
                    ? all.map(b => (b.id === budget.id ? budget : b))
                    : [...all, budget]
                );
                setEditing(null);
              }}
            >
              <label className={s.field}>
                Category name
                <Input
                  required
                  value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                />
              </label>
              <label className={s.field}>
                Monthly limit
                <Input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editing.limit || ''}
                  onChange={e => setEditing({ ...editing, limit: Number(e.target.value) })}
                />
              </label>
              <label className={s.field}>
                Spent (planning estimate)
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editing.spent}
                  onChange={e => setEditing({ ...editing, spent: Number(e.target.value) })}
                />
              </label>
              <Button type="submit">Save budget</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleting}
        onOpenChange={open => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Delete {deleting?.name}?</DialogTitle>
          <p>This removes this budget from the current planning session.</p>
          <div className={s.actions}>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setBudgets(all => all.filter(b => b.id !== deleting?.id));
                setDeleting(null);
              }}
            >
              Delete budget
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
