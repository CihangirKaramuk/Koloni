import type { LevelSpec } from '../core/types';
import { FOODS, FOOD_BY_ID, type PixelArt } from './art/foods';

/**
 * Sonsuz bölüm üretimi.
 *
 * - Her bölümün zorluğu, bölüm numarasından türeyen sabit bir "rastgele" ile seçilir
 *   (aynı numara hep aynı bölümü verir). Oranlar: çoğu Kolay, en azı Ekstra Zor.
 * - Resimler bir döngü içinde karıştırılarak kullanılır: tüm resimler bir kez çıkmadan
 *   aynı resim tekrar gelmez. Tekrar geldiğinde bölüm yine farklıdır: aynalanmış olabilir,
 *   zorluğu, çözünürlüğü (zor bölümlerde detaylı hali), grup dağılımı ve özel taşları değişir.
 * - Her bölüm oyuncuya verilmeden önce çözülebilirliği doğrulanır (generator.ts).
 */

export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme';
export type TipId = 'basics' | 'ice' | 'hidden' | 'frozen';

export interface LevelEntry {
  art: PixelArt;
  spec: LevelSpec;
  difficulty: Difficulty;
  /** Bu bölümde gösterilebilecek tanıtım ipuçları (görülmemiş ilki gösterilir). */
  tips: TipId[];
}

/** Zorluk oranları (toplam 100). */
export const TIER_WEIGHTS: Record<Difficulty, number> = { easy: 50, medium: 30, hard: 15, extreme: 5 };

/** İlk bölümler: öğretici, hep Kolay, sabit resimler. */
const INTRO = ['apple', 'cherries', 'strawberry', 'cat', 'balloon'];

/** Özel taşların ilk görülebileceği bölümler. */
const ICE_FROM = 8;
const HIDDEN_FROM = 12;
const FROZEN_FROM = 16;

/** Bölüm başına hedef grup sayısı (zorluğa göre); grup büyüklüğü blok sayısından hesaplanır. */
const TARGET_GROUPS: Record<Difficulty, number> = { easy: 22, medium: 28, hard: 34, extreme: 40 };

function hash(n: number, salt: number): number {
  let t = (n * 0x9e3779b1 + salt * 0x85ebca6b) >>> 0;
  t = Math.imul(t ^ (t >>> 16), 0x7feb352d);
  t = Math.imul(t ^ (t >>> 15), 0x846ca68b);
  return (t ^ (t >>> 16)) >>> 0;
}

function rawTier(n: number): Difficulty {
  if (n <= INTRO.length) return 'easy';
  let r = hash(n, 1) % 100;
  for (const d of ['easy', 'medium', 'hard', 'extreme'] as Difficulty[]) {
    if (r < TIER_WEIGHTS[d]) return d;
    r -= TIER_WEIGHTS[d];
  }
  return 'easy';
}

/** n. bölümün zorluğu (art arda iki Ekstra Zor gelmez). */
export function tierOf(n: number): Difficulty {
  const t = rawTier(n);
  if (t === 'extreme' && rawTier(n - 1) === 'extreme') return 'hard';
  return t;
}

/**
 * Aynı resim en az bu kadar bölüm sonra tekrar gelir: havuzun %60'ı (100 resimde 60).
 * Havuz büyüdükçe kendiliğinden artar. Havuz boyunu aşmadığı sürece her döngüde
 * seçilebilecek resim hiç tükenmez; kalan %40'lık pay her döngünün sırasını karıştırır.
 */
export const MIN_ART_GAP = Math.max(1, Math.round(FOODS.length * 0.6));

/** Hesaplanan döngü sıraları (bölüm numarası deterministik, sonuç önbellekte). */
const cycles: number[][] = [];

/**
 * c. döngünün resim sırası. Her döngüde her resim bir kez gelir. Bir resim, önceki
 * döngüde (ya da açılış bölümlerinde) en son göründüğü yerden en az MIN_ART_GAP
 * bölüm uzağa yerleştirilir; kalan seçim karışıktır.
 */
function cycleOrder(c: number): number[] {
  while (cycles.length <= c) {
    const k = cycles.length;
    const P = FOODS.length;
    const gap = Math.min(MIN_ART_GAP, P - 1);
    // Resmin bir önceki döngüdeki yeri (bu döngünün başına göre negatif uzaklık).
    const lastSeen = new Array<number>(P).fill(-Infinity);
    if (k === 0) {
      INTRO.forEach((id, i) => {
        const idx = FOODS.findIndex((f) => f.id === id);
        if (idx >= 0) lastSeen[idx] = i - INTRO.length;
      });
    } else {
      cycles[k - 1].forEach((art, i) => (lastSeen[art] = i - P));
    }
    const used = new Array<boolean>(P).fill(false);
    const order: number[] = [];
    for (let j = 0; j < P; j++) {
      let pick = Array.from({ length: P }, (_, i) => i).filter((i) => !used[i] && j - lastSeen[i] >= gap);
      // Güvenlik: kural sağlanamazsa en uzun süredir görünmeyenler.
      if (!pick.length) {
        const free = Array.from({ length: P }, (_, i) => i).filter((i) => !used[i]);
        const oldest = Math.min(...free.map((i) => lastSeen[i]));
        pick = free.filter((i) => lastSeen[i] === oldest);
      }
      const a = pick[hash(k * 977 + j, 7) % pick.length];
      used[a] = true;
      order.push(a);
    }
    cycles.push(order);
  }
  return cycles[c];
}

