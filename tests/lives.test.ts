import { describe, expect, it } from 'vitest';
import { DAILY_REWARDS, claimDaily, dailyStatus } from '../src/daily';
import { canPlay, livesInfo, regenLives, spendLife } from '../src/lives';
import { freshProgress } from '../src/platform/progress';

const MIN = 60_000;
const T0 = new Date(2026, 10, 12, 10, 0, 0).getTime();

describe('can sistemi', () => {
  it('5 canla başlar, kaybedince azalır, 15 dakikada bir dolar', () => {
    const p = freshProgress();
    expect(p.lives).toBe(5);
    expect(spendLife(p, T0)).toBe(true);
    expect(spendLife(p, T0)).toBe(true);
    expect(p.lives).toBe(3);
    expect(livesInfo(p, T0 + 5 * MIN).nextIn).toBe(10 * MIN);
    regenLives(p, T0 + 14 * MIN);
    expect(p.lives).toBe(3);
    regenLives(p, T0 + 15 * MIN);
    expect(p.lives).toBe(4);
    regenLives(p, T0 + 31 * MIN);
    expect(p.lives).toBe(5);
    expect(livesInfo(p, T0 + 31 * MIN).full).toBe(true);
  });

  it('can bitince oynanamaz, sınırsız canda can harcanmaz', () => {
    const p = freshProgress();
    for (let i = 0; i < 5; i++) spendLife(p, T0);
    expect(p.lives).toBe(0);
    expect(canPlay(p, T0)).toBe(false);
    p.unlimitedUntil = T0 + 10 * MIN;
    expect(canPlay(p, T0)).toBe(true);
    expect(spendLife(p, T0)).toBe(false);
    expect(p.lives).toBe(0);
  });
});

describe('günlük ödül', () => {
  it('günde bir kez alınır ve seri gün gün ilerler', () => {
    const p = freshProgress();
    const day = (n: number) => T0 + n * 24 * 60 * MIN;
    expect(dailyStatus(p, day(0))).toEqual({ canClaim: true, day: 1 });
    expect(claimDaily(p, day(0))).toEqual(DAILY_REWARDS[0]);
    expect(p.coins).toBe(250);
    expect(claimDaily(p, day(0))).toBeNull();
    expect(dailyStatus(p, day(1)).day).toBe(2);
    claimDaily(p, day(1));
    expect(p.boosters.gun).toBe(2); // başlangıç hediyesi + 2. gün
    claimDaily(p, day(2));
    expect(p.speedLeft).toBe(180 + 180); // başlangıç hediyesi + 3. gün
    expect(p.coins).toBe(300);
    claimDaily(p, day(3));
    expect(p.unlimitedUntil).toBe(day(3) + 15 * MIN);
  });

  it('bir gün kaçırılırsa 1. güne döner, 7. günden sonra başa sarar', () => {
    const p = freshProgress();
    const day = (n: number) => T0 + n * 24 * 60 * MIN;
    claimDaily(p, day(0));
    claimDaily(p, day(1));
    expect(dailyStatus(p, day(3)).day).toBe(1);
    for (let d = 3; d < 10; d++) claimDaily(p, day(d));
    expect(p.daily.streak).toBe(7);
    // Başlangıçta 1 + 6. gün 1 + 7. gün her güçten 1
    expect(p.boosters.hand).toBe(3);
    expect(p.boosters.rainbow).toBe(3);
    expect(dailyStatus(p, day(10)).day).toBe(1);
  });
});
