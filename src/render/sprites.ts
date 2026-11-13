import { RAINBOW, type Stack } from '../core/types';
import { PALETTE } from '../level/palette';
import { THEME, shades } from './theme';

/** Yuvarlak köşeli dikdörtgen yolu. */
export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/* ---------- Tahta blokları: önceden çizilip önbelleğe alınan parlak küpler ---------- */

let spriteDpr = 1;
const cubeCache = new Map<string, HTMLCanvasElement>();

/** Ekran yoğunluğu değişince (resize) önbelleği sıfırla. */
export function setSpriteDpr(dpr: number) {
  if (dpr !== spriteDpr) {
    spriteDpr = dpr;
    cubeCache.clear();
    antCache.clear();
  }
}

/**
 * Tek bir şeker/jöle küp: yuvarlak köşe, üstten aşağı hafif aydınlık yüz, alt kenarda
 * koyu kalınlık, sol üstte küçük parlama noktası. (Referans: parlak oyuncak boncuk hissi.)
 */
function paintCube(g: CanvasRenderingContext2D, s: number, hex: string) {
  const c = shades(hex);
  // Köşe yuvarlaklığı da bloklar arası boşluk gibi görünür: küçük tutulur.
  const r = s * 0.17;
  const depth = Math.max(1, s * 0.13);
  // Alt kalınlık (koyu)
  roundRect(g, 0, 0, s, s, r);
  g.fillStyle = c.dark;
  g.fill();
  // Üst yüz: aydınlıktan ana renge yumuşak geçiş
  const face = g.createLinearGradient(0, 0, 0, s - depth);
  face.addColorStop(0, c.light);
  face.addColorStop(0.35, c.base);
  face.addColorStop(1, c.base);
  roundRect(g, 0, 0, s, s - depth, r);
  g.fillStyle = face;
  g.fill();
  // Sağ-alt iç gölge: kenarları belirginleştirir
  g.save();
  roundRect(g, 0, 0, s, s - depth, r);
  g.clip();
  g.strokeStyle = 'rgba(0,0,0,0.12)';
  g.lineWidth = Math.max(1, s * 0.08);
  roundRect(g, -s * 0.06, -s * 0.06, s, s - depth, r);
  g.stroke();
  g.restore();
}

/** Parlak 3B blok çiz (önbellekten). */
export function drawCube(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, hex: string) {
  const px = Math.max(2, Math.round(s * spriteDpr));
  const key = `${hex}|${px}`;
  let sp = cubeCache.get(key);
  if (!sp) {
    sp = document.createElement('canvas');
    sp.width = px;
    sp.height = px;
    paintCube(sp.getContext('2d')!, px, hex);
    if (cubeCache.size > 600) cubeCache.clear();
    cubeCache.set(key, sp);
  }
  ctx.drawImage(sp, x, y, s, s);
}

/** Blok, doğrudan cihaz pikseli biriminde (dönüşüm yok): tahta katmanı için. */
export function drawCubePx(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, hex: string) {
  const px = Math.max(2, Math.round(Math.max(w, h)));
  const key = `${hex}|${px}|raw`;
  let sp = cubeCache.get(key);
  if (!sp) {
    sp = document.createElement('canvas');
    sp.width = px;
    sp.height = px;
    paintCube(sp.getContext('2d')!, px, hex);
    if (cubeCache.size > 600) cubeCache.clear();
    cubeCache.set(key, sp);
  }
  ctx.drawImage(sp, x, y, w, h);
}

/**
 * Sevimli, parlak karınca. (x,y) merkez, angle yürüme yönü, size boy (piksel).
 * walk: yürüme mesafesi (bacak animasyonu için).
 */
