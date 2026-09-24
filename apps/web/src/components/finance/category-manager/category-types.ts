import type { CategoryTree } from '../use-finance-data';

export type Group = CategoryTree;
export type Category = CategoryTree['categories'][number];
export type GroupKind = Group['kind'];
