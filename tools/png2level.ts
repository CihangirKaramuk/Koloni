/**
 * PNG → bölüm çizimi dönüştürücü (yalnızca geliştirme sırasında: npm run dev → /tools/png2level.html).
 * Görseli küçültür, her pikseli oyun paletindeki en yakın renge eşler, renk sayısını sınırlar.
 */
import { buildLevel } from '../src/level/generator';
import { PALETTE } from '../src/level/palette';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const fileInput = $<HTMLInputElement>('file');
const drop = $('drop');
let img: HTMLImageElement | null = null;

const rgb = PALETTE.map((p) => {
  const n = parseInt(p.hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
});

function nearest(r: number, g: number, b: number, allowed: number[]): number {
  let best = allowed[0];
  let bd = Infinity;
  for (const i of allowed) {
    const [pr, pg, pb] = rgb[i];
    // Algısal ağırlıklı uzaklık
    const d = 2 * (r - pr) ** 2 + 4 * (g - pg) ** 2 + 3 * (b - pb) ** 2;
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return best;
}

function convert() {
  if (!img) return;
  const max = Number($<HTMLInputElement>('max').value) || 24;
  const maxColors = Number($<HTMLInputElement>('maxColors').value) || 6;
  const alphaCut = Number($<HTMLInputElement>('alpha').value) || 128;
  const s = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * s));
  const h = Math.max(1, Math.round(img.height * s));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  const all = PALETTE.map((_, i) => i);
  const ids: number[] = [];
  for (let i = 0; i < w * h; i++) {
    const a = data[i * 4 + 3];
    ids.push(a < alphaCut ? -1 : nearest(data[i * 4], data[i * 4 + 1], data[i * 4 + 2], all));
  }
  // En çok kullanılan renkleri tut, gerisini en yakın tutulana eşle.
  const counts = new Map<number, number>();
  ids.forEach((id) => id >= 0 && counts.set(id, (counts.get(id) ?? 0) + 1));
  const keep = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, maxColors).map(([k]) => k);
  const final = ids.map((id) => (id < 0 || keep.includes(id) ? id : nearest(rgb[id][0], rgb[id][1], rgb[id][2], keep)));

  // Boş kenarları kırp
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  final.forEach((id, i) => {
    if (id < 0) return;
    const x = i % w, y = (i / w) | 0;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  });
  if (x1 < 0) return;
  const rows: string[] = [];
  for (let y = y0; y <= y1; y++) {
    let row = '';
    for (let x = x0; x <= x1; x++) {
      const id = final[y * w + x];
      row += id < 0 ? '.' : PALETTE[id].char;
    }
    rows.push(row);
  }
  render(rows, keep);
}

function render(rows: string[], used: number[]) {
  const W = rows[0].length;
  const H = rows.length;
  const cv = $<HTMLCanvasElement>('preview');
  cv.width = W;
  cv.height = H;
  const scale = Math.max(4, Math.floor(320 / Math.max(W, H)));
  cv.style.width = `${W * scale}px`;
  cv.style.height = `${H * scale}px`;
  const ctx = cv.getContext('2d')!;
  ctx.clearRect(0, 0, W, H);
  rows.forEach((r, y) =>
    [...r].forEach((ch, x) => {
      const p = PALETTE.find((q) => q.char === ch);
      if (!p) return;
      ctx.fillStyle = p.hex;
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  $('info').textContent = `${W}×${H}`;
  $('pal').innerHTML = used
    .map((i) => `<span><i style="background:${PALETTE[i].hex}"></i>${PALETTE[i].char} ${PALETTE[i].name.tr}</span>`)
    .join('');

  try {
    const t0 = performance.now();
    const lv = buildLevel({ art: rows, slots: 4, columns: 4, maxStack: 12, seed: 1 });
    $('stats').textContent = `Örnek bölüm: ${lv.solution.length} grup, ${(performance.now() - t0).toFixed(0)} ms'de üretildi ve doğrulandı.`;
  } catch (e) {
    $('stats').textContent = `Bölüm üretilemedi: ${(e as Error).message}`;
  }

  const id = $<HTMLInputElement>('id').value.trim() || 'yeni';
  const tr = $<HTMLInputElement>('nameTr').value.trim() || 'Yeni';
  const en = $<HTMLInputElement>('nameEn').value.trim() || 'New';
  ($('out') as HTMLTextAreaElement).value =
    `  {\n    id: '${id}',\n    name: { tr: '${tr}', en: '${en}' },\n    rows: [\n${rows.map((r) => `      '${r}',`).join('\n')}\n    ],\n  },\n`;
}

function load(file: File) {
  const url = URL.createObjectURL(file);
  const im = new Image();
  im.onload = () => {
    img = im;
    convert();
  };
  im.src = url;
}

drop.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => fileInput.files?.[0] && load(fileInput.files[0]));
drop.addEventListener('dragover', (e) => e.preventDefault());
drop.addEventListener('drop', (e) => {
  e.preventDefault();
  const f = e.dataTransfer?.files[0];
  if (f) load(f);
});
['max', 'maxColors', 'alpha', 'id', 'nameTr', 'nameEn'].forEach((id) => $(id).addEventListener('input', convert));
$('copy').addEventListener('click', () => {
  const ta = $('out') as HTMLTextAreaElement;
  ta.select();
  void navigator.clipboard?.writeText(ta.value);
});
