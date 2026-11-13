import { describe, expect, it } from 'vitest';
import { Board } from '../src/core/board';
import { Game } from '../src/core/game';
import { FOODS } from '../src/level/art/foods';
import { buildLevel } from '../src/level/generator';
import { getLevel, tierOf, MIN_ART_GAP, sizeStage } from '../src/level/levels';
import type { LevelData } from '../src/core/types';

/** Çözüm sırasıyla, ekransız oynar. */
function playSolution(n: number, given?: LevelData) {
  const level = given ?? buildLevel(getLevel(n).spec);
  const game = new Game(level);
  let i = 0;
  let steps = 0;
  while (game.status === 'playing' && steps < 200000) {
    const next = level.solution[i];
    if (next && game.front(next.column) && !game.canTap(next.column)) {
      game.tap(next.column);
      i++;
    } else {
      game.update(0.05);
    }
    steps++;
  }
  return { game, level };
}

describe('çizimler', () => {
  it.each(FOODS.map((f) => [f.id, f] as const))('%s satırları eşit uzunlukta', (_id, f) => {
    const w = f.rows[0].length;
    f.rows.forEach((r) => expect(r.length).toBe(w));
  });
});

describe('bölümler', () => {
  // İlk 40 bölüm + uzak bölümlerden örnekler (sonsuz üretim 1000. bölümde de çalışmalı).
  const ns = [...Array.from({ length: 40 }, (_, i) => i + 1), 100, 333, 500, 1000];

  it.each(ns)(
    'bölüm %i: karınca sayısı blok lokmalarına eşit ve çözüm sırasıyla kazanılır',
    (n) => {
      const level = buildLevel(getLevel(n).spec);
      const counter = new Game(level);
      const ants = new Map<number, number>();
      level.columns.flat().forEach((s) => ants.set(s.color, (ants.get(s.color) ?? 0) + s.count));
      for (const c of counter.board.colorsLeft()) expect(ants.get(c)).toBe(counter.board.hpOf(c));
      const { game } = playSolution(n, level);
      expect(game.status).toBe('won');
    },
    60000,
  );
});

describe('sonsuz bölüm düzeni', () => {
  it('zorluk oranları: en çok kolay, en az ekstra zor', () => {
    const count = { easy: 0, medium: 0, hard: 0, extreme: 0 };
    for (let n = 1; n <= 1000; n++) count[tierOf(n)]++;
    expect(count.easy).toBeGreaterThan(count.medium);
    expect(count.medium).toBeGreaterThan(count.hard);
    expect(count.hard).toBeGreaterThan(count.extreme);
    expect(count.extreme).toBeGreaterThan(10);
    for (let n = 2; n <= 1000; n++) expect(tierOf(n) === 'extreme' && tierOf(n - 1) === 'extreme').toBe(false);
  });

  it('bir resim, tüm resimler bitmeden tekrar etmez', () => {
    const P = FOODS.length;
    const ids: string[] = [];
    for (let n = 6; n < 6 + P * 4; n++) ids.push(getLevel(n).art.id);
    for (let c = 0; c < 4; c++) expect(new Set(ids.slice(c * P, (c + 1) * P)).size).toBe(P);
    for (let i = 1; i < ids.length; i++) expect(ids[i]).not.toBe(ids[i - 1]);
  });

  it('ilerleyen kademelerde resimler ortalama daha çok pikselle gelir', () => {
    const sums: number[] = [];
    const counts: number[] = [];
    for (let n = 1; n <= 600; n++) {
      const s = sizeStage(n);
      sums[s] = (sums[s] ?? 0) + getLevel(n).spec.art.join('').replace(/\./g, '').length;
      counts[s] = (counts[s] ?? 0) + 1;
    }
    const avg = sums.map((x, i) => x / counts[i]);
    for (let i = 1; i < avg.length; i++) expect(avg[i]).toBeGreaterThan(avg[i - 1]);
    expect(avg[avg.length - 1]).toBeGreaterThan(avg[0] * 2);
  });

  it('aynı resim en az MIN_ART_GAP bölüm sonra tekrar gelir', () => {
    const last = new Map<string, number>();
    let minGap = Infinity;
    for (let n = 1; n <= 1500; n++) {
      const id = getLevel(n).art.id;
      if (last.has(id)) minGap = Math.min(minGap, n - last.get(id)!);
      last.set(id, n);
    }
    expect(minGap).toBeGreaterThanOrEqual(MIN_ART_GAP);
  });
});

