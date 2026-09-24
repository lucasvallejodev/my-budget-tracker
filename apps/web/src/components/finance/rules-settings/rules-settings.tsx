'use client';

import { useMutation } from '@tanstack/react-query';
import { Trash2, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { applyRules, createRule, deleteRule } from '@/api/mutations';
import {
  Button,
  EmptyState,
  Field,
  FormStack,
  Input,
  ListRow,
  Panel,
  QueryContent,
  Stack,
} from '@/components/ui';

import { CategoryPicker } from '../category-picker';
import { useRefreshFinance, useRules } from '../use-finance-data';

const PatternMaxLength = 120;
const ActionIconSize = 16;

export function RulesSettings() {
  const refresh = useRefreshFinance();
  const rules = useRules();
  const [pattern, setPattern] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();

  const create = useMutation({
    mutationFn: () => createRule({ categoryId: categoryId!, pattern }),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success('Rule added');
      setPattern('');
      await refresh();
    },
  });

  const remove = useMutation({
    mutationFn: deleteRule,
    onError: (error: Error) => toast.error(error.message),
    onSuccess: refresh,
  });

  const apply = useMutation({
    mutationFn: applyRules,
    onError: (error: Error) => toast.error(error.message),
    onSuccess: async ({ updated }) => {
      toast.success(`Categorised ${updated} transaction${updated === 1 ? '' : 's'}`);
      await refresh();
    },
  });

  return (
    <Stack>
      <Panel
        title="New rule"
        description="When the payee, bank description or memo contains the text, the category is applied automatically on import."
      >
        <FormStack
          onSubmit={event => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <Field>
            Text to look for
            <Input
              value={pattern}
              placeholder="e.g. MERCADONA"
              onChange={event => setPattern(event.target.value)}
              maxLength={PatternMaxLength}
            />
          </Field>
          <Field as="div">
            Category
            <CategoryPicker value={categoryId} onChange={setCategoryId} />
          </Field>
          <Button type="submit" disabled={!pattern.trim() || !categoryId || create.isPending}>
            Add rule
          </Button>
        </FormStack>
      </Panel>
      <Panel
        title="Rules"
        action={
          <Button
            variant="outline"
            disabled={apply.isPending || !rules.data?.length}
            onClick={() => apply.mutate()}
          >
            <Wand2 size={ActionIconSize} /> Apply to uncategorized
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
              <ListRow
                key={rule.id}
                title={rule.name}
                description={`contains “${rule.pattern}” → ${rule.categoryName ?? 'archived category'}`}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete rule ${rule.name}`}
                  onClick={() => remove.mutate(rule.id)}
                >
                  <Trash2 size={ActionIconSize} />
                </Button>
              </ListRow>
            ))
          }
        </QueryContent>
      </Panel>
    </Stack>
  );
}
