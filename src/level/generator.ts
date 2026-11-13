import { Board } from '../core/board';
import { Game } from '../core/game';
import { Rng } from '../core/rng';
import type { ColorId, LevelData, LevelSpec, StackDef } from '../core/types';
import { CHAR_TO_COLOR } from './palette';

/** Çizim satırlarını (ölçekleyerek) hücre listesine çevirir. */
export function parseArt(rows: string[], scale = 1): { width: number; height: number; colors: ColorId[] } {
  const w0 = Math.max(...rows.map((r) => r.length));
  const width = w0 * scale;
  const height = rows.length * scale;
  const colors: ColorId[] = new Array(width * height).fill(-1);
  rows.forEach((row, y0) => {
    for (let x0 = 0; x0 < w0; x0++) {
      const ch = row[x0] ?? '.';
      if (ch === '.' || ch === ' ') continue;
      const id = CHAR_TO_COLOR[ch];
      if (id === undefined) throw new Error(`Bilinmeyen renk karakteri: "${ch}"`);
      for (let dy = 0; dy < scale; dy++)
        for (let dx = 0; dx < scale; dx++) colors[(y0 * scale + dy) * width + x0 * scale + dx] = id;
    }
  });
  return { width, height, colors };
}

/**
 * Bölüm üretici.
 *
 * Fikir: tahtayı dışarıdan içeri "soyarak" çözülebilir bir yeme sırası buluruz.
 * Her adımda açıkta bloğu olan bir renk seçilir ve o rengin dışarıdan ulaşılabilen
 * tüm blokları (açıldıkça açılanlar dahil) bir "koşu" olarak yenir. Koşular
 * stack'lere bölünür ve sırası bozulmadan sütunlara dağıtılır. Bu sırayla oynayan
 * tek slotla bile kazanır; oyuncu ise doğru sırayı sütunların önünden bulmalıdır.
 */
export function buildLevel(spec: LevelSpec): LevelData {
  // Önce "dalga" modu (renkler daha sık değişir, daha düşündürücü), sonra daha güvenli
  // "tam koşu" modu. Her deneme ekransız oynanarak doğrulanır: karıncaların farklı hedef
  // seçimleri ve farklı oyun hızlarıyla da çözülebilmeli.
  // Son ikisi hızlı karıncalarla: telefonda küçük hücrelerde karınca hızı artırılır.
  const runs: [number, number, number?][] = [[1, 0.1], [2, 0.1], [3, 0.1], [1, 0.05], [4, 0.1, 2], [5, 0.05, 3]];
  const ok = (level: LevelData) => runs.every(([s, dt, pace]) => verifyLevel(level, s, dt, pace));
  for (const mode of ['wave', 'closure'] as const) {
    for (let attempt = 0; attempt < (mode === 'wave' ? 10 : 6); attempt++) {
      const level = generate(spec, spec.seed + attempt * 101, mode);
      if (ok(level)) return level;
    }
  }
  // Hiçbiri doğrulanamadıysa çözülemeyen bölüm verme: bir slot ekleyip yeniden dene.
  if (spec.slots < 7) return buildLevel({ ...spec, slots: spec.slots + 1 });
  return generate(spec, spec.seed, 'closure');
}

/** Çözüm sırasıyla oynanınca kazanılıyor mu? (Oyunun kendi kurallarıyla.) */
export function verifyLevel(level: LevelData, seed: number, dt = 0.1, pace?: number): boolean {
  const game = new Game(level, {}, seed);
  if (pace) game.setPace(pace);
  let i = 0;
  for (let steps = 0; steps < 60000 && game.status === 'playing'; steps++) {
    const next = level.solution[i];
    if (next && game.front(next.column) && !game.canTap(next.column)) {
      game.tap(next.column);
      i++;
    } else game.update(dt);
  }
  return game.status === 'won';
}

