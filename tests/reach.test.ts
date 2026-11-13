import { describe, expect, it } from 'vitest';
import { Board } from '../src/core/board';

/** Basit tekrarlanabilir rastgele sayı üreteci. */
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ulaşılabilir hücreler ve her birinin giriş yolu uzunluğu. */
function snapshot(b: Board) {
  const out = new Map<number, number>();
  for (const [i, e] of b.exposures()) out.set(i, e.via < 0 ? 0 : b.chainToBorder(e.via).length);
  return out;
}

describe('ulaşılabilirlik', () => {
  it('lokma lokma güncellenen sonuç, baştan hesaplananla aynı', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const r = rng(seed);
      const W = 24;
      const H = 20;
      const cells = Array.from({ length: W * H }, () => ({ color: r() < 0.12 ? -1 : Math.floor(r() * 4) }));
      const live = new Board(W, H, cells);
      live.exposures();
      for (let step = 0; step < 300; step++) {
        const open = [...live.exposures().keys()];
        if (!open.length) break;
        const i = open[Math.floor(r() * open.length)];
        live.destroy(i % W, (i / W) | 0);
        // Ara sıra dışarıya bağlı olmayan bir hücre de silinsin (güçlerin yaptığı gibi).
        if (step % 7 === 0) {
          const j = Math.floor(r() * W * H);
          live.destroy(j % W, (j / W) | 0);
        }
        if (step % 25 === 0) {
          const fresh = new Board(W, H, live.cells.map((c) => ({ color: c.hp > 0 ? c.color : -1 })));
          expect(snapshot(live)).toEqual(snapshot(fresh));
        }
      }
    }
  });
});
