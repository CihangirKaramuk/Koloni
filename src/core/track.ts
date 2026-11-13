import type { Side } from './types';

/**
 * Tahtanın etrafındaki karınca yolu. Koordinatlar hücre biriminde,
 * tahta (0,0)–(W,H) aralığında. Yol, tahtadan `gap` kadar dışarıda bir dikdörtgen.
 * Parametre t, sol üst köşeden saat yönünde ölçülen mesafe.
 */
export class Track {
  readonly length: number;
  readonly entrance: number;
  private readonly w: number;
  private readonly h: number;

  constructor(readonly boardW: number, readonly boardH: number, readonly gap = 0.85) {
    this.w = boardW + gap * 2;
    this.h = boardH + gap * 2;
    this.length = 2 * (this.w + this.h);
    // Giriş: alt kenarın ortası (slotlar alttadır).
    this.entrance = this.w + this.h + this.w / 2;
  }

  /** Yol üzerindeki nokta ve yürüme yönü (radyan). */
  pointAt(t: number): { x: number; y: number; angle: number } {
    const { w, h, gap } = this;
    let s = ((t % this.length) + this.length) % this.length;
    if (s < w) return { x: -gap + s, y: -gap, angle: 0 };
    s -= w;
    if (s < h) return { x: -gap + w, y: -gap + s, angle: Math.PI / 2 };
    s -= h;
    if (s < w) return { x: -gap + w - s, y: -gap + h, angle: Math.PI };
    s -= w;
    return { x: -gap, y: -gap + h - s, angle: -Math.PI / 2 };
  }

  /** (x,y) hücresine `side` kenarından bakan yol noktasının parametresi. */
  facing(x: number, y: number, side: Side): number {
    const { w, h, gap } = this;
    switch (side) {
      case 'top':
        return gap + x + 0.5;
      case 'right':
        return w + gap + y + 0.5;
      case 'bottom':
        return w + h + (w - (gap + x + 0.5));
      case 'left':
        return w + h + w + (h - (gap + y + 0.5));
    }
  }

  /**
   * Tahta dışındaki bir noktadan (ör. slot) yola en yakın giriş noktası.
   * Dönüş: yol parametresi ve o noktanın koordinatı.
   */
  private joinCache = new Map<string, { t: number; x: number; y: number }>();

  joinFrom(px: number, py: number): { t: number; x: number; y: number } {
    const key = `${px},${py}`;
    const hit = this.joinCache.get(key);
    if (hit) return hit;
    const out = this.scanJoin(px, py);
    if (this.joinCache.size > 64) this.joinCache.clear();
    this.joinCache.set(key, out);
    return out;
  }

  private scanJoin(px: number, py: number): { t: number; x: number; y: number } {
    let best = { t: this.entrance, x: 0, y: 0, d: Infinity };
    // Yolu küçük adımlarla tara (yol kısa, maliyet önemsiz).
    const steps = Math.ceil(this.length * 2);
    for (let k = 0; k < steps; k++) {
      const t = (k / steps) * this.length;
      const p = this.pointAt(t);
      const d = (p.x - px) ** 2 + (p.y - py) ** 2;
      if (d < best.d) best = { t, x: p.x, y: p.y, d };
    }
    return { t: best.t, x: best.x, y: best.y };
  }

  /** a'dan b'ye en kısa yön ve mesafe. */
  shortest(a: number, b: number): { dir: 1 | -1; dist: number } {
    const L = this.length;
    const cw = (((b - a) % L) + L) % L;
    const ccw = L - cw;
    return cw <= ccw ? { dir: 1, dist: cw } : { dir: -1, dist: ccw };
  }

  /** Yoldan hedef hücrenin merkezine kadar içeri yürüme mesafesi. */
  depth(x: number, y: number, side: Side): number {
    const { gap, boardW, boardH } = this;
    switch (side) {
      case 'top':
        return gap + y + 0.5;
      case 'bottom':
        return gap + (boardH - y - 0.5);
      case 'left':
        return gap + x + 0.5;
      case 'right':
        return gap + (boardW - x - 0.5);
    }
  }
}

/** Kenardan içeri bakan birim vektör. */
export function inward(side: Side): { dx: number; dy: number } {
  switch (side) {
    case 'top':
      return { dx: 0, dy: 1 };
    case 'bottom':
      return { dx: 0, dy: -1 };
    case 'left':
      return { dx: 1, dy: 0 };
    case 'right':
      return { dx: -1, dy: 0 };
  }
}
