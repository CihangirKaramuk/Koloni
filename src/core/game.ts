import { Board, type Exposure } from './board';
import { Emitter } from './events';
import { Track } from './track';
import { RAINBOW, type Ant, type ColorId, type GameStatus, type LevelData, type Slot, type Stack } from './types';
import { stackRules } from '../specials';
import { Rng } from './rng';

export interface GameConfig {
  /** Karınca hızı (hücre/sn). */
  antSpeed: number;
  /** Aynı slottan iki karınca arası süre (sn). */
  releaseInterval: number;
  /** Slottan yola çıkış süresi (sn). */
  exitTime: number;
  /** Pikseli kavrama süresi. */
  grabTime: number;
  /** Yuvaya girme süresi. */
  homeTime: number;
  /** Kilitlenme fark edildikten sonra "kaybettin" demeden önce beklenen süre. */
  stuckDelay: number;
  maxSlots: number;
}

/** Karınca hızının ayarlandığı tahta boyu (hücre). Daha büyük tahtalarda hız orantılı artar. */
const REF_BOARD = 40;

export const defaultConfig: GameConfig = {
  antSpeed: 13,
  releaseInterval: 0.16,
  exitTime: 0.32,
  grabTime: 0.14,
  homeTime: 0.32,
  stuckDelay: 0.6,
  maxSlots: 7,
};

export type BlockReason = 'noSlot' | 'frozen' | 'empty';

export type GameEvents = {
  tap: { column: number; slot: number; stack: Stack };
  blocked: { column: number; reason: BlockReason };
  release: { ant: Ant };
  bite: { x: number; y: number; color: ColorId; cleared: boolean };
  burn: { x: number; y: number; color: ColorId };
  /** Slot boşaldı. leftover > 0 ise rengin yiyeceği bitmişti, artan karıncalar doydu. */
  slotDone: { slot: number; leftover: number };
  stackVanished: { column: number; stack: Stack };
  slotAdded: { slot: number };
  /** Gökkuşağı grubu bir slota yerleşti. */
  rainbow: { slot: number };
  status: { status: GameStatus };
};

let nextId = 1;

/**
 * Oyun durumu ve kuralları. Zamanla ilerler (update), dokunuşları alır (tap)
 * ve olan her şeyi `events` üzerinden duyurur.
 */
export class Game {
  readonly board: Board;
  readonly track: Track;
  readonly columns: Stack[][];
  readonly slots: Slot[];
  readonly ants: Ant[] = [];
  readonly events = new Emitter<GameEvents>();
  readonly cfg: GameConfig;
  status: GameStatus = 'playing';
  /** Oyun hızı çarpanı (1 veya 2). */
  speed = 1;
  /** Bölüm başından beri geçen oyun süresi. */
  time = 0;
  taps = 0;
  private stuckTimer = 0;
  private rng: Rng;
  /**
   * Slotların tahta koordinatındaki yerleri (çizim katmanı yerleşime göre bildirir).
   * Karıncalar buradan çıkıp en yakın noktadan yola girer. Bilinmiyorsa yuva ağzı kullanılır.
   */
  slotAnchors: { x: number; y: number }[] = [];
  /** Yuvanın (delik) tahta koordinatındaki yeri ve yarıçapı. Yol üstünde değil, tahtanın altında. */
  /**
   * laneY: slotlarla yuva arasındaki boş şeridin yüksekliği. Yuvanın tam altındaki slottan
   * çıkan karınca önce bu şeride çıkar, yana kayar, yuvanın yanından yola gider
   * (ne yan slotların ne de yuvanın üstünden geçer).
   */
  nestAnchor: { x: number; y: number; r: number; laneY: number } | null = null;

  /** Yuva konumu (çizim katmanı bildirmediyse yolun alt ortasının biraz altı). */
  private nest(): { x: number; y: number; r: number; laneY: number } {
    if (this.nestAnchor) return this.nestAnchor;
    const e = this.track.pointAt(this.track.entrance);
    return { x: e.x, y: e.y + 2.2, r: 1, laneY: e.y + 3.5 };
  }

