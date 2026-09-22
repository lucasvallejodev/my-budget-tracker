'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2, Wand2 } from 'lucide-react';
import { Panel, EmptyState } from './blocks';
import { Button } from '../primitives/button';
import { Input } from '../primitives/input';
import CategoryPicker from '../category-picker';
import { FINANCE_KEYS, useRules } from './use-finance-data';
import { applyRulesAction, createRuleAction, deleteRuleAction } from '@/app/(main)/actions';
import s from './finance.module.scss';
import f from '../forms.module.scss';

export function RulesSettings() {
  const queryClient = useQueryClient();
  const rules = useRules();
  const [pattern, setPattern] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const refresh = () =>
    Promise.all(FINANCE_KEYS.map(key => queryClient.invalidateQueries({ queryKey: [key] })));
  const create = useMutation({
    mutationFn: () => createRuleAction({ pattern, categoryId: categoryId! }),
    onSuccess: async () => {
      toast.success('Rule added');
      setPattern('');
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: deleteRuleAction,
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });
  const apply = useMutation({
    mutationFn: applyRulesAction,
    onSuccess: async ({ updated }) => {
      toast.success(`Categorised ${updated} transaction${updated === 1 ? '' : 's'}`);
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <div className={s.stack}>
      <Panel
        title="New rule"
        description="When the payee, bank description or memo contains the text, the category is applied automatically on import."
      >
        <form
          className={f.form}
          onSubmit={event => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <label className={s.field}>
            Text to look for
            <Input
              value={pattern}
              placeholder="e.g. MERCADONA"
              onChange={event => setPattern(event.target.value)}
              maxLength={120}
            />
          </label>
          <div className={s.field}>
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
        {rules.isPending ? (
          <p role="status">Loading…</p>
        ) : !rules.data?.length ? (
          <EmptyState
            title="No rules yet"
            description="Rules run on every import and can be applied to existing entries."
          />
        ) : (
          rules.data.map(rule => (
            <div key={rule.id} className={s.row}>
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
        )}
      </Panel>
    </div>
  );
}
