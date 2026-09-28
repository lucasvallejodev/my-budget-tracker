> Summary: the eight component-API rules (boolean props, compound components, context shape, lifting state, explicit variants, children over render props, React 19 `ref` and `use`) rewritten for CoinKeeper: plain named exports instead of `Parent.Child`, visual variants through `…ClassNames`, context in a private file of the component folder.

# Component composition

Placement, folders, barrels and BEM are defined in [agents/components.md](../../../../agents/components.md); these rules only decide the shape of a component's API. Two house facts change the upstream advice:

- A look that varies is one `variant`/`tone`/`size` union prop mapped through a typed `…ClassNames` table (see `Button` in `apps/web/src/components/ui/button/`). That is not "boolean prop proliferation" and stays.
- Compound components are several plain named exports from one folder (`Dialog`, `DialogContent`, `DialogTitle`, `DialogFooter` in `ui/dialog`; `TabRoot`, `TabList`, `TabTrigger`, `TabPanel` in `ui/tabs`). Never attach parts as static properties (`Composer.Frame`): Next.js client boundaries and our barrels need names, and `structure.test.ts` checks the barrels.

## architecture-avoid-boolean-props

Booleans that switch behavior (`isEditing`, `isTransfer`, `isOpeningBalance`) multiply states and end in nested ternaries, which the house rules already forbid. Compose the difference instead: shared parts, one small component per case.

Avoid:

```tsx
<TransactionDialog isEditing isTransfer={false} showCategory showPayee={!isOpening} />
```

Prefer:

```tsx
<EditTransactionDialog transaction={transaction} />
<CreateTransferDialog accounts={accounts} />
```

Each of them composes shared pieces (`FormStack`, `AmountField`, `DateField`, `DialogFormFooter`) and owns only its own fields and mutation.

## architecture-compound-components

When a component has several optional regions that callers arrange, export the regions as named parts that share a context, instead of a monolith with `showX` and `renderX` props.

```
finance/budget-editor/
  budget-editor.tsx          BudgetEditor (provider), BudgetEditorAmount, BudgetEditorActions
  budget-editor-context.ts   the context and its type (private)
  budget-editor.test.tsx
  index.ts                   named exports of the three components
```

```tsx
<BudgetEditor budget={budget}>
  <BudgetEditorAmount />
  <BudgetEditorActions />
</BudgetEditor>
```

Parts that must be used inside the provider read the context with `use()` and throw a clear error when it is missing. Only export the parts callers compose; helpers stay private.

## state-context-interface

Give the context value one `type` with three members, so any provider can implement it and the parts do not care which one: `state` (values), `actions` (functions), `meta` (refs, ids).

```ts
type BudgetEditorContextValue = {
  actions: {
    save: () => void;
    setAmount: (amount: string) => void;
  };
  meta: {
    amountInputId: string;
  };
  state: {
    amount: string;
    isSaving: boolean;
  };
};

export const BudgetEditorContext = createContext<BudgetEditorContextValue | null>(null);
```

Amounts in form state are strings (the API parses them); never store a float.

## state-decouple-implementation

Only the provider knows where the state comes from: a TanStack Query hook, `useEntityMutation`, React Hook Form or local `useState`. The parts consume the interface, so the same parts work in a create dialog and an edit page.

```tsx
export function BudgetEditor({ budget, children }: { budget: BudgetRow; children: ReactNode }) {
  const [amount, setAmount] = useState(() =>
    minorToDecimalString(budget.amountMinor, budget.currency)
  );
  const amountInputId = useId();
  const save = useEntityMutation({
    mutationFn: upsertBudget,
    successMessage: 'Budget saved',
  });

  return (
    <BudgetEditorContext
      value={{
        actions: {
          save: () =>
            save.mutate({
              amount,
              categoryId: budget.categoryId,
              currency: budget.currency,
              month: budget.month,
            }),
          setAmount,
        },
        meta: { amountInputId },
        state: { amount, isSaving: save.isPending },
      }}
    >
      {children}
    </BudgetEditorContext>
  );
}
```

For forms, React Hook Form already is the lifted state: build on `ui/form` and `ui/form-fields` rather than a second context that mirrors field values.

## state-lift-state

When a sibling outside the component needs its state (a dialog footer button that submits, a preview beside the form), move the state into a provider that wraps both, instead of reaching in with refs or duplicating state.

Avoid:

```tsx
<DialogContent>
  <BudgetForm budget={budget} />
  <DialogFooter>
    <Button onClick={() => formRef.current?.submit()}>Save</Button>
  </DialogFooter>
</DialogContent>
```

Prefer:

```tsx
<BudgetEditor budget={budget}>
  <DialogContent>
    <BudgetEditorAmount />
    <DialogFooter>
      <BudgetEditorActions />
    </DialogFooter>
  </DialogContent>
</BudgetEditor>
```

## patterns-explicit-variants

When behavior differs, make an explicit component per case (`CreateAccountDialog` rather than `AccountDialog mode="create"`). When only the look differs, add a modifier to the existing component through its `…ClassNames` table; `agents/components.md` asks for a prop or modifier rather than a lookalike.

```tsx
const ToneClassNames: Record<BadgeTone, string> = {
  danger: 'badge--danger',
  neutral: 'badge--neutral',
  success: '',
  warning: 'badge--warning',
};

<span className={cn('badge', ToneClassNames[tone])} />;
```

## patterns-children-over-render-props

Compose with `children` and named parts, not `renderHeader` / `renderFooter` props. The exception is laziness: `QueryContent` takes `children: () => ReactNode` so the content is only built once the query has data. Keep that shape for loading gates; do not add render props for layout.

Avoid:

```tsx
<Panel renderAction={() => <Button>Add account</Button>} title="Accounts" />
```

Prefer:

```tsx
<Panel action={<Button>Add account</Button>} title="Accounts">
  <AccountList accounts={accounts} />
</Panel>
```

## react19-apis

React 19 changed three APIs; write new code the new way and migrate old code when you touch it.

- `ref` is a regular prop: no `forwardRef`. Type it as `ComponentProps<'input'>` or `{ ref?: Ref<HTMLInputElement> }`.
- `use(Context)` replaces `useContext(Context)` and may be called conditionally.
- Render the context itself as the provider: `<DialogLayer value={…}>` instead of `<DialogLayer.Provider value={…}>` (`ui/dialog/dialog.tsx` still uses the old form).

```tsx
export function AmountInput({ ref, ...props }: ComponentProps<'input'>) {
  return <input ref={ref} className="amount-input" inputMode="decimal" {...props} />;
}

const layer = use(DialogLayer);
```
