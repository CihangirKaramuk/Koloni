/**
 * Ek bölüm çizimleri: şekiller / semboller ve günlük eşyalar.
 * Kurallar illustrations.ts ile aynı: 400×400 tuval, kalın siyah kontur, yalnızca palet harfleri.
 */
import { arcPts, circ, ell, fill, line, obj, part, poly, rrect, starPts, within, type Illustration } from './illustrations';

export const EXTRA_SHAPES_OBJECTS: Illustration[] = [
  /* ---------- Şekiller ve semboller ---------- */
  {
    id: 'heart',
    name: { tr: 'Kalp', en: 'Heart' },
    size: 34,
    draw(g) {
      const body = [circ(130, 150, 100), circ(270, 150, 100), poly(38, 185, 362, 185, 200, 370)];
      obj(g, 'R', ...body);
      within(g, body, () => {
        fill(g, 'r', poly(200, 200, 400, 140, 400, 400, 200, 400));
        fill(g, 'S', ell(110, 120, 34, 22, -0.6));
      });
    },
  },
  {
    id: 'moon',
    name: { tr: 'Ay', en: 'Moon' },
    size: 34,
    draw(g) {
      const body = [poly(...arcPts(200, 200, 170, Math.PI * 0.3, Math.PI * 1.7, 24), ...arcPts(270, 170, 140, Math.PI * 1.55, Math.PI * 0.45, 24))];
      obj(g, 'Y', ...body);
      within(g, body, () => {
        fill(g, 'y', circ(140, 290, 80));
        for (const [x, y, r] of [[95, 170, 18], [130, 250, 12], [160, 95, 14]]) fill(g, 'y', circ(x, y, r));
      });
      fill(g, 'K', circ(110, 210, 10));
      line(g, 'K', 6, 120, 255, 140, 262, 158, 252);
      for (const [x, y] of [[320, 80], [350, 300], [300, 360]]) fill(g, 'Y', poly(...starPts(x, y, 24, 10)));
    },
  },
  {
    id: 'sun',
    name: { tr: 'Güneş', en: 'Sun' },
    size: 36,
    draw(g) {
      const rays: number[] = [];
      for (let k = 0; k < 24; k++) {
        const a = (k * Math.PI) / 12 - Math.PI / 2;
        const r = k % 2 === 0 ? 190 : 140;
        rays.push(200 + Math.cos(a) * r, 200 + Math.sin(a) * r);
      }
      obj(g, 'O', poly(...rays));
      const face = [circ(200, 200, 120)];
      obj(g, 'Y', ...face);
      within(g, face, () => fill(g, 'y', circ(260, 270, 110)));
      fill(g, 'K', ell(160, 185, 13, 18));
      fill(g, 'K', ell(240, 185, 13, 18));
      line(g, 'K', 8, 160, 235, 200, 258, 240, 235);
      fill(g, 'O', ell(135, 225, 18, 10));
      fill(g, 'O', ell(265, 225, 18, 10));
    },
  },
  {
    id: 'cloud',
    name: { tr: 'Bulut', en: 'Cloud' },
    size: 36,
    draw(g) {
      const body = [circ(130, 220, 80), circ(210, 165, 100), circ(290, 220, 80), rrect(60, 210, 290, 90, 45)];
      obj(g, 'W', ...body);
      within(g, body, () => fill(g, 'b', rrect(40, 265, 330, 60, 0)));
      fill(g, 'K', ell(170, 215, 11, 16));
      fill(g, 'K', ell(240, 215, 11, 16));
      line(g, 'K', 7, 185, 245, 205, 258, 225, 245);
      for (const [x, y] of [[110, 350], [200, 370], [290, 350]]) part(g, 'B', ell(x, y, 12, 20), 8);
    },
  },
  {
    id: 'lightning',
    name: { tr: 'Şimşek', en: 'Lightning' },
    size: 36,
    draw(g) {
      const bolt = [poly(230, 15, 90, 225, 185, 225, 150, 390, 320, 160, 215, 160, 270, 15)];
      obj(g, 'Y', ...bolt);
      within(g, bolt, () => fill(g, 'O', poly(200, 160, 400, 160, 400, 400, 150, 400)));
      fill(g, 'c', poly(225, 40, 150, 170, 170, 170));
    },
  },
  {
    id: 'gem',
    name: { tr: 'Elmas', en: 'Gem' },
    size: 36,
    draw(g) {
      const gem = [poly(110, 70, 290, 70, 370, 160, 200, 370, 30, 160)];
      obj(g, 'C', ...gem);
      within(g, gem, () => {
        fill(g, 'b', poly(110, 70, 200, 160, 30, 160));
        fill(g, 'b', poly(200, 70, 290, 70, 250, 160, 150, 160));
        fill(g, 'b', poly(150, 160, 250, 160, 200, 370));
        fill(g, 'U', poly(290, 70, 370, 160, 250, 160));
        fill(g, 'U', poly(250, 160, 370, 160, 200, 370));
      });
      for (const pts of [[30, 160, 370, 160], [110, 70, 150, 160, 200, 370], [290, 70, 250, 160, 200, 370], [200, 70, 150, 160], [200, 70, 250, 160]]) line(g, 'K', 9, ...pts);
      fill(g, 'W', poly(120, 95, 150, 95, 125, 130));
    },
  },
  {
    id: 'clover',
    name: { tr: 'Yonca', en: 'Clover' },
    size: 34,
    draw(g) {
      line(g, 'K', 34, 200, 220, 250, 385);
      line(g, 'g', 18, 200, 220, 250, 385);
      // Dört ayrı kalp yaprak: her biri kendi konturuyla, aralarında çizgi kalsın.
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2 - Math.PI / 4;
        const cx = 200 + Math.cos(a) * 85;
        const cy = 185 + Math.sin(a) * 85;
        const side = a + Math.PI / 2;
        const lobes = [circ(cx + Math.cos(side) * 40, cy + Math.sin(side) * 40, 52), circ(cx - Math.cos(side) * 40, cy - Math.sin(side) * 40, 52), poly(200, 185, cx + Math.cos(side) * 80, cy + Math.sin(side) * 80, cx - Math.cos(side) * 80, cy - Math.sin(side) * 80)];
        obj(g, 'G', ...lobes);
        within(g, lobes, () => fill(g, 'g', circ(cx + Math.cos(a) * 60 + 30, cy + Math.sin(a) * 60 + 40, 60)));
      }
      fill(g, 'L', circ(200, 185, 16));
    },
  },
  {
    id: 'snowflake',
    name: { tr: 'Kar Tanesi', en: 'Snowflake' },
    size: 36,
    draw(g) {
      for (const [ch, w] of [['K', 54], ['b', 30]] as const) {
        for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI) / 3 - Math.PI / 2;
          const ex = 200 + Math.cos(a) * 175;
          const ey = 200 + Math.sin(a) * 175;
          line(g, ch, w, 200, 200, ex, ey);
          const mx = 200 + Math.cos(a) * 110;
          const my = 200 + Math.sin(a) * 110;
          for (const s of [-1, 1]) line(g, ch, w * 0.8, mx, my, mx + Math.cos(a + s * 0.9) * 55, my + Math.sin(a + s * 0.9) * 55);
        }
      }
      part(g, 'W', circ(200, 200, 40), 14);
    },
  },
  {
    id: 'note',
    name: { tr: 'Nota', en: 'Music Note' },
    size: 36,
    draw(g) {
      const shape = [ell(110, 320, 70, 52, -0.35), ell(290, 280, 70, 52, -0.35), rrect(150, 70, 36, 250, 10), rrect(328, 40, 36, 240, 10), poly(150, 70, 364, 30, 364, 100, 150, 140)];
      obj(g, 'p', ...shape);
      within(g, shape, () => {
        fill(g, 'u', ell(140, 350, 70, 40, -0.35));
        fill(g, 'u', ell(320, 310, 70, 40, -0.35));
        fill(g, 'V', ell(85, 305, 20, 10, -0.35));
        fill(g, 'V', ell(265, 265, 20, 10, -0.35));
      });
    },
  },
  {
    id: 'smiley',
    name: { tr: 'Gülen Yüz', en: 'Smiley' },
    size: 34,
    draw(g) {
      const face = [circ(200, 200, 175)];
      obj(g, 'Y', ...face);
      within(g, face, () => fill(g, 'y', circ(290, 300, 180)));
      fill(g, 'K', ell(140, 150, 22, 36));
      fill(g, 'K', ell(260, 150, 22, 36));
      fill(g, 'W', circ(146, 138, 8));
      fill(g, 'W', circ(266, 138, 8));
      const mouth = [poly(...arcPts(200, 220, 110, 0.15, Math.PI - 0.15, 18))];
      obj(g, 'r', ...mouth);
      within(g, mouth, () => fill(g, 'P', ell(200, 320, 60, 30)));
      fill(g, 'O', ell(100, 230, 26, 14));
      fill(g, 'O', ell(300, 230, 26, 14));
    },
  },
  {
    id: 'drop',
    name: { tr: 'Damla', en: 'Drop' },
    size: 34,
    draw(g) {
      const body = [circ(200, 255, 135), poly(200, 20, 330, 220, 70, 220)];
      obj(g, 'B', ...body);
      within(g, body, () => {
        fill(g, 'U', circ(270, 330, 140));
        fill(g, 'b', ell(140, 250, 26, 60, 0.3));
      });
      fill(g, 'K', ell(165, 260, 12, 18));
      fill(g, 'K', ell(235, 260, 12, 18));
      line(g, 'K', 7, 180, 300, 200, 312, 220, 300);
    },
  },
  {
    id: 'shield',
    name: { tr: 'Kalkan', en: 'Shield' },
    size: 36,
    draw(g) {
      const body = [poly(200, 20, 360, 70, 345, 230, 200, 385, 55, 230, 40, 70)];
      obj(g, 'B', ...body);
      within(g, body, () => {
        fill(g, 'U', poly(200, 0, 400, 0, 400, 400, 200, 400));
        fill(g, 'W', poly(200, 70, 310, 105, 300, 220, 200, 320, 100, 220, 90, 105));
        fill(g, 'R', poly(200, 70, 310, 105, 300, 220, 200, 320));
      });
      fill(g, 'Y', poly(...starPts(200, 190, 62, 26)));
    },
  },

  /* ---------- Eşyalar ---------- */
  {
    id: 'umbrella',
    name: { tr: 'Şemsiye', en: 'Umbrella' },
    size: 36,
    draw(g) {
      line(g, 'K', 30, 200, 160, 200, 330, 240, 360, 270, 330);
      line(g, 'N', 14, 200, 160, 200, 330, 240, 360, 270, 330);
      const top = [poly(...arcPts(200, 200, 180, Math.PI, Math.PI * 2, 24), 340, 200, 300, 225, 255, 200, 200, 225, 145, 200, 100, 225, 60, 200)];
      obj(g, 'R', ...top);
      within(g, top, () => {
        fill(g, 'W', poly(200, 20, 145, 200, 255, 200));
        fill(g, 'r', poly(200, 20, 400, 200, 400, 240, 255, 240));
      });
      part(g, 'Y', circ(200, 22, 14), 8);
    },
  },
  {
    id: 'key',
    name: { tr: 'Anahtar', en: 'Key' },
    size: 36,
    draw(g) {
      const key = [circ(115, 200, 90), rrect(180, 175, 200, 50, 12), rrect(300, 210, 34, 70, 6), rrect(345, 210, 34, 50, 6)];
      obj(g, 'Y', ...key);
      within(g, key, () => fill(g, 'y', rrect(0, 210, 400, 120, 0)));
      part(g, 'c', circ(115, 200, 38), 14);
      fill(g, 'W', ell(80, 150, 18, 10, -0.6));
    },
  },
  {
    id: 'bell',
    name: { tr: 'Çan', en: 'Bell' },
    size: 34,
    draw(g) {
      part(g, 'R', ell(200, 40, 50, 26), 12);
      part(g, 'N', circ(200, 345, 34));
      const body = [poly(...arcPts(200, 170, 110, Math.PI, Math.PI * 2, 18), 310, 280, 360, 330, 40, 330, 90, 280)];
      obj(g, 'Y', ...body);
      within(g, body, () => {
        fill(g, 'y', poly(250, 50, 400, 50, 400, 340, 290, 340));
        fill(g, 'O', rrect(0, 300, 400, 40, 0));
        fill(g, 'c', ell(150, 150, 18, 46, 0.2));
      });
    },
  },
  {
    id: 'gift',
    name: { tr: 'Hediye', en: 'Gift' },
    size: 34,
    draw(g) {
      const bow = [ell(145, 85, 60, 40, -0.4), ell(255, 85, 60, 40, 0.4)];
      obj(g, 'Y', ...bow);
      const box = [rrect(55, 170, 290, 210, 18), rrect(35, 120, 330, 70, 16)];
      obj(g, 'P', ...box);
      within(g, box, () => {
        fill(g, 'q', rrect(0, 300, 400, 100, 0));
        fill(g, 'q', rrect(0, 168, 400, 18, 0));
        fill(g, 'Y', rrect(175, 100, 50, 300, 0));
      });
      part(g, 'y', circ(200, 105, 26), 10);
    },
  },
  {
    id: 'mug',
    name: { tr: 'Kupa', en: 'Mug' },
    size: 34,
    draw(g) {
      for (const x of [140, 200, 260]) line(g, 'w', 12, x, 95, x - 15, 60, x + 5, 25);
      line(g, 'K', 70, 290, 200, 345, 215, 345, 275, 290, 300);
      line(g, 'R', 38, 290, 200, 345, 215, 345, 275, 290, 300);
      const cup = [rrect(60, 120, 250, 250, 40)];
      obj(g, 'R', ...cup);
      within(g, cup, () => {
        fill(g, 'r', rrect(220, 100, 120, 300, 0));
        fill(g, 'N', ell(185, 125, 125, 18));
      });
      part(g, 'W', poly(...heartPts(185, 250, 50)), 10);
    },
  },
  {
    id: 'guitar',
    name: { tr: 'Gitar', en: 'Guitar' },
    size: 38,
    draw(g) {
      line(g, 'K', 58, 250, 150, 360, 40);
      line(g, 'N', 34, 250, 150, 360, 40);
      part(g, 'M', poly(335, 20, 385, 15, 390, 60, 360, 70), 10);
      const body = [circ(240, 165, 70), circ(160, 265, 105)];
      obj(g, 'O', ...body);
      within(g, body, () => fill(g, 'D', circ(220, 330, 120)));
      part(g, 'K', circ(185, 235, 32), 8);
      part(g, 'N', rrect(95, 285, 80, 26, 8), 8);
      for (const o of [-8, 8]) line(g, 'W', 3, 130 + o, 300 + o, 360 + o, 45 + o);
    },
  },
  {
    id: 'camera',
    name: { tr: 'Kamera', en: 'Camera' },
    size: 36,
    draw(g) {
      const body = [rrect(30, 110, 340, 230, 34), rrect(130, 70, 140, 60, 16)];
      obj(g, 'w', ...body);
      within(g, body, () => {
        fill(g, 'K', rrect(0, 170, 400, 120, 0));
        fill(g, 'W', rrect(0, 100, 400, 40, 0));
      });
      part(g, 'w', circ(200, 230, 95), 16);
      fill(g, 'K', circ(200, 230, 70));
      fill(g, 'U', circ(200, 230, 52));
      fill(g, 'b', circ(180, 210, 16));
      part(g, 'R', circ(320, 145, 14), 8);
      part(g, 'Y', rrect(60, 130, 50, 26, 6), 8);
    },
  },
  {
    id: 'bulb',
    name: { tr: 'Ampul', en: 'Light Bulb' },
    size: 36,
    draw(g) {
      part(g, 'w', rrect(140, 280, 120, 90, 18));
      for (const y of [305, 335]) line(g, 'K', 7, 145, y, 255, y);
      const glass = [circ(200, 160, 135), poly(120, 240, 280, 240, 255, 295, 145, 295)];
      obj(g, 'Y', ...glass);
      within(g, glass, () => {
        fill(g, 'y', circ(270, 230, 120));
        fill(g, 'c', ell(140, 110, 26, 48, 0.4));
      });
      line(g, 'O', 9, 170, 290, 170, 210, 190, 180, 210, 210, 230, 180, 230, 290);
    },
  },
  {
    id: 'clock',
    name: { tr: 'Saat', en: 'Clock' },
    size: 34,
    draw(g) {
      obj(g, 'R', circ(90, 75, 50), circ(310, 75, 50));
      line(g, 'K', 24, 110, 360, 90, 385);
      line(g, 'K', 24, 290, 360, 310, 385);
      const rim = [circ(200, 215, 165)];
      obj(g, 'R', ...rim);
      within(g, rim, () => fill(g, 'r', circ(270, 300, 160)));
      part(g, 'W', circ(200, 215, 125), 12);
      for (let k = 0; k < 12; k++) {
        const a = (k * Math.PI) / 6;
        fill(g, 'K', circ(200 + Math.cos(a) * 100, 215 + Math.sin(a) * 100, k % 3 === 0 ? 11 : 6));
      }
      line(g, 'K', 14, 200, 215, 200, 135);
      line(g, 'K', 14, 200, 215, 260, 245);
      fill(g, 'R', circ(200, 215, 14));
    },
  },
  {
    id: 'book',
    name: { tr: 'Kitap', en: 'Book' },
    size: 36,
    draw(g) {
      const book = [rrect(50, 50, 300, 320, 22)];
      obj(g, 'B', ...book);
      within(g, book, () => {
        fill(g, 'U', rrect(50, 40, 50, 340, 0));
        fill(g, 'W', rrect(300, 70, 60, 290, 0));
      });
      for (const y of [110, 150, 190, 230, 270, 310]) line(g, 'w', 4, 305, y, 345, y);
      part(g, 'Y', rrect(140, 120, 130, 70, 12), 10);
      part(g, 'Y', poly(...starPtsSmall(205, 270)), 8);
    },
  },
  {
    id: 'pencil',
    name: { tr: 'Kalem', en: 'Pencil' },
    size: 38,
    draw(g) {
      const body = [poly(75, 325, 290, 110, 340, 160, 125, 375), poly(75, 325, 125, 375, 30, 395, 50, 345)];
      obj(g, 'Y', ...body);
      within(g, body, () => {
        fill(g, 'O', poly(100, 350, 315, 135, 340, 160, 125, 375));
        fill(g, 'n', poly(75, 325, 125, 375, 30, 400, 0, 400, 0, 350));
        fill(g, 'K', poly(60, 375, 30, 400, 0, 400, 30, 365));
      });
      const back = [poly(290, 110, 330, 70, 380, 120, 340, 160)];
      obj(g, 'w', ...back);
      part(g, 'P', poly(330, 70, 350, 50, 400, 100, 380, 120), 12);
    },
  },
  {
    id: 'palette',
    name: { tr: 'Boya Paleti', en: 'Paint Palette' },
    size: 36,
    draw(g) {
      const body = [ell(200, 210, 185, 150)];
      obj(g, 'n', ...body);
      within(g, body, () => fill(g, 'T', ell(240, 300, 190, 90)));
      part(g, 'W', circ(270, 270, 34), 12);
      for (const [x, y, ch] of [[110, 150, 'R'], [185, 100, 'Y'], [270, 120, 'B'], [320, 190, 'G'], [100, 250, 'p'], [175, 300, 'O']] as const) part(g, ch, circ(x, y, 30), 10);
    },
  },
  {
    id: 'kite',
    name: { tr: 'Uçurtma', en: 'Kite' },
    size: 36,
    draw(g) {
      line(g, 'K', 6, 200, 300, 170, 340, 220, 360, 180, 395);
      for (const [x, y, ch] of [[170, 340, 'R'], [220, 360, 'Y'], [180, 392, 'B']] as const) part(g, ch, poly(x - 20, y - 12, x + 20, y + 12, x + 20, y - 12, x - 20, y + 12), 6);
      const kite = [poly(200, 15, 330, 150, 200, 310, 70, 150)];
      obj(g, 'R', ...kite);
      within(g, kite, () => {
        fill(g, 'Y', poly(200, 15, 330, 150, 200, 150));
        fill(g, 'Y', poly(200, 150, 70, 150, 200, 310));
        fill(g, 'B', poly(200, 15, 70, 150, 200, 150));
      });
      line(g, 'K', 8, 200, 15, 200, 310);
      line(g, 'K', 8, 70, 150, 330, 150);
    },
  },
  {
    id: 'anchor',
    name: { tr: 'Çapa', en: 'Anchor' },
    size: 36,
    draw(g) {
      const shape = [
        rrect(178, 70, 44, 290, 14),
        rrect(110, 120, 180, 40, 14),
        poly(...arcPts(200, 220, 150, Math.PI * 0.08, Math.PI * 0.92, 18), ...arcPts(200, 220, 110, Math.PI * 0.9, Math.PI * 0.1, 18)),
        poly(30, 230, 80, 220, 60, 280),
        poly(370, 230, 320, 220, 340, 280),
      ];
      obj(g, 'U', ...shape);
      within(g, shape, () => fill(g, 'B', rrect(0, 0, 200, 400, 0)));
      part(g, 'w', circ(200, 50, 36), 16);
      fill(g, 'n', circ(200, 50, 16));
    },
  },
  {
    id: 'trophy',
    name: { tr: 'Kupa Ödülü', en: 'Trophy' },
    size: 36,
    draw(g) {
      line(g, 'K', 40, 95, 90, 40, 110, 50, 190, 120, 210);
      line(g, 'Y', 20, 95, 90, 40, 110, 50, 190, 120, 210);
      line(g, 'K', 40, 305, 90, 360, 110, 350, 190, 280, 210);
      line(g, 'Y', 20, 305, 90, 360, 110, 350, 190, 280, 210);
      const cup = [poly(80, 50, 320, 50, 300, 190, 240, 250, 160, 250, 100, 190), rrect(170, 240, 60, 70, 8)];
      obj(g, 'Y', ...cup);
      within(g, cup, () => {
        fill(g, 'y', poly(220, 40, 330, 40, 330, 320, 200, 320));
        fill(g, 'c', ell(140, 110, 18, 46, 0.1));
      });
      part(g, 'N', rrect(110, 300, 180, 70, 14));
      part(g, 'Y', rrect(150, 320, 100, 30, 8), 8);
      fill(g, 'O', poly(...starPts(200, 140, 44, 18)));
    },
  },
  {
    id: 'magnet',
    name: { tr: 'Mıknatıs', en: 'Magnet' },
    size: 36,
    draw(g) {
      const body = [poly(...arcPts(200, 180, 160, Math.PI, Math.PI * 2, 24), 360, 330, 270, 330, 270, ...arcPts(200, 180, 70, 0, -Math.PI, 18).slice(1), 130, 330, 40, 330)];
      obj(g, 'R', ...body);
      within(g, body, () => {
        fill(g, 'r', rrect(200, 0, 200, 400, 0));
        fill(g, 'w', rrect(0, 260, 400, 80, 0));
      });
      line(g, 'K', 8, 40, 260, 130, 260);
      line(g, 'K', 8, 270, 260, 360, 260);
    },
  },
];

/** Küçük kalp (kupa üstü süs). */
function heartPts(cx: number, cy: number, s: number): number[] {
  const pts: number[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push(cx + (x * s) / 17, cy + (y * s) / 17);
  }
  return pts;
}

/** Kitap kapağındaki küçük yıldız. */
function starPtsSmall(cx: number, cy: number): number[] {
  return starPts(cx, cy, 42, 18);
}