function generate(spec: LevelSpec, seed: number, mode: 'wave' | 'closure'): LevelData {
  const rng = new Rng(seed);
  const { width, height, colors } = parseArt(spec.art, spec.scale ?? 1);

  const cells = colors.map((color) => ({ color, special: undefined as string | undefined }));
  if (spec.ice) {
    const solid = cells.map((c, i) => (c.color >= 0 ? i : -1)).filter((i) => i >= 0);
    rng.shuffle(solid);
    solid.slice(0, Math.round(solid.length * spec.ice)).forEach((i) => (cells[i].special = 'ice'));
  }

  // 1) Soyma: renk koşularını bul.
  const sim = new Board(width, height, cells);
  const runs: { color: ColorId; count: number }[] = [];
  const minRun = Math.max(4, Math.round(spec.maxStack * 0.45));
  let lastColor = -1;
  while (sim.totalHp() > 0) {
    const options = sim.colorsLeft().filter((c) => sim.claimable(c).length > 0);
    if (options.length === 0) throw new Error('Çözülemeyen çizim (olmamalı)');
    // Az önce yenen rengi tekrar seçmemeye çalış; çeşitlilik için rastgele.
    const pool = options.length > 1 ? options.filter((c) => c !== lastColor) : options;
    const color = rng.pick(pool);
    let count = 0;
    for (;;) {
      const seen = new Set<number>();
      const targets = sim.claimable(color).filter((e) => {
        const k = sim.idx(e.x, e.y);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      if (targets.length === 0) break;
      for (const t of targets) {
        while (sim.get(t.x, t.y).hp > 0) {
          sim.bite(t.x, t.y, false);
          count++;
        }
      }
      // Dalga modunda bile çok küçük gruplar oluşmasın: en az minRun lokma biriksin.
      if (mode === 'wave' && count >= minRun) break;
    }
    // Aynı renk art arda geldiyse birleştir.
    const prevRun = runs[runs.length - 1];
    if (prevRun && prevRun.color === color) prevRun.count += count;
    else runs.push({ color, count });
    lastColor = color;
  }

  // 2) Koşuları stack'lere böl.
  const maxS = spec.maxStack;
  const minS = Math.min(spec.minStack ?? Math.max(2, Math.floor(maxS / 3)), maxS);
  const sequence: StackDef[] = [];
  for (const run of runs) {
    let left = run.count;
    while (left > 0) {
      let size: number;
      if (left <= maxS) size = left;
      else {
        size = rng.int(Math.max(minS, Math.ceil(maxS * 0.55)), maxS);
        if (left - size < minS) size = left - minS; // son parça çok küçük kalmasın
      }
      sequence.push({ color: run.color, count: size });
      left -= size;
    }
  }

  // 3) Özel stack'ler.
  if (spec.hidden) {
    sequence.forEach((s, i) => {
      if (i >= 2 && rng.next() < spec.hidden!) s.hidden = true;
    });
  }
  if (spec.frozenStacks) {
    const candidates = sequence.map((_, i) => i).filter((i) => i >= 4);
    rng.shuffle(candidates);
    // Sırayla oynayan biri i. stack'e gelene kadar i kez dokunmuş olur → en fazla i-1 donma.
    candidates.slice(0, spec.frozenStacks).forEach((i) => (sequence[i].frozen = rng.int(2, Math.min(i - 1, 6))));
  }

  // 4) Sırayı koruyarak sütunlara rastgele dağıt. Her sütunda sıra korunduğu için
  //    çözümdeki bir sonraki stack daima bir sütunun önündedir.
  const Q = Math.max(1, Math.min(spec.columns, sequence.length));
  const owner: number[] = [];
  let prev = -1;
  sequence.forEach((_, i) => {
    let col = rng.int(0, Q - 1);
    if (col === prev && Q > 1 && rng.next() < 0.6) col = (col + 1 + rng.int(0, Q - 2)) % Q;
    owner[i] = col;
    prev = col;
  });
  // Boş kalan sütun olmasın: kalabalık bir sütunun en sondaki stack'ini taşı.
  for (let c = 0; c < Q; c++) {
    if (owner.includes(c)) continue;
    const counts = Array.from({ length: Q }, (_, k) => owner.filter((o) => o === k).length);
    const donor = counts.indexOf(Math.max(...counts));
    owner[owner.lastIndexOf(donor)] = c;
  }
  const columns: StackDef[][] = Array.from({ length: Q }, () => []);
  sequence.forEach((st, i) => columns[owner[i]].push(st));
  const solution = owner.map((column) => ({ column }));

  return {
    width,
    height,
    cells,
    columns,
    slots: spec.slots,
    solution,
  };
}