  constructor(level: LevelData, cfg: Partial<GameConfig> = {}, seed = 1) {
    this.cfg = { ...defaultConfig, ...cfg };
    this.baseSpeed = this.cfg.antSpeed;
    // Büyük tahtalarda hücreler ekranda küçülür. Hız hücre/saniye olduğu için karıncalar
    // ekranda yavaşlar ve sıkışık görünürdü: hızı tahta boyuna göre büyüt. Ekran çizimi
    // bunu gerçek hücre boyuna göre setPace ile ayrıca düzeltir (telefon/masaüstü farkı).
    this.setPace(Math.max(1, Math.max(level.width, level.height) / REF_BOARD));
    this.rng = new Rng(seed ^ 0x5bd1e995);
    this.board = new Board(level.width, level.height, level.cells);
    this.track = new Track(level.width, level.height);
    this.columns = level.columns.map((col) =>
      col.map((s) => ({ ...s, id: nextId++, remaining: s.count })),
    );
    this.slots = Array.from({ length: level.slots }, () => ({ stack: null, cooldown: 0 }));
    this.columns.forEach((col) => col[0] && stackRules.forEach((r) => r.onFront?.(col[0])));
  }

  private baseSpeed: number;

  /**
   * Karınca hızı çarpanı (hücre/saniye cinsinden). Ekran, hücreler küçük çizildiğinde
   * karıncalar arasında yeterli boşluk kalsın diye bunu artırır. Yalnızca yürüme hızını
   * etkiler; çıkış aralığı ve kurallar aynıdır.
   */
  setPace(p: number) {
    this.cfg.antSpeed = this.baseSpeed * Math.max(1, Math.min(3, p));
  }

  front(column: number): Stack | undefined {
    return this.columns[column]?.[0];
  }

  freeSlot(): number {
    return this.slots.findIndex((s) => !s.stack);
  }

  canTap(column: number): BlockReason | null {
    const s = this.front(column);
    if (!s) return 'empty';
    if (stackRules.some((r) => r.canTap && !r.canTap(s))) return 'frozen';
    if (this.freeSlot() < 0) return 'noSlot';
    return null;
  }

  /** Bir sütunun önündeki stack'i boş bir slota gönderir. */
  tap(column: number): boolean {
    if (this.status !== 'playing') return false;
    const reason = this.canTap(column);
    if (reason) {
      this.events.emit('blocked', { column, reason });
      return false;
    }
    const col = this.columns[column];
    const stack = col.shift()!;
    const slot = this.freeSlot();
    this.slots[slot] = { stack, cooldown: 0.2 }; // grup slota uçarken bekle
    this.taps++;
    for (const c of this.columns) for (const s of c) stackRules.forEach((r) => r.onOtherTapped?.(s));
    if (col[0]) stackRules.forEach((r) => r.onFront?.(col[0]));
    this.events.emit('tap', { column, slot, stack });
    return true;
  }

  addSlot(): boolean {
    if (this.slots.length >= this.cfg.maxSlots) return false;
    this.slots.push({ stack: null, cooldown: 0 });
    this.stuckTimer = 0;
    if (this.status === 'lost') this.setStatus('playing');
    this.events.emit('slotAdded', { slot: this.slots.length - 1 });
    return true;
  }