export function drawAnt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size: number,
  colorId: number,
  walk: number,
  alpha = 1,
  shadow = true,
) {
  const col = shades((PALETTE[colorId] ?? PALETTE[0]).hex);
  const s = size;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  // Yer gölgesi
  if (shadow) {
    ctx.fillStyle = 'rgba(80,40,10,0.18)';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.12, s * 0.5, s * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.rotate(angle);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Bacaklar
  const swing = Math.sin(walk * 2.2) * 0.2 * s;
  ctx.strokeStyle = col.deep;
  ctx.lineWidth = Math.max(1.4, s * 0.075);
  for (const side of [-1, 1]) {
    for (let k = -1; k <= 1; k++) {
      const ph = k % 2 === 0 ? swing : -swing;
      const bx = k * s * 0.13;
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.quadraticCurveTo(bx + ph * side * 0.5 + k * s * 0.06, side * s * 0.26, bx + ph * side + k * s * 0.18, side * s * 0.36);
      ctx.stroke();
    }
  }
  // Antenler
  ctx.beginPath();
  ctx.moveTo(s * 0.36, -s * 0.07);
  ctx.quadraticCurveTo(s * 0.5, -s * 0.24, s * 0.64, -s * 0.18 + swing * 0.12);
  ctx.moveTo(s * 0.36, s * 0.07);
  ctx.quadraticCurveTo(s * 0.5, s * 0.24, s * 0.64, s * 0.18 - swing * 0.12);
  ctx.stroke();
  ctx.fillStyle = col.dark;
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(s * 0.64, sd * s * 0.18 - sd * swing * 0.12, s * 0.045, 0, Math.PI * 2);
    ctx.fill();
  }

  // Gövde parçaları: koyu taban + renkli üst + parlama
  const part = (cx: number, rx: number, ry: number) => {
    ctx.fillStyle = col.dark;
    ctx.beginPath();
    ctx.ellipse(cx, s * 0.03, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = col.base;
    ctx.beginPath();
    ctx.ellipse(cx, -s * 0.01, rx * 0.94, ry * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = col.light;
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.2, -ry * 0.4, rx * 0.45, ry * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  part(-s * 0.27, s * 0.25, s * 0.2);
  part(s * 0.02, s * 0.12, s * 0.1);
  part(s * 0.28, s * 0.18, s * 0.17);
  // Büyük gözler
  if (s >= 9) {
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s * 0.33, side * s * 0.075, s * 0.072, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1d1424';
      ctx.beginPath();
      ctx.arc(s * 0.355, side * s * 0.075, s * 0.042, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export interface TileOpts {
  /** Gösterilecek sayı (kalan karınca). */
  count: number;
  alpha?: number;
  /** Göz kırpma için zaman. */
  time?: number;
  /** Bu stack'e şu an dokunulamıyor / bekliyor (soluk). */
  dim?: boolean;
  /** Arkadaki önizleme (yüzsüz, sade). */
  plain?: boolean;
}

/**
 * Karınca grubu kutusu: parlak, kabartmalı küp; üstünde iki anten ve gözler,
 * önünde kalan karınca sayısı. Kuyrukta ve slotlarda kullanılır.
 */
export function drawStackTile(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, stack: Stack, o: TileOpts) {
  const hidden = !!stack.hidden;
  const frozen = !!stack.frozen && stack.frozen > 0;
  const rainbow = stack.color === RAINBOW;
  const base = hidden ? THEME.hidden : rainbow ? '#8a4fff' : (PALETTE[stack.color] ?? PALETTE[0]).hex;
  const c = shades(base);
  const s = size;
  const x = cx - s / 2;
  const y = cy - s / 2;
  const r = s * 0.24;
  const depth = s * 0.11;

  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;

  // Antenler (kutunun üstünden çıkan)
  if (!o.plain && !hidden) {
    ctx.strokeStyle = c.dark;
    ctx.lineWidth = Math.max(2, s * 0.05);
    ctx.lineCap = 'round';
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + sd * s * 0.14, y + s * 0.08);
      ctx.quadraticCurveTo(cx + sd * s * 0.2, y - s * 0.12, cx + sd * s * 0.3, y - s * 0.14);
      ctx.stroke();
      ctx.fillStyle = c.base;
      ctx.beginPath();
      ctx.arc(cx + sd * s * 0.3, y - s * 0.14, s * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Yumuşak gölge
  ctx.fillStyle = 'rgba(90,50,20,0.22)';
  roundRect(ctx, x + s * 0.04, y + s * 0.1, s * 0.92, s * 0.98, r);
  ctx.fill();
  // Gövde
  roundRect(ctx, x, y, s, s, r);
  ctx.fillStyle = c.dark;
  ctx.fill();
  let g: CanvasGradient;
  if (rainbow) {
    // Gökkuşağı grubu: renkli şeritli kutu
    g = ctx.createLinearGradient(x, y, x + s, y + s - depth);
    ['#ee4035', '#ff8c1a', '#ffd23f', '#4cc34a', '#3a8dff', '#8a4fff'].forEach((col, k, arr) => g.addColorStop(k / (arr.length - 1), col));
  } else {
    g = ctx.createLinearGradient(0, y, 0, y + s - depth);
    g.addColorStop(0, c.light);
    g.addColorStop(0.45, c.base);
    g.addColorStop(1, c.base);
  }
  roundRect(ctx, x, y, s, s - depth, r);
  ctx.fillStyle = g;
  ctx.fill();
  // Parlama şeridi
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(ctx, x + s * 0.12, y + s * 0.07, s * 0.5, s * 0.1, s * 0.05);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  if (hidden) {
    ctx.font = `${s * 0.56}px ${THEME.font}`;
    ctx.lineWidth = s * 0.08;
    ctx.strokeStyle = c.deep;
    ctx.strokeText('?', cx, cy - depth * 0.3);
    ctx.fillStyle = '#fff';
    ctx.fillText('?', cx, cy - depth * 0.3);
  } else {
    if (!o.plain) {
      // Gözler
      const blink = o.time !== undefined && (o.time + stack.id * 0.7) % 4 < 0.12;
      const ey = y + s * 0.3;
      for (const sd of [-1, 1]) {
        const ex = cx + sd * s * 0.16;
        if (blink) {
          ctx.strokeStyle = c.deep;
          ctx.lineWidth = s * 0.04;
          ctx.beginPath();
          ctx.moveTo(ex - s * 0.05, ey);
          ctx.lineTo(ex + s * 0.05, ey);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(ex, ey, s * 0.075, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1d1424';
          ctx.beginPath();
          ctx.arc(ex + s * 0.012, ey + s * 0.01, s * 0.042, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    // Sayı
    const txt = String(o.count);
    const fs = s * (txt.length > 2 ? 0.34 : o.plain ? 0.46 : 0.4);
    const ty = o.plain ? cy - depth * 0.4 : y + s * 0.64;
    ctx.font = `${fs}px ${THEME.font}`;
    ctx.lineWidth = fs * 0.22;
    ctx.strokeStyle = c.deep;
    ctx.strokeText(txt, cx, ty);
    ctx.fillStyle = '#fff';
    ctx.fillText(txt, cx, ty);
  }

  if (frozen) {
    // Buz kaplı kutu
    roundRect(ctx, x, y, s, s, r);
    ctx.fillStyle = 'rgba(200,240,255,0.82)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = s * 0.04;
    ctx.beginPath();
    ctx.moveTo(x + s * 0.2, y + s * 0.25);
    ctx.lineTo(x + s * 0.45, y + s * 0.12);
    ctx.moveTo(x + s * 0.6, y + s * 0.8);
    ctx.lineTo(x + s * 0.85, y + s * 0.62);
    ctx.stroke();
    ctx.font = `${s * 0.42}px ${THEME.font}`;
    ctx.lineWidth = s * 0.08;
    ctx.strokeStyle = '#3b8fc0';
    ctx.strokeText(String(stack.frozen), cx, cy);
    ctx.fillStyle = '#fff';
    ctx.fillText(String(stack.frozen), cx, cy);
  }
  if (o.dim) {
    roundRect(ctx, x, y, s, s, r);
    ctx.fillStyle = 'rgba(255,245,230,0.35)';
    ctx.fill();
  }
  ctx.restore();
}

/* ---------- Oyun içi karıncalar: önceden çizilmiş karelerden (yüzlerce karınca için hızlı) ---------- */

/** Yürüme animasyonunun kare sayısı. */
const ANT_FRAMES = 8;
const antCache = new Map<string, HTMLCanvasElement>();

function antSprite(px: number, colorId: number, frame: number, shadow: boolean): HTMLCanvasElement {
  const key = `${shadow ? 's' : colorId}|${px}|${shadow ? 0 : frame}`;
  let sp = antCache.get(key);
  if (!sp) {
    const box = Math.ceil(px * 1.5);
    sp = document.createElement('canvas');
    sp.width = box;
    sp.height = box;
    const g = sp.getContext('2d')!;
    if (shadow) {
      g.fillStyle = 'rgba(80,40,10,0.18)';
      g.beginPath();
      g.ellipse(box / 2, box / 2 + px * 0.12, px * 0.5, px * 0.22, 0, 0, Math.PI * 2);
      g.fill();
    } else {
      const walk = (frame / ANT_FRAMES) * ((Math.PI * 2) / 2.2);
      drawAnt(g, box / 2, box / 2, 0, px, colorId, walk, 1, false);
    }
    if (antCache.size > 1500) antCache.clear();
    antCache.set(key, sp);
  }
  return sp;
}

/** drawAnt ile aynı görünüm, ama önbellekten: döndürülmüş hazır kare çizilir. */
export function drawAntCached(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size: number,
  colorId: number,
  walk: number,
  alpha = 1,
  scale = 1,
) {
  const px = Math.max(4, Math.round(size * spriteDpr));
  const phase = (((walk * 2.2) / (Math.PI * 2)) % 1 + 1) % 1;
  const frame = Math.floor(phase * ANT_FRAMES) % ANT_FRAMES;
  const body = antSprite(px, colorId, frame, false);
  const shadow = antSprite(px, colorId, 0, true);
  const d = (body.width / spriteDpr) * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.drawImage(shadow, -d / 2, -d / 2, d, d);
  ctx.rotate(angle);
  ctx.drawImage(body, -d / 2, -d / 2, d, d);
  ctx.restore();
}
