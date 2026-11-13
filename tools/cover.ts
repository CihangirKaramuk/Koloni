/**
 * Parolla kapağı (16:9, 1920×1080). Portaldaki diğer kapaklarla aynı dil: canlı düz zemin
 * üstünde soluk yuvarlak kare deseni, kalın siyah konturlu beyaz başlık, koyu alt başlık
 * rozeti ve kalın konturlu sevimli karakterler. Oyunun kendi çizim fonksiyonlarını kullanır.
 * npm run dev → /tools/cover.html → "Projeye kaydet" (docs/kapak.png).
 * Sol alt köşe boş bırakılır: portal oraya "Yeni" rozetini koyar.
 */
import { FOOD_BY_ID } from '../src/level/art/foods';
import { CHAR_TO_COLOR, PALETTE } from '../src/level/palette';
import { drawAnt, drawCube, drawStackTile, roundRect } from '../src/render/sprites';

const W = 1920;
const H = 1080;
const INK = '#2b2838';
const BG = '#f7a440';

const cv = document.getElementById('c') as HTMLCanvasElement;
cv.width = W;
cv.height = H;
const ctx = cv.getContext('2d')!;

const art = FOOD_BY_ID.apple.rows;
const AW = art[0].length;
const AH = art.length;
const CS = 15;
const BX = W / 2 - (AW * CS) / 2;
const BY = 430;
// Karıncaların yediği köşe: sağ alt ve alt kenardan bir parça
const eaten = (x: number, y: number) => (x > AW - 9 && y > AH - 12) || (y > AH - 4 && x > AW / 2 - 4) || (x > AW - 4 && y > AH - 18);

function background() {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const T = 104;
  const G = 16;
  ctx.fillStyle = 'rgba(255,255,255,0.13)';
  for (let y = -40; y < H; y += T + G) {
    for (let x = -30; x < W; x += T + G) {
      roundRect(ctx, x, y, T, T, 24);
      ctx.fill();
    }
  }
}

/** Kalın siyah konturlu, alttan koyu gölgeli beyaz yazı (portal kapaklarının başlık stili). */
function outlined(text: string, x: number, y: number, size: number, stroke: number) {
  ctx.save();
  ctx.font = `${size}px "Lilita One"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.fillStyle = INK;
  ctx.strokeStyle = INK;
  ctx.lineWidth = stroke;
  ctx.strokeText(text, x, y + size * 0.07);
  ctx.fillText(text, x, y + size * 0.07);
  ctx.strokeText(text, x, y);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function title() {
  outlined('Koloni', W / 2, 250, 250, 34);
  // Alt başlık rozeti
  const label = 'Karıncalar acıktı!';
  ctx.save();
  ctx.font = '800 42px "Baloo 2"';
  const tw = ctx.measureText(label).width + 70;
  roundRect(ctx, W / 2 - tw / 2, 290, tw, 66, 33);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, W / 2, 325);
  ctx.restore();
}

function groundShadow(x: number, y: number, rx: number, ry: number) {
  ctx.fillStyle = 'rgba(90,40,0,0.16)';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function tray() {
  const m = 34;
  const x = BX - m;
  const y = BY - m;
  const w = AW * CS + m * 2;
  const h = AH * CS + m * 2;
  groundShadow(W / 2, y + h + 4, w * 0.62, 34);
  roundRect(ctx, x, y, w, h, 42);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = INK;
  ctx.stroke();
  roundRect(ctx, x + 14, y + 14, w - 28, h - 28, 30);
  ctx.fillStyle = '#e9e3da';
  ctx.fill();
  art.forEach((row, yy) =>
    [...row].forEach((ch, xx) => {
      const id = CHAR_TO_COLOR[ch];
      if (id === undefined || eaten(xx, yy)) return;
      drawCube(ctx, BX + xx * CS + 0.6, BY + yy * CS + 0.6, CS - 1.2, PALETTE[id].hex);
    }),
  );
}

/** Ağzında piksel taşıyan karınca. */
function carrier(x: number, y: number, angle: number, size: number, color: string, cube: string) {
  drawAnt(ctx, x, y, angle, size, CHAR_TO_COLOR[color], 1.2);
  const hx = x + Math.cos(angle) * size * 0.66;
  const hy = y + Math.sin(angle) * size * 0.66;
  const c = size * 0.42;
  drawCube(ctx, hx - c / 2, hy - c / 2, c, PALETTE[CHAR_TO_COLOR[cube]].hex);
}

function ants() {
  const right = BX + AW * CS + 34;
  const bottom = BY + AH * CS + 34;
  // Tepsinin kenarında dolaşan, yediklerini taşıyan karıncalar (kapak küçükken de seçilsin diye iri)
  carrier(right, BY + 140, Math.PI / 2, 78, 'R', 'R');
  carrier(right, BY + 330, Math.PI / 2, 78, 'R', 'r');
  carrier(BX + AW * CS - 120, bottom, Math.PI, 78, 'R', 'R');
  carrier(BX + 150, bottom, Math.PI, 78, 'G', 'G');
  carrier(BX - 34, BY + 250, -Math.PI / 2, 78, 'K', 'K');
  // Gruplardan tepsiye yürüyen sıralar
  const line = (x0: number, y0: number, x1: number, y1: number, n: number, color: string) => {
    const a = Math.atan2(y1 - y0, x1 - x0);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      drawAnt(ctx, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * 7) * 8, a, 70, CHAR_TO_COLOR[color], i * 1.7);
    }
  };
  line(480, 790, BX - 60, 720, 3, 'R');
  line(1440, 800, right + 30, 740, 3, 'G');
}

function tile(x: number, y: number, size: number, rot: number, color: string, n: number, id: number) {
  groundShadow(x, y + size * 0.62, size * 0.52, size * 0.11);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  // Kalın siyah kontur (portal karakterleri gibi)
  roundRect(ctx, -size / 2 - 7, -size / 2 - 7, size + 14, size + 14, size * 0.28);
  ctx.fillStyle = INK;
  ctx.fill();
  drawStackTile(ctx, 0, 0, size, { id, color: CHAR_TO_COLOR[color], count: n, remaining: n }, { count: n, time: 1.3 + id });
  ctx.restore();
}

/** Karakterlerin üstündeki "heyecan" çizgileri (portal kapaklarındaki gibi). */
function sparks(x: number, y: number, r: number) {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  for (const a of [-2.2, -1.57, -0.94]) {
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a) * (r + 30), y + Math.sin(a) * (r + 30));
    ctx.stroke();
  }
  ctx.restore();
}

function characters() {
  tile(340, 650, 250, -0.12, 'R', 24, 1);
  sparks(340, 640, 190);
  tile(1580, 660, 240, 0.1, 'G', 18, 2);
  sparks(1580, 650, 185);
  tile(1745, 380, 120, 0.16, 'Y', 7, 3);
  tile(175, 380, 120, -0.18, 'K', 12, 4);
}

function frame() {
  background();
  tray();
  ants();
  characters();
  title();
}

void Promise.all([document.fonts.load('250px "Lilita One"'), document.fonts.load('800 42px "Baloo 2"')]).then(frame);

document.getElementById('save')!.addEventListener('click', async () => {
  const r = await fetch('/__save-cover', { method: 'POST', body: cv.toDataURL('image/png') });
  document.getElementById('saved')!.textContent = r.ok ? 'Kaydedildi: docs/kapak.png' : 'Kaydedilemedi';
});