  /** Güç ile bir pikseli yok et (havan topu mermisi). */
  blastCell(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.board.width || y >= this.board.height) return false;
    const color = this.board.get(x, y).color;
    if (!this.board.destroy(x, y)) return false;
    this.events.emit('burn', { x, y, color });
    this.revive();
    return true;
  }

  /** Parmak: tahtadaki bu renkteki tüm pikselleri yok et. Silinen piksel sayısını döner. */
  wipeColor(color: ColorId): number {
    const W = this.board.width;
    let n = 0;
    this.board.cells.forEach((c, i) => {
      if (c.color !== color || c.hp <= 0) return;
      if (this.board.destroy(i % W, (i / W) | 0)) {
        this.events.emit('burn', { x: i % W, y: (i / W) | 0, color });
        n++;
      }
    });
    if (n) this.revive();
    return n;
  }

  /** Gökkuşağı yuvası: her renkten piksel alabilen bir grup boş slota yerleşir. */
  addRainbow(count: number): boolean {
    const si = this.freeSlot();
    if (si < 0 || this.board.totalHp() <= 0) return false;
    this.slots[si] = { stack: { id: nextId++, color: RAINBOW, count, remaining: count }, cooldown: 0.25 };
    this.events.emit('rainbow', { slot: si });
    this.revive();
    return true;
  }

  /** Güç kullanıldı: kilitlenme sayacını sıfırla, kaybedilmişse oyuna dön. */
  private revive() {
    this.stuckTimer = 0;
    if (this.status === 'lost') this.setStatus('playing');
  }

  /** İpucu: şu an oynanması mantıklı bir sütun. */
  hintColumn(): number | null {
    let best: number | null = null;
    let bestScore = -1;
    this.columns.forEach((col, i) => {
      const s = col[0];
      if (!s || this.canTap(i)) return;
      const n = this.board.claimable(s.color).length;
      const score = Math.min(n, s.remaining);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    });
    return bestScore > 0 ? best : null;
  }

  update(rawDt: number): void {
    if (this.status !== 'playing') {
      // Kazanınca da kalan karıncalar yürümeye devam etsin.
      if (this.status === 'won') this.moveAnts(rawDt * this.speed);
      return;
    }
    const dt = rawDt * this.speed;
    this.time += dt;
    this.dropUselessStacks();
    this.releaseAnts(dt);
    this.moveAnts(dt);

    if (this.board.totalHp() === 0) {
      this.setStatus('won');
      return;
    }
    if (this.isStuck()) {
      this.stuckTimer += rawDt;
      if (this.stuckTimer >= this.cfg.stuckDelay) this.setStatus('lost');
    } else {
      this.stuckTimer = 0;
    }
  }

  /** Hiçbir şey hareket edemiyor mu? */
  isStuck(): boolean {
    if (this.ants.length > 0) return false;
    for (const s of this.slots) {
      if (s.stack && this.board.claimable(s.stack.color).length > 0) return false;
    }
    if (this.freeSlot() >= 0) {
      for (let i = 0; i < this.columns.length; i++) if (!this.canTap(i)) return false;
    }
    return true;
  }

  private setStatus(status: GameStatus) {
    if (this.status === status) return;
    this.status = status;
    this.events.emit('status', { status });
  }

  /** Rengi tahtada kalmamış stack'ler (ör. ateşten sonra) kendiliğinden çekilir. */
  private dropUselessStacks() {
    this.columns.forEach((col, ci) => {
      for (let k = col.length - 1; k >= 0; k--) {
        if (this.board.unclaimedOf(col[k].color) <= 0) {
          const [stack] = col.splice(k, 1);
          this.events.emit('stackVanished', { column: ci, stack });
          if (k === 0 && col[0]) stackRules.forEach((r) => r.onFront?.(col[0]));
        }
      }
    });
  }

  /**
   * Yoldan bir piksele giriş: yol parametresi (t) ve iç yol noktaları.
   * Kenardaki piksele düz girilir; içerideki piksele, dışarıya bağlı boş hücrelerin
   * içinden (kenardaki kökten → pikselin yanındaki boşluğa) yürünür.
   */
  private routeCache = new Map<number, { t: number; pts: { x: number; y: number }[]; len: number }>();
  private routeCacheOf: Map<number, Exposure> | null = null;

  private entryRoute(e: Exposure): { t: number; pts: { x: number; y: number }[]; len: number } {
    // Tahta değişmediyse aynı pikselin yolu aynıdır: önbellekten ver.
    const ex = this.board.exposures();
    if (ex !== this.routeCacheOf) {
      this.routeCache.clear();
      this.routeCacheOf = ex;
    }
    const key = this.board.idx(e.x, e.y);
    const hit = this.routeCache.get(key);
    if (hit) return hit;
    const r = this.buildRoute(e);
    this.routeCache.set(key, r);
    return r;
  }

  private buildRoute(e: Exposure): { t: number; pts: { x: number; y: number }[]; len: number } {
    const { track, board } = this;
    const W = board.width;
    const T = { x: e.x + 0.5, y: e.y + 0.5 };
    let t: number;
    const pts: { x: number; y: number }[] = [];
    let last: { x: number; y: number };
    if (e.via < 0) {
      t = track.facing(e.x, e.y, e.side);
      const p0 = track.pointAt(t);
      pts.push({ x: p0.x, y: p0.y });
      last = pts[0];
    } else {
      const chain = board.chainToBorder(e.via).reverse(); // kök → … → via
      const root = chain[0];
      t = track.facing(root % W, (root / W) | 0, e.side);
      const p0 = track.pointAt(t);
      pts.push({ x: p0.x, y: p0.y });
      for (const c of chain) pts.push({ x: (c % W) + 0.5, y: ((c / W) | 0) + 0.5 });
      last = pts[pts.length - 1];
    }
    // Pikselin kenarında dur (merkezine girme).
    const dx = T.x - last.x;
    const dy = T.y - last.y;
    const dl = Math.hypot(dx, dy) || 1;
    const stop = Math.min(0.55, dl * 0.9);
    pts.push({ x: T.x - (dx / dl) * stop, y: T.y - (dy / dl) * stop });
    let len = 0;
    for (let k = 1; k < pts.length; k++) len += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
    return { t, pts, len: Math.max(0.01, len) };
  }

  private releaseAnts(dt: number) {
    const { board, track, cfg } = this;
    this.slots.forEach((slot, si) => {
      const stack = slot.stack;
      if (!stack) return;
      if (board.unclaimedOf(stack.color) <= 0 && stack.remaining > 0) {
        // Bu renkte yenecek bir şey kalmadı: karıncalar doydu, slot boşalır.
        const leftover = stack.remaining;
        slot.stack = null;
        this.events.emit('slotDone', { slot: si, leftover });
        return;
      }
      slot.cooldown -= dt;
      while (slot.cooldown <= 0 && stack.remaining > 0) {
        let options = board.claimable(stack.color);
        if (options.length === 0) {
          slot.cooldown = 0;
          break;
        }
        // Karınca slot kutusundan çıkar ve yola en yakın noktadan girer.
        const ent = track.pointAt(track.entrance);
        const anchor = this.slotAnchors[si] ?? { x: ent.x - 3, y: ent.y + 4 };
        // Yuva tam önündeyse: önce yukarı (slotlarla yuva arasındaki şeride), sonra yana,
        // sonra yuvanın yanından yola. Diğer slotlar doğrudan yola yürür.
        const nest = this.nest();
        const path = [{ x: anchor.x, y: anchor.y }];
        if (Math.abs(anchor.x - nest.x) < nest.r + 0.6) {
          const sideX = nest.x + (anchor.x >= nest.x ? 1 : -1) * (nest.r + 0.9);
          path.push({ x: anchor.x, y: nest.laneY }, { x: sideX, y: nest.laneY });
        }
        const last = path[path.length - 1];
        const join = track.joinFrom(last.x, last.y);
        path.push({ x: join.x, y: join.y });
        let pathLen = 0;
        for (let k = 1; k < path.length; k++) pathLen += Math.hypot(path[k].x - path[k - 1].x, path[k].y - path[k - 1].y);
        // Hedef: yakın olanlar daha olası ama karıncalar tahtanın etrafına yayılsın.
        let total = 0;
        // Çok aday varsa rastgele bir alt küme yeter (hız için).
        if (options.length > 40) {
          const pickN: Exposure[] = [];
          for (let k = 0; k < 40; k++) pickN.push(options[Math.floor(this.rng.next() * options.length)]);
          options = pickN;
        }
        const routes = options.map((o) => this.entryRoute(o));
        const weights = options.map((_, k) => {
          const d = track.shortest(join.t, routes[k].t).dist + routes[k].len * 2;
          const w = 1 / (1 + d * 0.15) ** 2;
          total += w;
          return w;
        });
        let r = this.rng.next() * total;
        let pick = options.length - 1;
        for (let k = 0; k < options.length; k++) {
          r -= weights[k];
          if (r <= 0) {
            pick = k;
            break;
          }
        }
        const best = options[pick];
        const entry = routes[pick];
        board.reserve(best.x, best.y);
        const to = entry.t;
        const route = track.shortest(join.t, to);
        const ant: Ant = {
          id: nextId++,
          color: stack.color === RAINBOW ? board.get(best.x, best.y).color : stack.color,
          slotIndex: si,
          phase: 'exit',
          t: 0,
          dur: Math.max(0.01, pathLen),
          fromX: anchor.x,
          fromY: anchor.y,
          path,
          nestJoin: 0,
          inPts: entry.pts,
          inLen: entry.len,
          trackFrom: join.t,
          trackTo: to,
          dir: route.dir,
          targetX: best.x,
          targetY: best.y,
          side: best.side,
          walk: 0,
          carry: -1,
          backDir: 1,
        };
        this.ants.push(ant);
        stack.remaining--;
        slot.cooldown += cfg.releaseInterval;
        this.events.emit('release', { ant });
      }
      if (stack.remaining === 0) {
        slot.stack = null;
        this.events.emit('slotDone', { slot: si, leftover: 0 });
      }
    });
  }

  private moveAnts(dt: number) {
    const { cfg, track, board } = this;
    for (let i = this.ants.length - 1; i >= 0; i--) {
      const a = this.ants[i];
      let left = dt;
      while (left > 0) {
        const moving = a.phase !== 'grab';
        const speedish = moving ? cfg.antSpeed : 1;
        const need = (a.dur - a.t) / speedish;
        const step = Math.min(left, need);
        a.t += step * speedish;
        a.walk += step * (a.phase === 'grab' ? 0 : cfg.antSpeed * 0.6);
        left -= step;
        if (a.t < a.dur - 1e-9) break;
        // Faz bitti → sıradaki faz.
        a.t = 0;
        if (a.phase === 'exit') {
          a.phase = 'track';
          a.dur = track.shortest(a.trackFrom, a.trackTo).dist;
        } else if (a.phase === 'track') {
          a.phase = 'in';
          a.dur = Math.max(0.01, a.inLen);
        } else if (a.phase === 'in') {
          a.phase = 'grab';
          a.dur = cfg.grabTime;
        } else if (a.phase === 'grab') {
          // Pikseli al: blok tahtadan bu anda kalkar (oyun kuralı burada işler).
          const color = board.get(a.targetX, a.targetY).color;
          const cleared = board.bite(a.targetX, a.targetY);
          this.events.emit('bite', { x: a.targetX, y: a.targetY, color, cleared });
          a.carry = color;
          a.phase = 'out';
          a.dur = Math.max(0.01, a.inLen);
        } else if (a.phase === 'out') {
          // Yuvaya en yakın yol noktasına dön.
          const nest = this.nest();
          const nj = track.joinFrom(nest.x, nest.y);
          const route = track.shortest(a.trackTo, nj.t);
          a.nestJoin = nj.t;
          a.phase = 'back';
          a.backDir = route.dir;
          a.dur = route.dist;
        } else if (a.phase === 'back') {
          // Yoldan ayrılıp yuvaya in.
          const nest = this.nest();
          const j = track.pointAt(a.nestJoin);
          a.phase = 'home';
          a.dur = Math.max(0.01, Math.hypot(nest.x - j.x, nest.y - j.y));
        } else {
          this.ants.splice(i, 1);
          break;
        }
      }
    }
  }

  /**
   * Karıncanın tahta koordinatındaki konumu. 'exit' fazında null döner
   * (slot ekran konumunu çizim katmanı bilir; `exitProgress` ile ara değer alır).
   */
  antPose(a: Ant): { x: number; y: number; angle: number; alpha: number } {
    const { track } = this;
    if (a.phase === 'exit') {
      // Slot kutusundan çık; yol noktaları boyunca (gerekirse yuvayı dolanarak) yola yürü.
      const alpha = Math.min(1, 0.3 + (a.t / a.dur) * 3);
      let d = a.t;
      for (let k = 1; k < a.path.length; k++) {
        const p0 = a.path[k - 1];
        const p1 = a.path[k];
        const len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
        if (d <= len || k === a.path.length - 1) {
          const f = len > 0 ? Math.min(1, d / len) : 1;
          return { x: p0.x + (p1.x - p0.x) * f, y: p0.y + (p1.y - p0.y) * f, angle: Math.atan2(p1.y - p0.y, p1.x - p0.x), alpha };
        }
        d -= len;
      }
      return { x: a.path[0].x, y: a.path[0].y, angle: -Math.PI / 2, alpha };
    }
    if (a.phase === 'track') {
      const p = track.pointAt(a.trackFrom + a.dir * a.t);
      return { x: p.x, y: p.y, angle: p.angle + (a.dir < 0 ? Math.PI : 0), alpha: 1 };
    }
    // Piksele giden iç yol (boşlukların içinden): girerken ileri, çıkarken geri yürü.
    if (a.phase === 'in') return { ...polyAt(a.inPts, a.t), alpha: 1 };
    if (a.phase === 'grab') return { ...polyAt(a.inPts, a.inLen), alpha: 1 };
    if (a.phase === 'out') {
      const p = polyAt(a.inPts, Math.max(0, a.inLen - a.t));
      return { x: p.x, y: p.y, angle: p.angle + Math.PI, alpha: 1 };
    }
    if (a.phase === 'back') {
      const p = track.pointAt(a.trackTo + a.backDir * a.t);
      return { x: p.x, y: p.y, angle: p.angle + (a.backDir < 0 ? Math.PI : 0), alpha: 1 };
    }
    // home: yoldan yuvaya yürür, deliğin ağzında küçülüp kaybolur
    const nest = this.nest();
    const j = track.pointAt(a.nestJoin);
    const k = Math.min(1, a.t / a.dur);
    return {
      x: j.x + (nest.x - j.x) * k,
      y: j.y + (nest.y - j.y) * k,
      angle: Math.atan2(nest.y - j.y, nest.x - j.x),
      alpha: k < 0.65 ? 1 : Math.max(0, 1 - (k - 0.65) / 0.35),
    };
  }
}

/** Çoklu çizgi üzerinde d mesafedeki nokta ve yön. */
function polyAt(pts: { x: number; y: number }[], d: number): { x: number; y: number; angle: number } {
  let rest = d;
  for (let k = 1; k < pts.length; k++) {
    const p0 = pts[k - 1];
    const p1 = pts[k];
    const len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    if (rest <= len || k === pts.length - 1) {
      const f = len > 0 ? Math.min(1, rest / len) : 1;
      return { x: p0.x + (p1.x - p0.x) * f, y: p0.y + (p1.y - p0.y) * f, angle: Math.atan2(p1.y - p0.y, p1.x - p0.x) };
    }
    rest -= len;
  }
  return { x: pts[0].x, y: pts[0].y, angle: 0 };
}