function artSlot(n: number): { art: PixelArt; cycle: number } {
  if (n <= INTRO.length) return { art: FOOD_BY_ID[INTRO[n - 1]], cycle: -1 };
  const P = FOODS.length;
  const k = n - INTRO.length - 1;
  const cycle = Math.floor(k / P);
  return { art: FOODS[cycleOrder(cycle)[k % P]], cycle };
}

/**
 * Boyut kademeleri: oyuncu ilerledikçe resimler daha çok pikselle gelir, bölümler
 * uzar. Sınırlar bilerek düzensiz: başta hızlı, sonra giderek seyrek büyür.
 * Değer, resmin boyut sırasına (0: normal, 1: 1.35×, 2: 1.6×, 3: 1.85×) eklenen ortalama.
 */
export const SIZE_STAGES: { from: number; bonus: number }[] = [
  { from: 1, bonus: 0 },
  { from: 13, bonus: 0.35 },
  { from: 31, bonus: 0.7 },
  { from: 61, bonus: 1.1 },
  { from: 121, bonus: 1.5 },
  { from: 251, bonus: 2 },
];

/** Zorluğun boyuta katkısı: zor bölümler aynı kademede daha büyük resim kullanır. */
const TIER_SIZE: Record<Difficulty, number> = { easy: 0, medium: 0.5, hard: 1, extreme: 1.25 };

export function sizeStage(n: number): number {
  let s = 0;
  SIZE_STAGES.forEach((st, i) => n >= st.from && (s = i));
  return s;
}

/**
 * n. bölümde resmin hangi boyutu kullanılır. Ortalama değer kesirliyse bölüme göre
 * yukarı ya da aşağı yuvarlanır: aynı kademede büyük ve küçük bölümler karışık gelir.
 */
export function sizeIndex(n: number, difficulty: Difficulty): number {
  const mean = SIZE_STAGES[sizeStage(n)].bonus + TIER_SIZE[difficulty];
  const frac = (hash(n, 5) % 1000) / 1000;
  return Math.max(0, Math.min(3, Math.floor(mean + frac)));
}

function artSize(art: PixelArt, i: number): string[] {
  const all = [art.rows, art.hd ?? art.rows, ...(art.big ?? [])];
  return all[Math.min(i, all.length - 1)];
}

const mirror = (rows: string[]) => rows.map((r) => [...r].reverse().join(''));

/** n. bölüm (1'den başlar, sınırsız). Aynı n her zaman aynı bölümü verir. */
export function getLevel(n: number): LevelEntry {
  const difficulty = tierOf(n);
  const { art, cycle } = artSlot(n);
  const detailed = artSize(art, sizeIndex(n, difficulty));
  // Tekrar gelen resim farklı görünsün: her gelişinde aynalı / düz hali sırayla değişir.
  const flip = cycle >= 0 && (cycle + (hash(FOODS.indexOf(art), 3) % 2)) % 2 === 1;
  const rows = flip ? mirror(detailed) : detailed;
  const blocks = rows.join('').replace(/\./g, '').length;
  const maxStack = Math.max(20, Math.min(80, Math.round((blocks / TARGET_GROUPS[difficulty]) * 1.35)));

  const ice = n >= ICE_FROM;
  const hidden = n >= HIDDEN_FROM;
  const frozen = n >= FROZEN_FROM;
  // Sütun (grup sırası) sayısı piksel yoğunluğuna göre 3–5.
  const columns = blocks < 800 ? 3 : blocks < 1400 ? 4 : 5;
  const spec: LevelSpec = { art: rows, slots: 5, columns, maxStack, seed: hash(n, 11) };
  switch (difficulty) {
    case 'easy':
      break;
    case 'medium':
      if (ice && hash(n, 21) % 2 === 0) spec.ice = 0.04;
      if (hidden && hash(n, 22) % 3 === 0) spec.hidden = 0.12;
      break;
    case 'hard':
      spec.slots = 4;
      if (ice) spec.ice = 0.06;
      if (hidden) spec.hidden = 0.2;
      if (frozen) spec.frozenStacks = 2;
      break;
    case 'extreme':
      spec.slots = 4;
      if (ice) spec.ice = 0.08;
      if (hidden) spec.hidden = 0.25;
      if (frozen) spec.frozenStacks = 3;
      break;
  }

  const tips: TipId[] = [];
  if (n === 1) tips.push('basics');
  if (spec.ice) tips.push('ice');
  if (spec.hidden) tips.push('hidden');
  if (spec.frozenStacks) tips.push('frozen');
  return { art, spec, difficulty, tips };
}
