/**
 * Can sistemi. En fazla 5 can; bölüm kaybedilince / yeniden başlatılınca / yarıda
 * bırakılınca 1 can gider, her 15 dakikada 1 can dolar. Sınırsız can süresi boyunca
 * can harcanmaz. Saf fonksiyonlar: zaman dışarıdan verilir, test edilebilir.
 */
import { ECONOMY } from './economy';
import type { Progress } from './platform/progress';

const REGEN_MS = ECONOMY.lifeRegenMinutes * 60_000;

export interface LivesInfo {
  lives: number;
  full: boolean;
  /** Sıradaki cana kalan süre (ms); dolu ise 0. */
  nextIn: number;
  /** Sınırsız can kalan süresi (ms); yoksa 0. */
  unlimitedLeft: number;
}

/** Geçen süreye göre dolan canları uygular. Bir şey değiştiyse true döner. */
export function regenLives(p: Progress, now: number): boolean {
  const max = ECONOMY.maxLives;
  if (p.lives >= max) {
    if (p.lives > max) {
      p.lives = max;
      return true;
    }
    return false;
  }
  if (!p.livesTs || p.livesTs > now) {
    p.livesTs = now;
    return true;
  }
  const gained = Math.floor((now - p.livesTs) / REGEN_MS);
  if (gained <= 0) return false;
  p.lives = Math.min(max, p.lives + gained);
  p.livesTs = p.lives >= max ? 0 : p.livesTs + gained * REGEN_MS;
  return true;
}

export function livesInfo(p: Progress, now: number): LivesInfo {
  const full = p.lives >= ECONOMY.maxLives;
  return {
    lives: p.lives,
    full,
    nextIn: full || !p.livesTs ? 0 : Math.max(0, p.livesTs + REGEN_MS - now),
    unlimitedLeft: Math.max(0, p.unlimitedUntil - now),
  };
}

/** Oynanabilir mi? (en az 1 can ya da sınırsız can) */
export function canPlay(p: Progress, now: number): boolean {
  return p.lives > 0 || p.unlimitedUntil > now;
}

/** Bir can harca. Sınırsız can aktifse harcamaz. Harcandıysa true. */
export function spendLife(p: Progress, now: number): boolean {
  if (p.unlimitedUntil > now || p.lives <= 0) return false;
  // Dolu iken ilk can gidince yenilenme sayacı başlar.
  if (p.lives >= ECONOMY.maxLives) p.livesTs = now;
  p.lives--;
  return true;
}

export function addLives(p: Progress, n: number, now: number) {
  p.lives = Math.min(ECONOMY.maxLives, p.lives + n);
  if (p.lives >= ECONOMY.maxLives) p.livesTs = 0;
  else if (!p.livesTs) p.livesTs = now;
}

export function addUnlimited(p: Progress, minutes: number, now: number) {
  p.unlimitedUntil = Math.max(now, p.unlimitedUntil) + minutes * 60_000;
}

/** 14:59 biçimi */
export function fmtTime(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
