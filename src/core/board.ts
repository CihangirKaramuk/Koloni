import { RAINBOW, type Cell, type ColorId, type Side } from './types';
import { cellHp, cellRules } from '../specials';

/**
 * Ulaşılabilir bir piksel ve oraya giden yol.
 * - via = -1: piksel tahtanın kenarında; karınca yoldan `side` kenarından doğrudan girer.
 * - via ≥ 0: pikselin yanındaki boş hücre (dışarıya bağlı). Karınca, `side` kenarındaki
 *   kök boş hücreden girip boşlukların içinden `via` hücresine yürür, oradan pikseli alır.
 */
export interface Exposure {
  x: number;
  y: number;
  side: Side;
  via: number;
}

const NEI: [number, number][] = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];

/**
 * Piksel tahtası. Kural: bir pikselin herhangi bir yanı tahtanın dışına ya da dışarıya
 * bağlı boş bir alana açılıyorsa karıncalar ona ulaşabilir (boşalan yerlerin içinden yürürler).
 */
export class Board {
  readonly cells: Cell[];
  private hpByColor = new Map<ColorId, number>();
  private reservedByColor = new Map<ColorId, number>();
  private exposureCache: Map<number, Exposure> | null = null;
  /** Dışarıya bağlı boş hücreler için: kenara uzaklık, kenara doğru bir sonraki hücre, kökün kenarı. */
  private reachDist: Int32Array;
  private reachNext: Int32Array;
  private rootSide: Side[];

  constructor(readonly width: number, readonly height: number, cells: { color: ColorId; special?: string }[]) {
    this.cells = cells.map((c) => {
      const hp = c.color < 0 ? 0 : cellHp(c.special);
      return { color: c.color, hp, reserved: 0, special: hp > 0 ? c.special : undefined };
    });
    for (const c of this.cells) if (c.hp > 0) this.addHp(c.color, c.hp);
    const n = width * height;
    this.reachDist = new Int32Array(n);
    this.reachNext = new Int32Array(n);
    this.rootSide = new Array<Side>(n);
  }

  idx(x: number, y: number): number {
    return y * this.width + x;
  }

  get(x: number, y: number): Cell {
    return this.cells[this.idx(x, y)];
  }

  isSolid(x: number, y: number): boolean {
    return this.cells[this.idx(x, y)].hp > 0;
  }

  /** Bu renkte tahtada kalan toplam lokma. */
  hpOf(color: ColorId): number {
    return this.hpByColor.get(color) ?? 0;
  }

  /** Henüz hiçbir karıncanın üstlenmediği lokma. (Gökkuşağı: tüm renkler) */
  unclaimedOf(color: ColorId): number {
    if (color === RAINBOW) {
      let r = 0;
      for (const v of this.reservedByColor.values()) r += v;
      return this.totalHp() - r;
    }
    return this.hpOf(color) - (this.reservedByColor.get(color) ?? 0);
  }

  /**
   * Bir pikseli güçle yok et (havan topu, parmak). Bir karıncanın yola çıktığı lokmalara
   * dokunmaz; yalnızca sahiplenilmemiş lokmaları siler. Bir şey sildiyse true.
   */
  destroy(x: number, y: number): boolean {
    const c = this.get(x, y);
    let any = false;
    while (c.hp - c.reserved > 0) {
      this.bite(x, y, false);
      any = true;
    }
    return any;
  }

  totalHp(): number {
    let t = 0;
    for (const v of this.hpByColor.values()) t += v;
    return t;
  }

  colorsLeft(): ColorId[] {
    return [...this.hpByColor.entries()].filter(([, v]) => v > 0).map(([k]) => k);
  }

  /** Kenardaki bir hücrenin dışarıya bakan kenarı (kenarda değilse null). */
  private borderSide(x: number, y: number): Side | null {
    if (y === this.height - 1) return 'bottom';
    if (y === 0) return 'top';
    if (x === 0) return 'left';
    if (x === this.width - 1) return 'right';
    return null;
  }

