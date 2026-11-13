import type { CellRule, StackRule } from './types';
import { iceBlock } from './ice';
import { frozenStack } from './frozenStack';
import { hiddenStack } from './hiddenStack';

export type { CellRule, StackRule } from './types';

/** Kayıtlı özel bloklar. Yeni tür: dosyasını yaz, buraya ekle. */
export const cellRules: Record<string, CellRule> = {
  [iceBlock.id]: iceBlock,
};

/** Kayıtlı özel stack kuralları. */
export const stackRules: StackRule[] = [frozenStack, hiddenStack];

export function cellHp(special?: string): number {
  return special ? (cellRules[special]?.hp ?? 1) : 1;
}
