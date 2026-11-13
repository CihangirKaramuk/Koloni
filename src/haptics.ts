/**
 * Titreşim (destekleyen telefonlarda). iPhone Safari desteklemez; bazı tarayıcılar
 * başka siteye gömülü (iframe) oyunlarda engelleyebilir. O durumda sessizce hiçbir şey olmaz.
 */
export type Buzz = 'tap' | 'blocked' | 'power' | 'win' | 'lose';

const PATTERNS: Record<Buzz, number | number[]> = {
  tap: 12,
  blocked: [25, 40, 25],
  power: 30,
  win: [40, 60, 40, 60, 80],
  lose: 120,
};

export const haptics = {
  on: true,
  supported: typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function',
  buzz(kind: Buzz) {
    if (!this.on || !this.supported) return;
    try {
      navigator.vibrate(PATTERNS[kind]);
    } catch {
      /* izin yoksa geç */
    }
  },
};
