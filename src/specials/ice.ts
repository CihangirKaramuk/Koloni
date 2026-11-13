import type { CellRule } from './types';

/** Buzlu blok: iki lokmada biter; ilk lokma buzu kırar. */
export const iceBlock: CellRule = {
  id: 'ice',
  hp: 2,
  onBite(cell) {
    cell.special = undefined;
  },
};
