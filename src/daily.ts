/**
 * Günlük giriş ödülü: 7 günlük seri, değeri gün gün artar. Günde bir kez alınır;
 * bir gün kaçırılırsa seri 1. günden başlar, 7. günden sonra yeniden 1. gün.
 * Ödülleri değiştirmek için yalnızca DAILY_REWARDS listesini düzenle.
 */
import { addUnlimited } from './lives';
import type { Progress } from './platform/progress';

export type DailyReward =
  | { kind: 'coins'; amount: number }
  | { kind: 'speed'; minutes: number }
  | { kind: 'unlimited'; minutes: number }
  | { kind: 'power'; id: 'slot' | 'gun' | 'hand' | 'rainbow'; amount: number }
  /** Dört gücün her birinden `amount` tane. */
  | { kind: 'allPowers'; amount: number }
  | { kind: 'bundle'; items: DailyReward[] };

/**
 * Değersizden değerliye. Hafta boyunca her ödül türü (altın, 4 güç, hız, sınırsız can)
 * en az bir kez gelir; 7. gün hepsini toplayan büyük paket.
 * Yaklaşık altın değeri (economy.ts fiyatlarıyla): 50 · 120 · 150 · 170 · 260 · 350 · ~1000
 */
export const DAILY_REWARDS: DailyReward[] = [
  { kind: 'coins', amount: 50 },
  { kind: 'power', id: 'gun', amount: 1 },
  { kind: 'bundle', items: [{ kind: 'speed', minutes: 3 }, { kind: 'coins', amount: 50 }] },
  { kind: 'bundle', items: [{ kind: 'power', id: 'slot', amount: 1 }, { kind: 'unlimited', minutes: 15 }] },
  { kind: 'bundle', items: [{ kind: 'power', id: 'rainbow', amount: 1 }, { kind: 'coins', amount: 100 }] },
  { kind: 'bundle', items: [{ kind: 'power', id: 'hand', amount: 1 }, { kind: 'speed', minutes: 3 }] },
  {
    kind: 'bundle',
    items: [{ kind: 'coins', amount: 300 }, { kind: 'allPowers', amount: 1 }, { kind: 'unlimited', minutes: 30 }],
  },
];

/** Yerel takvim günü (YYYY-MM-DD). */
export function dayKey(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetween(a: string, b: string): number {
  const pa = a.split('-').map(Number);
  const pb = b.split('-').map(Number);
  const ta = Date.UTC(pa[0], pa[1] - 1, pa[2]);
  const tb = Date.UTC(pb[0], pb[1] - 1, pb[2]);
  return Math.round((tb - ta) / 86_400_000);
}

export interface DailyStatus {
  /** Bugün alınabilir mi? */
  canClaim: boolean;
  /** Bugün alınacak (ya da alınmış) gün: 1..7 */
  day: number;
}

export function dailyStatus(p: Progress, now: number): DailyStatus {
  const today = dayKey(now);
  const { last, streak } = p.daily;
  if (last === today) return { canClaim: false, day: Math.max(1, streak) };
  const gap = last ? daysBetween(last, today) : Infinity;
  // Dün alınmışsa seri devam eder, değilse 1. günden başlar.
  const next = gap === 1 ? (streak % DAILY_REWARDS.length) + 1 : 1;
  return { canClaim: true, day: next };
}

/** Bugünün ödülünü ver. Verilen ödülü döner (alınamıyorsa null). */
export function claimDaily(p: Progress, now: number): DailyReward | null {
  const st = dailyStatus(p, now);
  if (!st.canClaim) return null;
  const reward = DAILY_REWARDS[st.day - 1];
  applyReward(p, reward, now);
  p.daily = { last: dayKey(now), streak: st.day };
  return reward;
}

function applyReward(p: Progress, r: DailyReward, now: number) {
  switch (r.kind) {
    case 'coins':
      p.coins += r.amount;
      break;
    case 'speed':
      p.speedLeft += r.minutes * 60;
      break;
    case 'unlimited':
      addUnlimited(p, r.minutes, now);
      break;
    case 'power':
      p.boosters[r.id] += r.amount;
      break;
    case 'allPowers':
      for (const id of ['slot', 'gun', 'hand', 'rainbow'] as const) p.boosters[id] += r.amount;
      break;
    case 'bundle':
      r.items.forEach((it) => applyReward(p, it, now));
      break;
  }
}
