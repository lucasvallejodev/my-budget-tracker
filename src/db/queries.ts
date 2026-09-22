import { getDb } from './index';
import { createRepository } from './repository';
export function getRepository() {
  return createRepository(getDb());
}
