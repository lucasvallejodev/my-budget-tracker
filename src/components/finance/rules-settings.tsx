'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { applyRulesAction, createRuleAction, deleteRuleAction } from '@/app/(main)/actions';

import CategoryPicker from '../category-picker';
import formStyles from '../forms.module.scss';
import { Button } from '../primitives/button';
import { Input } from '../primitives/input';
import { EmptyState, Panel, QueryContent } from './blocks';
import styles from './finance.module.scss';
import { FinanceKeys, useRules } from './use-finance-data';

export function RulesSettings() {
  const queryClient = useQueryClient();
  const rules = useRules();
  const [pattern, setPattern] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();

  const refresh = () =>
    Promise.all(FinanceKeys.map(key => queryClient.invalidateQueries({ queryKey: [key] })));

  const create = useMutation({
    mutationFn: () => createRuleAction({ categoryId: categoryId!, pattern }),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success('Rule added');
      setPattern('');
      await refresh();
    },
  });

  const remove = useMutation({
    mutationFn: deleteRuleAction,
    onError: (error: Error) => toast.error(error.message),
    onSuccess: refresh,
  });

  const apply = useMutation({
    mutationFn: applyRulesAction,
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async ({ updated }) => {
      toast.success(`Categorised ${updated} transaction${updated === 1 ? '' : 's'}`);
      await refresh();
    },
  });

  return (
    <div className={styles.stack}>
      <Panel
        title="New rule"
        description="When the payee, bank description or memo contains the text, the category is applied automatically on import."
      >
        <form
          className={formStyles.form}
          onSubmit={event => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <label className={styles.field}>
            Text to look for
            <Input
              value={pattern}
              placeholder="e.g. MERCADONA"
              onChange={event => setPattern(event.target.value)}
              maxLength={120}
            />
          </label>
          <div className={styles.field}>
            Category
            <CategoryPicker value={categoryId} onChange={setCategoryId} />
          </div>
          <Button type="submit" disabled={!pattern.trim() || !categoryId || create.isPending}>
            Add rule
          </Button>
        </form>
      </Panel>
      <Panel
        title="Rules"
        action={
          <Button
            variant="outline"
            disabled={apply.isPending || !rules.data?.length}
            onClick={() => apply.mutate()}
          >
            <Wand2 size={16} /> Apply to uncategorized
          </Button>
        }
      >
        <QueryContent
          pending={rules.isPending}
          loading="Loading…"
          empty={
            !rules.data?.length && (
              <EmptyState
                title="No rules yet"
                description="Rules run on every import and can be applied to existing entries."
              />
            )
          }
        >
          {() =>
            rules.data?.map(rule => (
              <div key={rule.id} className={styles.row}>
                <div>
                  <h3>{rule.name}</h3>
                  <p>
                    contains “{rule.pattern}” → {rule.categoryName ?? 'archived category'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete rule ${rule.name}`}
                  onClick={() => remove.mutate(rule.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))
          }
        </QueryContent>
      </Panel>
    </div>
  );
}
