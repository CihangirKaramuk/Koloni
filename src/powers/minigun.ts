/**
 * Havan topu (minigun) gücü: tahtanın altında bir silah belirir, döner namlularıyla
 * havaya kavisli küçük mermiler atar. Mermiler haritanın farklı bölgelerine dağılır ve
 * düştükleri pikseli (bazen yanındakini de) yok eder. Bölümü bitirecek kadar güçlü değildir.
 * Oyun mantığı (hangi piksel ne zaman yok olur) burada; çizimi renderer.drawMinigun yapar.
 */
import type { Game } from '../core/game';

export interface Shell {
  fromX: number;
  fromY: number;
  tx: number;
  ty: number;
  t: number;
  dur: number;
  /** Kavisin tepe yüksekliği (hücre). */
  peak: number;
}

export const MINIGUN = {
  /** Atış sayısı. */
  shots: 12,
  /** İki atış arası (sn). */
  interval: 0.2,
  /** Merminin havada kalma süresi (sn). */
  flight: 0.62,
  /** Vurduğu pikselin yanındakini de yok etme olasılığı. */
  splashChance: 0.45,
};

export class Minigun {
  active = false;
  phase: 'in' | 'fire' | 'out' = 'in';
  /** Faz zamanı (sn) */
  t = 0;
  /** Silahın tahta koordinatındaki yeri ve nişan açısı */
  x = 0;
  y = 0;
  aim = -Math.PI / 2;
  spin = 0;
  /** Son atıştan bu yana geçen süre (namlu ateşi için) */
  sinceShot = 1;
  shells: Shell[] = [];
  private targets: { x: number; y: number }[] = [];
  private fireTimer = 0;
  /** Bir mermi düştüğünde (patlama efekti için) */
  onImpact: (x: number, y: number) => void = () => {};
  onShot: () => void = () => {};

  /** Silahı başlat. Hedef yoksa false. */
  start(game: Game, gunX: number, gunY: number): boolean {
    const targets = pickSpreadTargets(game, MINIGUN.shots);
    if (targets.length === 0) return false;
    this.targets = targets;
    this.shells = [];
    this.x = gunX;
    this.y = gunY;
    this.phase = 'in';
    this.t = 0;
    this.fireTimer = 0;
    this.active = true;
    return true;
  }

  update(dt: number, game: Game) {
    if (!this.active) return;
    this.t += dt;
    this.sinceShot += dt;
    this.spin += dt * (this.phase === 'fire' ? 22 : 4);
    // Havadaki mermiler
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i];
      s.t += dt;
      if (s.t >= s.dur) {
        this.shells.splice(i, 1);
        this.impact(game, s.tx, s.ty);
      }
    }
    if (this.phase === 'in') {
      if (this.t >= 0.35) {
        this.phase = 'fire';
        this.t = 0;
      }
    } else if (this.phase === 'fire') {
      this.fireTimer -= dt;
      const next = this.targets[0];
      if (next) this.aim = Math.atan2(next.y + 0.5 - this.y, next.x + 0.5 - this.x);
      if (this.fireTimer <= 0 && next) {
        this.targets.shift();
        const dist = Math.hypot(next.x - this.x, next.y - this.y);
        this.shells.push({
          fromX: this.x + Math.cos(this.aim) * 1.6,
          fromY: this.y + Math.sin(this.aim) * 1.6,
          tx: next.x,
          ty: next.y,
          t: 0,
          dur: MINIGUN.flight + dist * 0.012,
          peak: 3 + dist * 0.18,
        });
        this.fireTimer = MINIGUN.interval;
        this.sinceShot = 0;
        this.onShot();
      }
      if (!next && this.shells.length === 0) {
        this.phase = 'out';
        this.t = 0;
      }
    } else if (this.t >= 0.35) {
      this.active = false;
    }
  }

  private impact(game: Game, x: number, y: number) {
    game.blastCell(x, y);
    this.onImpact(x, y);
    if (Math.random() < MINIGUN.splashChance) {
      const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)];
      game.blastCell(x + dx, y + dy);
    }
  }
}

/**
 * Haritaya yayılan hedefler: tahtayı bölgelere ayırıp her bölgeden rastgele bir dolu
 * piksel seçer (mermiler tek yere yığılmaz).
 */
function pickSpreadTargets(game: Game, n: number): { x: number; y: number }[] {
  const b = game.board;
  const gx = 4;
  const gy = 4;
  const buckets: { x: number; y: number }[][] = Array.from({ length: gx * gy }, () => []);
  b.cells.forEach((c, i) => {
    if (c.hp - c.reserved <= 0) return;
    const x = i % b.width;
    const y = (i / b.width) | 0;
    const bx = Math.min(gx - 1, Math.floor((x / b.width) * gx));
    const by = Math.min(gy - 1, Math.floor((y / b.height) * gy));
    buckets[by * gx + bx].push({ x, y });
  });
  const filled = buckets.filter((k) => k.length > 0);
  for (let i = filled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [filled[i], filled[j]] = [filled[j], filled[i]];
  }
  const out: { x: number; y: number }[] = [];
  const used = new Set<string>();
  for (let round = 0; out.length < n && round < 6; round++) {
    for (const k of filled) {
      if (out.length >= n) break;
      const p = k[Math.floor(Math.random() * k.length)];
      const key = `${p.x},${p.y}`;
      if (used.has(key)) continue;
      used.add(key);
      out.push(p);
    }
  }
  return out;
}
