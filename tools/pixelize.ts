/**
 * Bir resmi oyun paletinde piksel çizime çevirir.
 * Her hücre, kapsadığı kaynak piksellerin en sık rengini alır (oy çokluğu).
 * Kontur rengi ince kalmasın diye daha ağır oy kullanır.
 */
import { PALETTE } from '../src/level/palette';

const RGB = PALETTE.map((p) => {
  const n = parseInt(p.hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
});
const OUTLINE = PALETTE.findIndex((p) => p.char === 'K');

function nearest(r: number, g: number, b: number): number {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < RGB.length; i++) {
    const [pr, pg, pb] = RGB[i];
    const d = 2 * (r - pr) ** 2 + 4 * (g - pg) ** 2 + 3 * (b - pb) ** 2;
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return best;
}

export function pixelize(src: HTMLCanvasElement, size: number, outlineWeight = 1.9): string[] {
  const g = src.getContext('2d')!;
  const { width: SW, height: SH } = src;
  const data = g.getImageData(0, 0, SW, SH).data;
  // Dolu piksellerin sınır kutusu
  let x0 = SW, y0 = SH, x1 = -1, y1 = -1;
  for (let y = 0; y < SH; y++)
    for (let x = 0; x < SW; x++)
      if (data[(y * SW + x) * 4 + 3] > 128) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return ['.'];
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  const block = Math.max(bw, bh) / size;
  const W = Math.max(1, Math.round(bw / block));
  const H = Math.max(1, Math.round(bh / block));
  const cache = new Map<number, number>();
  const rows: string[] = [];
  for (let cy = 0; cy < H; cy++) {
    let row = '';
    for (let cx = 0; cx < W; cx++) {
      const sx0 = Math.floor(x0 + cx * block), sx1 = Math.floor(x0 + (cx + 1) * block);
      const sy0 = Math.floor(y0 + cy * block), sy1 = Math.floor(y0 + (cy + 1) * block);
      const votes = new Map<number, number>();
      let empty = 0, total = 0;
      for (let y = sy0; y < sy1; y++)
        for (let x = sx0; x < sx1; x++) {
          const i = (y * SW + x) * 4;
          total++;
          if (data[i + 3] < 128) {
            empty++;
            continue;
          }
          const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
          let id = cache.get(key);
          if (id === undefined) {
            id = nearest(data[i], data[i + 1], data[i + 2]);
            cache.set(key, id);
          }
          votes.set(id, (votes.get(id) ?? 0) + (id === OUTLINE ? outlineWeight : 1));
        }
      if (total === 0 || empty / total > 0.5) {
        row += '.';
        continue;
      }
      let best = -1, bv = -1;
      for (const [id, v] of votes) if (v > bv) { bv = v; best = id; }
      row += PALETTE[best].char;
    }
    rows.push(row);
  }
  return rows;
}
