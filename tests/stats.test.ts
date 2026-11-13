import { it } from 'vitest';
import { buildLevel } from '../src/level/generator';
import { getLevel } from '../src/level/levels';

it('bölüm istatistikleri', () => {
  const rows: string[] = [];
  for (let n = 1; n <= 20; n++) {
    const t0 = performance.now();
    const lv = buildLevel(getLevel(n).spec);
    const ms = performance.now() - t0;
    const seq = lv.solution.length;
    const fronts = lv.columns.map((c) => c[0]?.color);
    rows.push(`#${n} ${lv.width}x${lv.height} stacks=${seq} fronts=${fronts.join(',')} ${ms.toFixed(0)}ms`);
  }
  console.log(rows.join('\n'));
}, 60000);
