import type { StackRule } from './types';

/** Donmuş stack: üstündeki sayı kadar başka stack'e dokununca çözülür. */
export const frozenStack: StackRule = {
  id: 'frozen',
  canTap: (s) => !s.frozen || s.frozen <= 0,
  onOtherTapped(s) {
    if (s.frozen && s.frozen > 0) s.frozen--;
  },
};
