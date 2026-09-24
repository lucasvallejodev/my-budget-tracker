import type { Db } from '../db';
import { createPayeeService } from '../payees/service';
import { get, list, needsReviewCount } from './queries';
import { createStandard, remove, setStatus, updateStandard } from './standard';
import { createTransfer, linkAsTransfer, updateTransfer } from './transfers';
import type { ListFilters, StandardInput, TransactionRow, TransferInput } from './types';

export type { ListFilters, StandardInput, TransactionRow, TransferInput } from './types';

export { monthRange } from './queries';

export const createLedgerService = (db: Db) => {
  const context = { db, payeeService: createPayeeService(db) };

  return {
    createStandard: (userId: string, input: StandardInput) =>
      createStandard(context, userId, input),
    createTransfer: (userId: string, input: TransferInput) => createTransfer(db, userId, input),
    get: (userId: string, id: string) => get(db, userId, id),
    linkAsTransfer: (userId: string, outId: string, inId: string) =>
      linkAsTransfer(db, userId, outId, inId),
    list: (userId: string, filters: ListFilters = {}) => list(db, userId, filters),
    needsReviewCount: (userId: string) => needsReviewCount(db, userId),
    remove: (userId: string, id: string) => remove(db, userId, id),
    setStatus: (userId: string, id: string, status: TransactionRow['status']) =>
      setStatus(db, userId, id, status),
    updateStandard: (userId: string, id: string, input: Partial<StandardInput>) =>
      updateStandard(context, userId, id, input),
    updateTransfer: (userId: string, transferId: string, input: Partial<TransferInput>) =>
      updateTransfer(db, userId, transferId, input),
  };
};
