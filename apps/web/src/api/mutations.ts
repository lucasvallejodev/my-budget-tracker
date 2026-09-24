import type {
  AccountFormValues,
  AccountPatchValues,
  AccountSummary,
} from '@coinkeeper/shared/schema/accounts';
import type {
  ChangePasswordValues,
  SignInValues,
  SignUpValues,
  UpdateProfileValues,
  User,
} from '@coinkeeper/shared/schema/auth';
import type { BudgetFormValues, BudgetRow } from '@coinkeeper/shared/schema/budgets';
import type {
  Category,
  CategoryFormValues,
  CategoryGroup,
  CategoryGroupFormValues,
} from '@coinkeeper/shared/schema/categories';
import type {
  ExchangeRateFormValues,
  ExchangeRateKey,
  ExchangeRateRow,
} from '@coinkeeper/shared/schema/exchange-rates';
import type { ColumnMapping, ImportCommitResult, Preview } from '@coinkeeper/shared/schema/imports';
import type { PayeeFormValues, PayeePatchValues, PayeeRow } from '@coinkeeper/shared/schema/payees';
import type { RuleFormValues, RuleRow } from '@coinkeeper/shared/schema/rules';
import type { SettingsFormValues, UserSettings } from '@coinkeeper/shared/schema/settings';
import type {
  StandardTransactionValues,
  TransactionRow,
  Transfer,
  TransferValues,
} from '@coinkeeper/shared/schema/transaction';

import { apiRequest } from './client';

type TransactionReference = Pick<TransactionRow, 'id' | 'transferId'>;

const rateKeyPath = ({ base, date, quote }: ExchangeRateKey) =>
  `/exchange-rates/${base}/${quote}/${date}`;

export const signIn = (values: SignInValues) => apiRequest<User>('POST', '/auth/sign-in', values);

export const signUp = (values: SignUpValues) => apiRequest<User>('POST', '/auth/sign-up', values);

export const signOut = () => apiRequest<void>('POST', '/auth/sign-out');

export const updateProfile = (values: UpdateProfileValues) =>
  apiRequest<User>('PATCH', '/me', values);

export const changePassword = (values: ChangePasswordValues) =>
  apiRequest<void>('PUT', '/me/password', values);

export const revokeSession = (id: string) => apiRequest<void>('DELETE', `/me/sessions/${id}`);

export const createAccount = (values: AccountFormValues) =>
  apiRequest<AccountSummary>('POST', '/accounts', values);

export const updateAccount = (id: string, values: AccountPatchValues) =>
  apiRequest<AccountSummary>('PATCH', `/accounts/${id}`, values);

export const setAccountArchived = (id: string, archived: boolean) =>
  apiRequest<AccountSummary>('POST', `/accounts/${id}/${archived ? 'archive' : 'unarchive'}`);

export const restoreAccount = (id: string) =>
  apiRequest<AccountSummary>('POST', `/accounts/${id}/restore`);

export const createPayee = (values: PayeeFormValues) =>
  apiRequest<PayeeRow>('POST', '/payees', values);

export const updatePayee = (id: string, values: PayeePatchValues) =>
  apiRequest<PayeeRow>('PATCH', `/payees/${id}`, values);

export const createTransaction = (values: StandardTransactionValues) =>
  apiRequest<TransactionRow>('POST', '/transactions', values);

export const updateTransaction = (id: string, values: StandardTransactionValues) =>
  apiRequest<TransactionRow>('PATCH', `/transactions/${id}`, {
    ...values,
    categoryId: values.categoryId ?? '',
    payeeId: values.payeeId ?? '',
  });

export const categorizeTransaction = (id: string, categoryId: string | null) =>
  apiRequest<TransactionRow>('PATCH', `/transactions/${id}`, {
    categoryId: categoryId ?? '',
    needsReview: false,
  });

