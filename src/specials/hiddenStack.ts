import type { StackRule } from './types';

/** Gizli stack: sütunun önüne gelene kadar rengi "?" görünür. */
export const hiddenStack: StackRule = {
  id: 'hidden',
  onFront(s) {
    s.hidden = false;
  },
};