describe('kurallar', () => {
  it('ulaşılabilir yiyecek yoksa karınca slottan çıkmaz, kilitlenince kaybedilir', () => {
    // İç renk (Y) dış renk (W) yenmeden açığa çıkmaz.
    const level = buildLevel({ art: ['WWW', 'WYW', 'WWW'], slots: 1, columns: 2, maxStack: 8, seed: 1 });
    const game = new Game(level);
    const yCol = level.columns.findIndex((c) => c[0]?.color === game.board.get(1, 1).color);
    expect(yCol).toBeGreaterThanOrEqual(0);
    game.tap(yCol);
    for (let i = 0; i < 60; i++) game.update(1 / 30);
    expect(game.ants.length).toBe(0);
    expect(game.slots[0].stack?.remaining).toBe(1);
    expect(game.status).toBe('lost');
    // +1 slot ile devam edilebilir.
    expect(game.addSlot()).toBe(true);
    expect(game.status).toBe('playing');
  });

  it('parmak: seçilen renkteki tüm pikseller yok olur, o rengin grupları çekilir', () => {
    const level = buildLevel({ art: ['RRG', 'RGG', 'RRG'], slots: 3, columns: 2, maxStack: 8, seed: 3 });
    const game = new Game(level);
    const red = game.board.get(0, 0).color;
    expect(game.wipeColor(red)).toBe(5);
    game.update(1 / 30);
    expect(game.board.hpOf(red)).toBe(0);
    expect(game.columns.flat().some((s) => s.color === red)).toBe(false);
  });

  it('havan topu mermisi: vurduğu piksel yok olur', () => {
    const level = buildLevel({ art: ['RRR', 'RRR'], slots: 3, columns: 1, maxStack: 8, seed: 3 });
    const game = new Game(level);
    expect(game.blastCell(1, 1)).toBe(true);
    expect(game.board.isSolid(1, 1)).toBe(false);
    expect(game.blastCell(1, 1)).toBe(false);
  });

  it('gökkuşağı yuvası: her renkten piksel alır', () => {
    const level = buildLevel({ art: ['RG', 'BY'], slots: 3, columns: 1, maxStack: 8, seed: 3 });
    const game = new Game(level);
    expect(game.addRainbow(4)).toBe(true);
    for (let i = 0; i < 400 && game.status === 'playing'; i++) game.update(0.05);
    expect(game.status).toBe('won');
  });
});

describe('ulaşma kuralı', () => {
  const make = (rows: string[]) => {
    const W = rows[0].length;
    const cells = rows.join('').split('').map((ch) => ({ color: ch === '.' ? -1 : ch === 'G' ? 3 : 0 }));
    return new Board(W, rows.length, cells);
  };

  it('dışarıya açılan bir boşluğun yanındaki iç piksel alınabilir', () => {
    // G'nin solundaki boşluk, alttaki açıklıkla dışarıya bağlı.
    const b = make(['RRRRR', 'R.GRR', 'R.RRR']);
    const g = b.claimable(3);
    expect(g.length).toBe(1);
    expect(g[0].via).toBeGreaterThanOrEqual(0);
  });

  it('dört yanı kapalı bir boşluğun yanındaki piksel alınamaz', () => {
    const b = make(['RRRRR', 'R.GRR', 'RRRRR']);
    expect(b.claimable(3).length).toBe(0);
  });
});
