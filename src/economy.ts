/**
 * Oyun ekonomisi: kazanç ve fiyatlar tek yerde. Dengeyi buradan ayarla.
 * Gerçek parayla satın alma ve reklam yok (parolla kuralı); altın yalnızca oynayarak
 * ve günlük ödülle kazanılır.
 */
export const ECONOMY = {
  /** Yeni oyuncunun başlangıç altını (progress.ts freshProgress ile aynı tut). */
  startCoins: 200,
  /** Her kazanılan bölüm. */
  winReward: 15,
  /** Zor / çok zor bölüm ek ödülü. */
  mediumBonus: 5,
  hardBonus: 10,
  extremeBonus: 20,
  prices: {
    slot: 120,
    gun: 120,
    hand: 250,
    rainbow: 160,
    speed: 100,
  },
  /** Gökkuşağı yuvasındaki karınca sayısı. */
  rainbowAnts: 24,
  /** Hızlı karıncalar gücünün süresi (sn, yalnızca oynarken akar). */
  speedDuration: 180,
  /** Hızlı moddaki hız çarpanı (normal hıza göre). */
  speedMultiplier: 1.7,
  /** Can sistemi */
  maxLives: 5,
  /** Bir canın yenilenme süresi (dk). */
  lifeRegenMinutes: 15,
  /** Canları altınla tamamen doldurma fiyatı. */
  refillPrice: 200,
} as const;

export type PowerId = keyof typeof ECONOMY.prices;
