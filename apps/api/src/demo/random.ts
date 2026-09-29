import { createHash } from 'node:crypto';

const HashAlgorithm = 'sha256';
const UINT32_RANGE = 0x1_00_00_00_00;

const randomFraction = (key: string): number =>
  createHash(HashAlgorithm).update(key).digest().readUInt32BE(0) / UINT32_RANGE;

export const randomInteger = (key: string, min: number, max: number): number =>
  min + Math.floor(randomFraction(key) * (max - min + 1));

export const randomChance = (key: string, probability: number): boolean =>
  randomFraction(key) < probability;

export const randomPick = <Item>(key: string, items: readonly Item[]): Item =>
  items[randomInteger(key, 0, items.length - 1)];