export const deleteTransaction = ({ id, transferId }: TransactionReference) =>
  transferId
    ? apiRequest<void>('DELETE', `/transfers/${transferId}`)
    : apiRequest<void>('DELETE', `/transactions/${id}`);

export const restoreTransaction = ({ id, transferId }: TransactionReference) =>
  transferId
    ? apiRequest<Transfer>('POST', `/transfers/${transferId}/restore`)
    : apiRequest<TransactionRow>('POST', `/transactions/${id}/restore`);

export const createTransfer = (values: TransferValues) =>
  apiRequest<Transfer>('POST', '/transfers', values);

export const updateTransfer = (transferId: string, values: TransferValues) =>
  apiRequest<Transfer>('PUT', `/transfers/${transferId}`, values);

export const linkTransfer = (outTransactionId: string, inTransactionId: string) =>
  apiRequest<Transfer>('POST', '/transfers/link', { inTransactionId, outTransactionId });

export const createCategoryGroup = (values: CategoryGroupFormValues) =>
  apiRequest<CategoryGroup>('POST', '/category-groups', values);

export const updateCategoryGroup = (id: string, values: Partial<CategoryGroupFormValues>) =>
  apiRequest<CategoryGroup>('PATCH', `/category-groups/${id}`, values);

export const archiveCategoryGroup = (id: string) =>
  apiRequest<void>('POST', `/category-groups/${id}/archive`);

export const reorderCategoryGroups = (ids: string[]) =>
  apiRequest<void>('PUT', '/category-groups/order', { ids });

export const createCategory = (values: CategoryFormValues) =>
  apiRequest<Category>('POST', '/categories', values);

export const updateCategory = (id: string, values: Partial<CategoryFormValues>) =>
  apiRequest<Category>('PATCH', `/categories/${id}`, values);

export const reorderCategories = (groupId: string, ids: string[]) =>
  apiRequest<void>('PUT', `/category-groups/${groupId}/categories/order`, { ids });

export const archiveCategory = (id: string, moveToId?: string) =>
  apiRequest<void>('POST', `/categories/${id}/archive`, moveToId ? { moveToId } : {});

export const unarchiveCategory = (id: string) =>
  apiRequest<Category>('POST', `/categories/${id}/unarchive`);

export const updateSettings = (values: SettingsFormValues) =>
  apiRequest<UserSettings>('PATCH', '/settings', values);

export const upsertExchangeRate = ({ rate, ...key }: ExchangeRateFormValues) =>
  apiRequest<ExchangeRateRow>('PUT', rateKeyPath(key), { rate });

export const deleteExchangeRate = (key: ExchangeRateKey) =>
  apiRequest<void>('DELETE', rateKeyPath(key));

export const restoreExchangeRate = (key: ExchangeRateKey) =>
  apiRequest<ExchangeRateRow>('POST', `${rateKeyPath(key)}/restore`);

export const createRule = (values: RuleFormValues) => apiRequest<RuleRow>('POST', '/rules', values);

export const deleteRule = (id: string) => apiRequest<void>('DELETE', `/rules/${id}`);

export const restoreRule = (id: string) => apiRequest<RuleRow>('POST', `/rules/${id}/restore`);

export const applyRules = () => apiRequest<{ updated: number }>('POST', '/rules/apply');

export const previewImport = (input: { accountId: string; csv: string; mapping: ColumnMapping }) =>
  apiRequest<Preview>('POST', '/imports/preview', input);

export const commitImport = (preview: Preview) =>
  apiRequest<ImportCommitResult>('POST', '/imports', preview);

export const upsertBudget = ({ amount, categoryId, currency, month }: BudgetFormValues) =>
  apiRequest<BudgetRow>('PUT', `/budgets/${month}/${categoryId}/${currency}`, { amount });

export const deleteBudget = (id: string) => apiRequest<void>('DELETE', `/budgets/${id}`);

export const copyBudgets = (month: string) =>
  apiRequest<{ copied: number }>('POST', '/budgets/copy-previous-month', { month });