  /** Dışarıya bağlı boş alanı taşma (BFS) ile bul. */
  private computeReach() {
    const { width: W, height: H } = this;
    const dist = this.reachDist;
    const next = this.reachNext;
    dist.fill(-1);
    const queue: number[] = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const side = this.borderSide(x, y);
        if (!side) continue;
        const i = this.idx(x, y);
        if (this.cells[i].hp > 0) continue;
        dist[i] = 0;
        next[i] = -1;
        this.rootSide[i] = side;
        queue.push(i);
      }
    }
    for (let q = 0; q < queue.length; q++) {
      const i = queue[q];
      const x = i % W;
      const y = (i / W) | 0;
      for (const [dx, dy] of NEI) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = this.idx(nx, ny);
        if (dist[j] >= 0 || this.cells[j].hp > 0) continue;
        dist[j] = dist[i] + 1;
        next[j] = i;
        this.rootSide[j] = this.rootSide[i];
        queue.push(j);
      }
    }
  }

  /** Dolu bir hücrenin en kısa giriş yolu (ulaşılamıyorsa null). */
  private evalCell(i: number): Exposure | null {
    const { width: W, height: H } = this;
    const x = i % W;
    const y = (i / W) | 0;
    // Tahtanın kenarındaysa doğrudan girilebilir.
    if (y === 0) return { x, y, side: 'top', via: -1 };
    if (y === H - 1) return { x, y, side: 'bottom', via: -1 };
    if (x === 0) return { x, y, side: 'left', via: -1 };
    if (x === W - 1) return { x, y, side: 'right', via: -1 };
    let best: Exposure | null = null;
    let bestCost = Infinity;
    for (const [dx, dy] of NEI) {
      const j = this.idx(x + dx, y + dy);
      const d = this.reachDist[j];
      if (d >= 0 && d + 1 < bestCost) {
        bestCost = d + 1;
        best = { x, y, side: this.rootSide[j], via: j };
      }
    }
    return best;
  }

  /** Ulaşılabilir pikseller: hücre indeksi → en kısa giriş yolu. */
  exposures(): Map<number, Exposure> {
    if (this.exposureCache) return this.exposureCache;
    this.computeReach();
    const m = new Map<number, Exposure>();
    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i].hp <= 0) continue;
      const e = this.evalCell(i);
      if (e) m.set(i, e);
    }
    this.exposureCache = m;
    return m;
  }

  /**
   * Bir hücre boşaldı: ulaşılabilirliği baştan hesaplamak yerine yalnızca bu hücreden
   * yayılan değişikliği işle (büyük tahtalarda her lokmada tüm tahtayı taramamak için).
   * Bir duvarın kalkması mesafeleri yalnızca kısaltır; kısalan hücreler kuyrukla yayılır.
   */
  private openCell(i: number) {
    const m = this.exposureCache;
    if (!m) return;
    m.delete(i);
    const { width: W, height: H } = this;
    const dist = this.reachDist;
    const x = i % W;
    const y = (i / W) | 0;
    const side = this.borderSide(x, y);
    if (side) {
      dist[i] = 0;
      this.reachNext[i] = -1;
      this.rootSide[i] = side;
    } else {
      let bd = -1;
      for (const [dx, dy] of NEI) {
        const j = this.idx(x + dx, y + dy);
        const d = dist[j];
        if (d >= 0 && this.cells[j].hp <= 0 && (bd < 0 || d < dist[bd])) bd = j;
      }
      if (bd < 0) {
        dist[i] = -1;
        return; // Kapalı bir boşluk: dışarıya henüz bağlı değil.
      }
      dist[i] = dist[bd] + 1;
      this.reachNext[i] = bd;
      this.rootSide[i] = this.rootSide[bd];
    }
    const queue = [i];
    const touched: number[] = [];
    for (let q = 0; q < queue.length; q++) {
      const c = queue[q];
      touched.push(c);
      const cx = c % W;
      const cy = (c / W) | 0;
      for (const [dx, dy] of NEI) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = this.idx(nx, ny);
        if (this.cells[j].hp > 0) continue;
        if (dist[j] >= 0 && dist[j] <= dist[c] + 1) continue;
        dist[j] = dist[c] + 1;
        this.reachNext[j] = c;
        this.rootSide[j] = this.rootSide[c];
        queue.push(j);
      }
    }
    // Mesafesi değişen boşlukların yanındaki dolu hücrelerin giriş yolunu tazele.
    for (const c of touched) {
      const cx = c % W;
      const cy = (c / W) | 0;
      for (const [dx, dy] of NEI) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const j = this.idx(nx, ny);
        if (this.cells[j].hp <= 0) continue;
        const e = this.evalCell(j);
        if (e) m.set(j, e);
      }
    }
  }

  /**
   * via hücresinden kenardaki köke kadar boş hücre zinciri (kök sonda).
   * Karınca bu zinciri tersten yürür: kök → … → via → piksel.
   */
  chainToBorder(via: number): number[] {
    const out: number[] = [];
    let i = via;
    for (let guard = 0; i >= 0 && guard < this.cells.length; guard++) {
      out.push(i);
      i = this.reachNext[i];
    }
    return out;
  }

  /** Bu renkte, ulaşılabilir ve hâlâ sahiplenilmemiş lokması olan hücreler. */
  claimable(color: ColorId): Exposure[] {
    const out: Exposure[] = [];
    for (const [i, e] of this.exposures()) {
      const c = this.cells[i];
      if ((color !== RAINBOW && c.color !== color) || c.hp - c.reserved <= 0) continue;
      out.push(e);
    }
    return out;
  }

  reserve(x: number, y: number): void {
    const c = this.get(x, y);
    c.reserved++;
    this.reservedByColor.set(c.color, (this.reservedByColor.get(c.color) ?? 0) + 1);
  }

  /**
   * Görünümü değişen hücreler (indeks). Çizim katmanı bunları okuyup boşaltır;
   * böylece her karede bütün tahta yeniden çizilmez.
   */
  changed: number[] = [];

  /** Bir lokma yenir. Hücre tamamen bittiyse true döner. */
  bite(x: number, y: number, fromReservation = true): boolean {
    const c = this.get(x, y);
    if (c.hp <= 0) return false;
    this.changed.push(this.idx(x, y));
    if (fromReservation && c.reserved > 0) {
      c.reserved--;
      this.reservedByColor.set(c.color, (this.reservedByColor.get(c.color) ?? 0) - 1);
    }
    c.hp--;
    this.addHp(c.color, -1);
    if (c.hp === 0) {
      c.special = undefined;
      this.openCell(this.idx(x, y));
      return true;
    }
    if (c.special) cellRules[c.special]?.onBite?.(c);
    return false;
  }

  private addHp(color: ColorId, d: number) {
    this.hpByColor.set(color, (this.hpByColor.get(color) ?? 0) + d);
  }
}
