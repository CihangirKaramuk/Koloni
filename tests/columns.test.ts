import { expect, it } from 'vitest';
import { getLevel } from '../src/level/levels';

it('grup sütunu sayısı piksel yoğunluğuna göre 3–5 arasında, üçü de görülür', () => {
  const count: Record<number, number> = {};
  for (let n = 1; n <= 300; n++) {
    const c = getLevel(n).spec.columns;
    expect(c).toBeGreaterThanOrEqual(3);
    expect(c).toBeLessThanOrEqual(5);
    count[c] = (count[c] ?? 0) + 1;
  }
  console.log('sütun dağılımı (300 bölüm):', JSON.stringify(count));
  expect(count[3]).toBeGreaterThan(0);
  expect(count[4]).toBeGreaterThan(0);
  expect(count[5]).toBeGreaterThan(0);
});
