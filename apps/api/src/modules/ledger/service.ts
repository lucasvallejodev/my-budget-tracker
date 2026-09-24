import type { Db } from '../db';
import { createPayeeService } from '../payees/service';
import { get, list, needsReviewCount, page } from './queries';
import { createStandard, remove, restore, updateStandard } from './standard';
import {
  createTransfer,
  getTransfer,
  linkAsTransfer,
  patchTransfer,
  removeTransfer,
  restoreTransfer,
  updateTransfer,
} from './transfers';
import type { ListFilters, StandardInput, TransferInput, TransferPatch } from './types';

export type {
  ListFilters,
  StandardInput,
  TransactionRow,
  Transfer,
  TransferInput,
  TransferPatch,
} from './types';

export { monthRange } from './queries';

export const createLedgerService = (db: Db) => {
  const context = { db, payeeService: createPayeeService(db) };

  return {
    createStandard: (userId: string, input: StandardInput) =>
      createStandard(context, userId, input),
    createTransfer: (userId: string, input: TransferInput) => createTransfer(db, userId, input),
    get: (userId: string, id: string, options?: { includeDeleted?: boolean }) =>
      get(db, userId, id, options),
    getTransfer: (userId: string, transferId: string) => getTransfer(db, userId, transferId),
    linkAsTransfer: (userId: string, outId: string, inId: string) =>
      linkAsTransfer(db, userId, outId, inId),
    list: (userId: string, filters: ListFilters = {}) => list(db, userId, filters),
    needsReviewCount: (userId: string) => needsReviewCount(db, userId),
    page: (userId: string, filters: ListFilters = {}) => page(db, userId, filters),
    patchTransfer: (userId: string, transferId: string, input: TransferPatch) =>
      patchTransfer(db, userId, transferId, input),
    remove: (userId: string, id: string) => remove(db, userId, id),
    removeTransfer: (userId: string, transferId: string) => removeTransfer(db, userId, transferId),
    restore: (userId: string, id: string) => restore(db, userId, id),
    restoreTransfer: (userId: string, transferId: string) =>
      restoreTransfer(db, userId, transferId),
    updateStandard: (userId: string, id: string, input: Partial<StandardInput>) =>
      updateStandard(context, userId, id, input),
    updateTransfer: (userId: string, transferId: string, input: Partial<TransferInput>) =>
      updateTransfer(db, userId, transferId, input),
  };
};
