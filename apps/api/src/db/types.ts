import type {
  accounts,
  budgets,
  categories,
  categoryGroups,
  currencies,
  exchangeRates,
  payees,
  recurringSeries,
  rules,
  transactions,
  transactionSplits,
  transactionTemplates,
  userSettings,
} from './schema';

export type Currency = typeof currencies.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type CategoryGroup = typeof categoryGroups.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Payee = typeof payees.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type Rule = typeof rules.$inferSelect;
export type TransactionTemplate = typeof transactionTemplates.$inferSelect;
export type TransactionSplit = typeof transactionSplits.$inferSelect;
export type RecurringSeries = typeof recurringSeries.$inferSelect;
