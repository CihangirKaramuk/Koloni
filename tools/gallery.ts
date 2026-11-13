/**
 * İllüstrasyonları pikselleştirir ve src/level/art/generated.ts için kod üretir.
 * Kullanım: npm run dev → /tools/gallery.html → "TS kodunu kopyala" → generated.ts'e yapıştır.
 */
import { pixelize } from './pixelize';
import { ILLUSTRATIONS as BASE } from './illustrations';
import { EXTRA_FOOD_ANIMALS } from './illustrations-food-animals';
import { EXTRA_SHAPES_OBJECTS } from './illustrations-shapes-objects';
import { EXTRA_WORLD } from './illustrations-world';

const ILLUSTRATIONS = [...BASE, ...EXTRA_FOOD_ANIMALS, ...EXTRA_SHAPES_OBJECTS, ...EXTRA_WORLD];
// ?only=a,b,c → yalnızca bu çizimleri göster (hızlı kontrol için; kaydetme kapalı).
const only = new URLSearchParams(location.search).get('only')?.split(',');
import { CHAR_TO_COLOR, PALETTE } from '../src/level/palette';

/** levels.ts'deki boyut kademeleriyle aynı sırada: 1.6× ve 1.85×. */
const BIG_SCALES = [1.6, 1.85];

const grid = document.getElementById('grid')!;
const results: { id: string; name: { tr: string; en: string }; rows: string[]; hd: string[]; big: string[][] }[] = [];

await document.fonts.ready;
for (const il of ILLUSTRATIONS) {
  if (only && !only.includes(il.id)) continue;
  const src = document.createElement('canvas');
  src.width = 400;
  src.height = 400;
  const g = src.getContext('2d')!;
  // Kenarlardan taşan kontur için biraz pay bırak
  g.translate(20, 20);
  g.scale(0.9, 0.9);
  il.draw(g);
  const rows = pixelize(src, il.size);
  // Zor bölümler için aynı çizimin daha yüksek çözünürlüklü (daha detaylı) hali
  const hd = pixelize(src, Math.round(il.size * 1.35));
  // İleri bölümler için daha da büyük (daha çok pikselli, daha uzun süren) haller
  const big = BIG_SCALES.map((k) => pixelize(src, Math.round(il.size * k)));
  results.push({ id: il.id, name: il.name, rows, hd, big });

  const W = rows[0].length;
  const H = rows.length;
  const px = document.createElement('canvas');
  px.width = W;
  px.height = H;
  const pg = px.getContext('2d')!;
  rows.forEach((r, y) =>
    [...r].forEach((ch, x) => {
      if (ch === '.') return;
      pg.fillStyle = PALETTE[CHAR_TO_COLOR[ch]].hex;
      pg.fillRect(x, y, 1, 1);
    }),
  );
  const s = Math.floor(200 / Math.max(W, H));
  px.style.width = `${W * s}px`;
  px.style.height = `${H * s}px`;
  src.className = 'src';
  const cells = rows.join('').replace(/\./g, '').length;
  const colors = new Set(rows.join('').replace(/\./g, '')).size;
  const item = document.createElement('div');
  item.className = 'item';
  item.innerHTML = `<b>${il.name.tr}</b><br>${W}×${H} · ${cells} blok · ${colors} renk · detaylı: ${hd[0].length}×${hd.length} · büyük: ${big.map((b) => `${b[0].length}×${b.length}`).join(', ')}`;
  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.gap = '8px';
  row.style.alignItems = 'center';
  row.append(src, px);
  item.append(row);
  grid.append(item);
}

const code =
  `// OTOMATİK ÜRETİLDİ: tools/gallery.html (tools/illustrations.ts'ten). Elle düzenleme yerine illüstrasyonu değiştir.\n` +
  `import type { PixelArt } from './foods';\n\nexport const GENERATED: PixelArt[] = ${JSON.stringify(results, null, 2)};\n`;
(document.getElementById('out') as HTMLTextAreaElement).value = code;
(window as unknown as { __generated: string }).__generated = code;
document.getElementById('copy')!.addEventListener('click', () => navigator.clipboard?.writeText(code));
document.getElementById('save')!.addEventListener('click', async () => {
  if (only) {
    document.getElementById('saved')!.textContent = 'Filtreli görünümde kaydedilmez (tüm çizimler gerekli).';
    return;
  }
  const r = await fetch('/__save-generated', { method: 'POST', body: code });
  document.getElementById('saved')!.textContent = r.ok ? 'Kaydedildi: src/level/art/generated.ts' : 'Kaydedilemedi';
});
