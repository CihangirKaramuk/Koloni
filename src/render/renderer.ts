import { defaultConfig, type Game } from '../core/game';

/** Oyundaki karınca boyu (ekran pikseli). */
const antSizeFor = (cell: number) => Math.max(13, cell * 1.05);
import type { Minigun } from '../powers/minigun';
import type { Stack } from '../core/types';
import { PALETTE, colorHex } from '../level/palette';
import { computeLayout, type Layout } from './layout';
import { Particles } from './particles';
import { drawAnt, drawAntCached, drawCube, drawCubePx, drawStackTile, roundRect, setSpriteDpr } from './sprites';
import { THEME } from './theme';

interface Flight {
  stack: Stack;
  count: number;
  fromX: number;
  fromY: number;
  slot: number;
  t: number;
}

const FLIGHT_TIME = 0.22;

/** Oyunu canvas'a çizer, efektleri yönetir, dokunma noktasını sütuna çevirir. */
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  private dpr = 1;
  private game: Game | null = null;
  private unsub: (() => void)[] = [];
  layout: Layout | null = null;
  readonly particles = new Particles();
  private flights: Flight[] = [];
  private colShift: number[] = [];
  private colShake: number[] = [];
  /**
   * Sütunların ekrandaki (animasyonlu) yatay merkezi. Bir sütun bitince kalanlar
   * aynı aralıkla ortaya doğru kayar.
   */
  private colX: number[] = [];
  private slotPop: number[] = [];
  private time = 0;
  private wood: HTMLCanvasElement | null = null;
  /** Üst HTML çubuğunun yüksekliği. */
  topInset = 64;
  /** Alttaki güçlendirici çubuğunun yüksekliği. */
  bottomInset = 0;
  /** Başlık ekranındaki dönen karıncalar. */
  titleAnts = true;
  /** Havan topu gücü (etkinken çizilir). */
  minigun: Minigun | null = null;
  /** Parmak gücü seçim modu: tahta parlar. */
  handMode = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.wood = null;
    setSpriteDpr(dpr);
    this.relayout();
  }

  setGame(game: Game | null) {
    this.unsub.forEach((u) => u());
    this.unsub = [];
    this.game = game;
    this.flights = [];
    this.particles.list = [];
    if (!game) {
      this.layout = null;
      return;
    }
    this.colShift = game.columns.map(() => 0);
    this.colX = [];
    this.colShake = game.columns.map(() => 0);
    this.slotPop = game.slots.map(() => 0);
    this.relayout();
    const ev = game.events;
    this.unsub.push(
      ev.on('tap', ({ column, slot, stack }) => {
        const c = this.layout!.columns[column];
        this.flights.push({ stack, count: stack.remaining, fromX: this.colX[column] ?? c.cx, fromY: c.cy, slot, t: 0 });
        this.colShift[column] = 1;
      }),
      ev.on('blocked', ({ column }) => (this.colShake[column] = 0.35)),
      ev.on('bite', ({ x, y, color, cleared }) => {
        const p = this.cellCenter(x + 0.5, y + 0.5);
        this.particles.crumbs(p.x, p.y, colorHex(color), this.layout!.cell * 0.6, cleared ? 2 : 1);
      }),
      ev.on('burn', ({ x, y }) => {
        const p = this.cellCenter(x + 0.5, y + 0.5);
        this.particles.crumbs(p.x, p.y, '#ff7a1a', this.layout!.cell * 1.3, 4);
        this.particles.crumbs(p.x, p.y, '#ffd23f', this.layout!.cell, 3);
      }),
      ev.on('slotDone', ({ slot, leftover }) => {
        const c = this.layout!.slotCenters[slot];
        if (!c) return;
        this.slotPop[slot] = 1;
        this.particles.ring(c.x, c.y, this.layout!.slotSize, '#ffffff');
        if (leftover > 0) this.particles.text(c.x, c.y - this.layout!.slotSize * 0.6, '✓', '#7be35f', 24);
      }),
      ev.on('stackVanished', ({ column }) => (this.colShift[column] = 1)),
      ev.on('slotAdded', () => {
        this.slotPop = game.slots.map(() => 0);
        this.relayout();
      }),
    );
  }

  private relayout() {
    const g = this.game;
    if (!g) return;
    this.layout = computeLayout({
      w: this.w,
      h: this.h,
      boardW: g.board.width,
      boardH: g.board.height,
      slots: g.slots.length,
      columns: g.columns.length,
      top: this.topInset,
      bottom: this.bottomInset,
    });
    // Slotların tahta koordinatındaki yerini oyuna bildir: karıncalar oradan çıkar.
    const L = this.layout;
    // Karıncalar arasında ekranda en az ~1.6 karınca boyu boşluk kalsın: hücreler küçük
    // çizildiğinde (telefon, büyük resim) hücre/saniye hızı buna göre artırılır.
    const antPx = antSizeFor(L.cell);
    const base = defaultConfig.antSpeed * defaultConfig.releaseInterval * L.cell;
    g.setPace(Math.max(1, (antPx * 1.6) / base, Math.max(g.board.width, g.board.height) / 40));
    this.colX = [];
    g.slotAnchors = L.slotCenters.map((c) => ({ x: (c.x - L.boardX) / L.cell, y: (c.y - L.boardY) / L.cell }));
    // Slotlarla yuva arasındaki boş şerit: yuvanın altı ile slotların üstünün ortası.
    const slotTop = (L.slotCenters[0]?.y ?? L.nest.y + 40) - L.slotSize / 2;
    const laneY = (L.nest.y + L.nest.ry + slotTop) / 2;
    g.nestAnchor = {
      x: (L.nest.x - L.boardX) / L.cell,
      y: (L.nest.y - L.boardY) / L.cell,
      r: L.nest.rx / L.cell,
      laneY: (laneY - L.boardY) / L.cell,
    };
  }

  /** Tahta koordinatı → ekran pikseli. */
  cellCenter(x: number, y: number) {
    const L = this.layout!;
    return { x: L.boardX + x * L.cell, y: L.boardY + y * L.cell };
  }

  /**
   * Dokunulan sütun (yoksa null). Yalnızca öndeki kutunun kendisi sayılır
   * (antenler dahil küçük bir pay); kutunun yanı veya arkadaki soluk kutular sayılmaz.
   */
  hitColumn(px: number, py: number): number | null {
    const L = this.layout;
    if (!L || !this.game) return null;
    const T = L.tile;
    const half = T / 2 + 4;
    for (let i = 0; i < L.columns.length; i++) {
      if (!this.game.columns[i]?.length) continue;
      const c = L.columns[i];
      const cx = this.colX[i] ?? c.cx;
      if (Math.abs(px - cx) <= half && py >= c.cy - half - T * 0.12 && py <= c.cy + half + T * 0.08) return i;
    }
    return null;
  }

  frame(dt: number) {
    this.time += dt;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.drawBackground();
    if (this.game && this.layout) {
      this.step(dt);
      this.drawBoard();
      this.drawSlots();
      this.drawQueue();
      this.drawAnts();
      this.drawMinigun();
      if (this.handMode) this.drawHandMode();
      this.drawFlights();
    } else if (this.titleAnts) {
      this.drawTitleScene();
    }
    this.particles.update(dt);
    this.particles.draw(ctx, THEME.font, 'rgba(90,50,20,0.9)');
  }

  /** Dolu sütunların hedef merkezleri: aynı aralıkla, grup olarak ortalanmış. */
  private columnTargets(): number[] {
    const L = this.layout!;
    const g = this.game!;
    const n = L.columns.length;
    const colW = L.queuePanel.w / n;
    const active = g.columns.map((c, i) => (c.length > 0 ? i : -1)).filter((i) => i >= 0);
    const start = L.queuePanel.x + (L.queuePanel.w - active.length * colW) / 2 + colW / 2;
    const out = L.columns.map((c) => c.cx);
    active.forEach((i, k) => (out[i] = start + k * colW));
    return out;
  }

  private step(dt: number) {
    // Sütunlar hedef konumlarına yumuşakça kayar.
    const targets = this.columnTargets();
    if (this.colX.length !== targets.length) this.colX = [...targets];
    for (let i = 0; i < targets.length; i++) this.colX[i] += (targets[i] - this.colX[i]) * Math.min(1, dt * 9);
    for (let i = 0; i < this.colShift.length; i++) {
      this.colShift[i] = Math.max(0, this.colShift[i] - dt * 6);
      this.colShake[i] = Math.max(0, this.colShake[i] - dt);
    }
    for (let i = 0; i < this.slotPop.length; i++) this.slotPop[i] = Math.max(0, this.slotPop[i] - dt * 4);
    for (const f of this.flights) f.t += dt;
    this.flights = this.flights.filter((f) => f.t < FLIGHT_TIME);
  }

  /** Ahşap masa: dikey tahtalar, damar çizgileri, hafif ışık. Bir kez çizilip önbelleğe alınır. */
  private drawBackground() {
    const { ctx, w, h } = this;
    if (!this.wood) {
      const c = document.createElement('canvas');
      c.width = Math.round(w * this.dpr);
      c.height = Math.round(h * this.dpr);
      const g = c.getContext('2d')!;
      g.scale(this.dpr, this.dpr);
      const base = g.createLinearGradient(0, 0, 0, h);
      base.addColorStop(0, THEME.woodLight);
      base.addColorStop(1, THEME.woodMid);
      g.fillStyle = base;
      g.fillRect(0, 0, w, h);
      const plank = Math.max(46, Math.min(80, w / 7));
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let x = 0; x < w + plank; x += plank) {
        // Tahta arası çizgi
        g.fillStyle = 'rgba(150,95,45,0.22)';
        g.fillRect(x, 0, 2, h);
        g.fillStyle = 'rgba(255,240,220,0.35)';
        g.fillRect(x + 2, 0, 1.5, h);
        // Ton farkı
        g.fillStyle = `rgba(${rnd() > 0.5 ? '255,235,205' : '170,110,60'},${0.06 + rnd() * 0.06})`;
        g.fillRect(x + 3, 0, plank - 3, h);
        // Damarlar
        g.strokeStyle = THEME.woodGrain;
        g.lineWidth = 1.2;
        for (let k = 0; k < 3; k++) {
          const gx = x + 8 + rnd() * (plank - 16);
          g.beginPath();
          g.moveTo(gx, 0);
          for (let y = 0; y <= h; y += 40) g.lineTo(gx + Math.sin(y * 0.01 + k + x) * 3, y);
          g.stroke();
        }
      }
      // Köşelerde hafif karartma
      const v = g.createRadialGradient(w / 2, h * 0.45, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.8);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, 'rgba(110,60,20,0.18)');
      g.fillStyle = v;
      g.fillRect(0, 0, w, h);
      this.wood = c;
    }
    ctx.drawImage(this.wood, 0, 0, w, h);
  }

  /** Tepsi, yol ve yuva: yalnızca yerleşim değişince çizilir. */
  private trayLayer: HTMLCanvasElement | null = null;
  /** Bloklar: yalnızca değişen hücreler yeniden çizilir. */
  private cubeLayer: HTMLCanvasElement | null = null;
  /** Katmanların hangi yerleşim ve oyun için çizildiği. */
  private layerKey: { layout: Layout; game: Game } | null = null;

  private newLayer(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.canvas.width;
    c.height = this.canvas.height;
    return c;
  }

  private paintTray(g: CanvasRenderingContext2D) {
    const game = this.game!;
    const L = this.layout!;
    const { board, track } = game;
    const cs = L.cell;
    const gap = track.gap;

    // Tepsi: tahta + çevresindeki yol
    const m = (gap + 0.75) * cs;
    const tx = L.boardX - m;
    const ty = L.boardY - m;
    const tw = board.width * cs + m * 2;
    const th = board.height * cs + m * 2;
    const tr = Math.min(26, cs * 1.4);
    g.save();
    g.shadowColor = THEME.trayShadow;
    g.shadowBlur = 18 * this.dpr;
    g.shadowOffsetY = 8 * this.dpr;
    roundRect(g, tx, ty, tw, th, tr);
    g.fillStyle = THEME.trayEdge;
    g.fill();
    g.restore();
    roundRect(g, tx + 5, ty + 5, tw - 10, th - 10, tr - 4);
    g.fillStyle = THEME.tray;
    g.fill();
    // İç gölge (gömme hissi)
    g.save();
    roundRect(g, tx + 5, ty + 5, tw - 10, th - 10, tr - 4);
    g.clip();
    g.strokeStyle = 'rgba(140,90,50,0.16)';
    g.lineWidth = 8;
    roundRect(g, tx + 1, ty + 3, tw - 2, th - 2, tr);
    g.stroke();
    g.restore();

    // Karınca yolu (tepsideki hafif oluk); hareketli çizgileri her karede çizilir.
    g.strokeStyle = THEME.groove;
    g.lineWidth = cs * 0.9;
    const p = this.groovePath();
    roundRect(g, p.x, p.y, p.w, p.h, cs * 0.6);
    g.stroke();

    // Karınca yuvası: yolun üstünde değil, tepsinin altında.
    const n = L.nest;
    g.fillStyle = THEME.holeOuter;
    g.beginPath();
    g.ellipse(n.x, n.y, n.rx, n.ry, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = THEME.holeInner;
    g.beginPath();
    g.ellipse(n.x, n.y + n.ry * 0.12, n.rx * 0.84, n.ry * 0.74, 0, 0, Math.PI * 2);
    g.fill();
  }

  private groovePath() {
    const L = this.layout!;
    const { board, track } = this.game!;
    const cs = L.cell;
    const gap = track.gap;
    return {
      x: L.boardX - gap * cs,
      y: L.boardY - gap * cs,
      w: (board.width + gap * 2) * cs,
      h: (board.height + gap * 2) * cs,
    };
  }

  /** Tek hücreyi blok katmanında sil ve (hâlâ duruyorsa) yeniden çiz. */
  private paintCell(g: CanvasRenderingContext2D, i: number, clear: boolean) {
    const L = this.layout!;
    const board = this.game!.board;
    const cs = L.cell;
    const x = i % board.width;
    const y = (i / board.width) | 0;
    // Hücre sınırları ekran (cihaz) pikseline oturtulur. Hücre kesirli bir yerde başlarsa
    // kenar yumuşatması komşu piksele taşar; hücre silinince o yarı saydam kenarlar
    // tahtada soluk çizgiler olarak kalıyordu. Tam piksele oturan hücre iz bırakmaz.
    const d = this.dpr;
    const x0 = Math.round((L.boardX + x * cs) * d);
    const x1 = Math.round((L.boardX + (x + 1) * cs) * d);
    const y0 = Math.round((L.boardY + y * cs) * d);
    const y1 = Math.round((L.boardY + (y + 1) * cs) * d);
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (clear) g.clearRect(x0, y0, x1 - x0, y1 - y0);
    const c = board.cells[i];
    if (c.color >= 0 && c.hp > 0) {
      // Bloklar arasında çok ince bir dikiş: yoğun resimlerde boşluklar görüntüyü soldurmasın.
      const pad = Math.max(0.3, cs * d * 0.025);
      const w = x1 - x0 - pad * 2;
      const h = y1 - y0 - pad * 2;
      drawCubePx(g, x0 + pad, y0 + pad, w, h, PALETTE[c.color].hex);
      if (c.special === 'ice') this.drawIce(g, x0 + pad, y0 + pad, Math.min(w, h));
    }
    g.restore();
  }

  private drawBoard() {
    const { ctx } = this;
    const game = this.game!;
    const L = this.layout!;
    const board = game.board;

    if (!this.layerKey || this.layerKey.layout !== L || this.layerKey.game !== game || !this.trayLayer || this.trayLayer.width !== this.canvas.width) {
      this.trayLayer = this.newLayer();
      this.cubeLayer = this.newLayer();
      const tg = this.trayLayer.getContext('2d')!;
      tg.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.paintTray(tg);
      const cg = this.cubeLayer.getContext('2d')!;
      cg.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      for (let i = 0; i < board.cells.length; i++) this.paintCell(cg, i, false);
      board.changed.length = 0;
      this.layerKey = { layout: L, game };
    } else if (board.changed.length) {
      const cg = this.cubeLayer!.getContext('2d')!;
      for (const i of new Set(board.changed)) this.paintCell(cg, i, true);
      board.changed.length = 0;
    }

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.trayLayer!, 0, 0);
    ctx.restore();

    // Yoldaki hareketli kesik çizgiler
    const cs = L.cell;
    const p = this.groovePath();
    ctx.setLineDash([cs * 0.25, cs * 0.5]);
    ctx.lineDashOffset = -this.time * cs * 1.4;
    ctx.strokeStyle = THEME.grooveDash;
    ctx.lineWidth = Math.max(1.5, cs * 0.1);
    roundRect(ctx, p.x, p.y, p.w, p.h, cs * 0.6);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.cubeLayer!, 0, 0);
    ctx.restore();
  }

  /** Buzlu blok: rengi görünür kalır, üstünde şeffaf buz kabuğu ve parlak kenar. */
  private drawIce(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
    const r = s * 0.17;
    roundRect(ctx, x, y, s, s, r);
    ctx.fillStyle = THEME.ice;
    ctx.fill();
    ctx.strokeStyle = THEME.iceEdge;
    ctx.lineWidth = Math.max(1, s * 0.11);
    roundRect(ctx, x + s * 0.06, y + s * 0.06, s * 0.88, s * 0.88, r * 0.8);
    ctx.stroke();
    if (s >= 7) {
      ctx.lineWidth = Math.max(1, s * 0.08);
      ctx.beginPath();
      ctx.moveTo(x + s * 0.28, y + s * 0.62);
      ctx.lineTo(x + s * 0.62, y + s * 0.28);
      ctx.stroke();
    }
  }

  private drawSlots() {
    const { ctx } = this;
    const game = this.game!;
    const L = this.layout!;
    const s = L.slotSize;
    game.slots.forEach((slot, i) => {
      const c = L.slotCenters[i];
      if (!c) return;
      const pop = this.slotPop[i] ?? 0;
      const size = s * (1 + pop * 0.08);
      const x = c.x - size / 2;
      const y = c.y - size / 2;
      const r = size * 0.18;
      ctx.save();
      ctx.shadowColor = THEME.slotShadow;
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      roundRect(ctx, x, y, size, size, r);
      ctx.fillStyle = THEME.slotShade;
      ctx.fill();
      ctx.restore();
      roundRect(ctx, x, y, size, size - size * 0.07, r);
      ctx.fillStyle = THEME.slot;
      ctx.fill();
      const flying = this.flights.some((f) => f.slot === i);
      if (slot.stack && !flying) {
        // Slottaki grup hep tam renkli ve sabit (beklerken soluklaşma / zıplama yok).
        drawStackTile(ctx, c.x, c.y - size * 0.03, size * 0.84, slot.stack, {
          count: slot.stack.remaining,
          time: this.time,
        });
      }
    });
  }

  private drawQueue() {
    const { ctx } = this;
    const game = this.game!;
    const L = this.layout!;
    const T = L.tile;
    game.columns.forEach((col, i) => {
      const lc = L.columns[i];
      const shake = this.colShake[i] > 0 ? Math.sin(this.colShake[i] * 60) * 6 * (this.colShake[i] / 0.35) : 0;
      const shift = this.colShift[i];
      const visible = Math.min(col.length, 3);
      const step = T * 0.92;
      // Arkadakiler aşağıda, soluk ve yüzsüz; öndeki büyük ve canlı.
      for (let k = visible - 1; k >= 0; k--) {
        const st = col[k];
        const kk = k + shift;
        const scale = k === 0 ? 1 - shift * 0.15 : 0.86;
        const y = lc.cy + kk * step;
        drawStackTile(ctx, (this.colX[i] ?? lc.cx) + (k === 0 ? shake : 0), y, T * scale, st, {
          count: st.remaining,
          alpha: k === 0 ? 1 : 0.55 - (k - 1) * 0.18,
          time: this.time,
          plain: k > 0,
          dim: k === 0 && !!st.frozen,
        });
      }
    });
  }

  private drawAnts() {
    const { ctx } = this;
    const game = this.game!;
    const L = this.layout!;
    const size = antSizeFor(L.cell);
    for (const a of game.ants) {
      const pose = game.antPose(a);
      const p = this.cellCenter(pose.x, pose.y);
      // Yuvaya girerken küçülerek deliğe dalar.
      const s = a.phase === 'home' ? size * (0.45 + 0.55 * pose.alpha) : size;
      drawAntCached(ctx, p.x, p.y, pose.angle, size, a.color, a.walk, pose.alpha, s / size);
      if (a.carry >= 0) {
        // Aldığı pikseli ağzında, başının önünde taşır.
        const cs = Math.max(7, L.cell * 0.8) * (s / size);
        const hx = p.x + Math.cos(pose.angle) * s * 0.62;
        const hy = p.y + Math.sin(pose.angle) * s * 0.62;
        ctx.save();
        ctx.globalAlpha = pose.alpha;
        ctx.translate(hx, hy);
        ctx.rotate(pose.angle * 0.15);
        drawCube(ctx, -cs / 2, -cs / 2, cs, PALETTE[a.carry].hex);
        ctx.restore();
      }
    }
  }

  /** Bölüm sonu kutlaması (konfeti): kazanma paneliyle birlikte. */
  celebrate() {
    this.particles.confetti(this.w, this.h, PALETTE.slice(0, 10).map((p) => p.hex));
  }

  /** Tahtadaki hücre (yoksa null): parmak gücü için. */
  /** Dokunulan noktaya `radius` piksel içinde en yakın dolu hücre (yoksa null). */
  nearestFilledCell(px: number, py: number, radius: number): { x: number; y: number } | null {
    const L = this.layout;
    const g = this.game;
    if (!L || !g) return null;
    const r = Math.max(1, Math.ceil(radius / L.cell));
    const fx = (px - L.boardX) / L.cell;
    const fy = (py - L.boardY) / L.cell;
    let best: { x: number; y: number } | null = null;
    let bestD = Infinity;
    for (let y = Math.floor(fy) - r; y <= Math.floor(fy) + r; y++) {
      for (let x = Math.floor(fx) - r; x <= Math.floor(fx) + r; x++) {
        if (x < 0 || y < 0 || x >= g.board.width || y >= g.board.height) continue;
        if (g.board.get(x, y).hp <= 0) continue;
        const d = (x + 0.5 - fx) ** 2 + (y + 0.5 - fy) ** 2;
        if (d < bestD && Math.sqrt(d) * L.cell <= radius + L.cell * 0.71) {
          bestD = d;
          best = { x, y };
        }
      }
    }
    return best;
  }

  /** Mermi düştüğü yerde küçük patlama. */
  boom(x: number, y: number) {
    if (!this.layout) return;
    const p = this.cellCenter(x + 0.5, y + 0.5);
    this.particles.ring(p.x, p.y, this.layout.cell * 2.4, '#ffb02e');
    this.particles.crumbs(p.x, p.y, '#ff7a1a', this.layout.cell, 3);
    this.particles.crumbs(p.x, p.y, '#ffd23f', this.layout.cell * 0.7, 2);
  }

  private drawHandMode() {
    const { ctx } = this;
    const L = this.layout!;
    const g = this.game!;
    const pulse = 0.5 + Math.sin(this.time * 5) * 0.5;
    const m = (g.track.gap + 0.75) * L.cell;
    ctx.save();
    ctx.shadowColor = '#ffe25a';
    ctx.shadowBlur = 10 + pulse * 14;
    ctx.strokeStyle = '#ffe25a';
    ctx.lineWidth = 4 + pulse * 2;
    roundRect(ctx, L.boardX - m, L.boardY - m, g.board.width * L.cell + m * 2, g.board.height * L.cell + m * 2, Math.min(26, L.cell * 1.4));
    ctx.stroke();
    ctx.restore();
  }

  /** Havan topu: döner namlulu silah ve kavisli mermiler. */
  private drawMinigun() {
    const m = this.minigun;
    if (!m || !m.active) return;
    const { ctx } = this;
    const L = this.layout!;
    const cs = L.cell;
    // Mermiler (gölge + top)
    for (const s of m.shells) {
      const k = Math.min(1, s.t / s.dur);
      const gx = s.fromX + (s.tx + 0.5 - s.fromX) * k;
      const gy = s.fromY + (s.ty + 0.5 - s.fromY) * k;
      const ground = this.cellCenter(gx, gy);
      const lift = s.peak * cs * 4 * k * (1 - k);
      const r = Math.max(3.5, cs * 0.38) * (1 + 0.35 * 4 * k * (1 - k));
      ctx.fillStyle = 'rgba(60,30,10,0.22)';
      ctx.beginPath();
      ctx.ellipse(ground.x, ground.y, r * 0.9, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffb02e';
      ctx.beginPath();
      ctx.arc(ground.x, ground.y - lift + r * 0.9, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2b2838';
      ctx.beginPath();
      ctx.arc(ground.x, ground.y - lift, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(ground.x - r * 0.35, ground.y - lift - r * 0.35, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Silah: belirip kaybolurken büyür / küçülür
    const appear = m.phase === 'in' ? easeBack(Math.min(1, m.t / 0.35)) : m.phase === 'out' ? 1 - Math.min(1, m.t / 0.35) : 1;
    if (appear <= 0) return;
    const S = Math.max(48, cs * 4) * appear;
    const p = this.cellCenter(m.x, m.y);
    ctx.save();
    ctx.translate(p.x, p.y);
    // Gölge ve ahşap kaide
    ctx.fillStyle = 'rgba(60,30,10,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, S * 0.32, S * 0.55, S * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, S * 0.06);
    ctx.strokeStyle = '#2b2838';
    roundRect(ctx, -S * 0.42, S * 0.05, S * 0.84, S * 0.3, S * 0.1);
    ctx.fillStyle = '#b57a48';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#dcaa7c';
    roundRect(ctx, -S * 0.36, S * 0.09, S * 0.72, S * 0.07, S * 0.03);
    ctx.fill();
    // Gövde (nişan açısına döner)
    ctx.rotate(m.aim);
    // Namlular: döner gibi görünsün diye üçü sırayla yer değiştirir
    for (let k = 0; k < 3; k++) {
      const a = m.spin + (k * Math.PI * 2) / 3;
      const off = Math.sin(a) * S * 0.12;
      const light = Math.cos(a) > 0;
      roundRect(ctx, S * 0.15, off - S * 0.05, S * 0.72, S * 0.1, S * 0.05);
      ctx.fillStyle = light ? '#c9cddb' : '#8a8fa3';
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, S * 0.035);
      ctx.stroke();
    }
    // Namlu bileziği
    roundRect(ctx, S * 0.72, -S * 0.2, S * 0.1, S * 0.4, S * 0.04);
    ctx.fillStyle = '#626881';
    ctx.fill();
    ctx.stroke();
    // Gövde
    ctx.lineWidth = Math.max(2, S * 0.06);
    roundRect(ctx, -S * 0.3, -S * 0.24, S * 0.55, S * 0.48, S * 0.14);
    ctx.fillStyle = '#ff7a1a';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    roundRect(ctx, -S * 0.24, -S * 0.19, S * 0.38, S * 0.08, S * 0.04);
    ctx.fill();
    // Namlu ateşi
    if (m.sinceShot < 0.09) {
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = (k * Math.PI) / 5;
        const rr = k % 2 === 0 ? S * 0.26 : S * 0.11;
        ctx.lineTo(S * 0.95 + Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawFlights() {
    const L = this.layout!;
    for (const f of this.flights) {
      const to = L.slotCenters[f.slot];
      if (!to) continue;
      const k = Math.min(1, f.t / FLIGHT_TIME);
      const e = 1 - (1 - k) * (1 - k);
      const x = f.fromX + (to.x - f.fromX) * e;
      const y = f.fromY + (to.y - f.fromY) * e - Math.sin(k * Math.PI) * 30;
      const size = L.tile + (L.slotSize * 0.84 - L.tile) * e;
      drawStackTile(this.ctx, x, y, size, f.stack, { count: f.count, time: this.time });
    }
  }

  /** Başlık ekranı: masada dolaşan karıncalar ve ortada karınca deliği. */
  private drawTitleScene() {
    const { ctx, w, h } = this;
    const cx = w / 2;
    const cy = h * 0.56;
    const hr = Math.min(w, h) * 0.17;
    // Delik
    ctx.fillStyle = THEME.holeOuter;
    ctx.beginPath();
    ctx.ellipse(cx, cy, hr * 1.2, hr * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = THEME.holeInner;
    ctx.beginPath();
    ctx.ellipse(cx, cy + hr * 0.05, hr * 1.02, hr * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Yuvaya girmek üzere deliğin kenarında duran karıncalar (sabit; sadece bacak/anten kıpırtısı).
    // [açı (derece), kenardan uzaklık çarpanı, boy çarpanı, renk]
    const base = Math.max(22, hr * 0.42);
    const ants: [number, number, number, number][] = [
      [195, 1.12, 1.25, 0], // sol: büyük kırmızı
      [345, 1.1, 0.95, 3], // sağ: yeşil
      [130, 1.08, 0.8, 2], // sol alt: küçük sarı
      [55, 1.12, 1.1, 6], // sağ alt: mavi
      [100, 1.25, 0.65, 8], // alt: minik pembe
    ];
    ants.forEach(([deg, dist, scale, color], i) => {
      const a = (deg * Math.PI) / 180;
      const x = cx + Math.cos(a) * hr * 1.2 * dist;
      const y = cy + Math.sin(a) * hr * 0.62 * dist;
      const toHole = Math.atan2(cy - y, cx - x);
      // Tamamen sabit: bacaklar farklı adım pozlarında donmuş (her biri biraz farklı dursun).
      drawAnt(ctx, x, y, toHole, base * scale, color, i * 0.9);
    });
  }
}

function easeBack(k: number): number {
  const c = 1.7;
  return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2;
}
