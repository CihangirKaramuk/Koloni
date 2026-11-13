/**
 * Bölüm illüstrasyonları. Her biri 400×400'lük bir tuvale vektör olarak çizilir
 * (konturlu, gölgeli, parlamalı), sonra tools/gallery.ts tarafından pikselleştirilip
 * oyun paletine çevrilir. Yeni bölüm resmi = buraya yeni bir çizim fonksiyonu.
 *
 * Kural: sadece paletteki renkleri kullan (hex yerine palet harfi), böylece
 * pikselleştirme temiz çıkar.
 */
import { CHAR_TO_COLOR, PALETTE } from '../src/level/palette';

type G = CanvasRenderingContext2D;
export interface Illustration {
  id: string;
  name: { tr: string; en: string };
  /** Piksel resmin uzun kenarı (hücre sayısı). */
  size: number;
  draw(g: G): void;
}

const hex = (ch: string) => PALETTE[CHAR_TO_COLOR[ch]].hex;
const OW = 26; // kontur kalınlığı (400'lük tuvalde)

/* ---------- Çizim yardımcıları ---------- */
type Build = (g: G) => void;
const circ = (x: number, y: number, r: number): Build => (g) => g.arc(x, y, r, 0, Math.PI * 2);
const ell = (x: number, y: number, rx: number, ry: number, rot = 0): Build => (g) => g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
const rrect = (x: number, y: number, w: number, h: number, r: number): Build => (g) => g.roundRect(x, y, w, h, r);
const poly = (...pts: number[]): Build => (g) => {
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.closePath();
};

/** Konturlu nesne: önce tüm parçaların konturu, sonra dolguları (birleşik siluet). */
function obj(g: G, ch: string, ...parts: Build[]) {
  g.lineJoin = 'round';
  g.lineWidth = OW;
  g.strokeStyle = hex('K');
  for (const p of parts) {
    g.beginPath();
    p(g);
    g.stroke();
  }
  g.fillStyle = hex(ch);
  for (const p of parts) {
    g.beginPath();
    p(g);
    g.fill();
  }
}
/** Konturlu tek parça (detaylar için ince kontur). */
function part(g: G, ch: string, b: Build, ow = OW * 0.8) {
  g.beginPath();
  b(g);
  g.lineJoin = 'round';
  g.lineWidth = ow;
  g.strokeStyle = hex('K');
  g.stroke();
  g.fillStyle = hex(ch);
  g.fill();
}
/** Konstursuz dolgu. */
function fill(g: G, ch: string, b: Build) {
  g.beginPath();
  b(g);
  g.fillStyle = hex(ch);
  g.fill();
}
/** clip içinde çiz: gölge / parlama bölgeleri nesnenin dışına taşmaz. */
function within(g: G, clip: Build[], fn: () => void) {
  g.save();
  g.beginPath();
  clip.forEach((c) => c(g));
  g.clip();
  fn();
  g.restore();
}
function line(g: G, ch: string, w: number, ...pts: number[]) {
  g.beginPath();
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.lineWidth = w;
  g.strokeStyle = hex(ch);
  g.stroke();
}

/* ---------- Yemekler ---------- */

export const ILLUSTRATIONS: Illustration[] = [
  {
    id: 'apple',
    name: { tr: 'Elma', en: 'Apple' },
    size: 32,
    draw(g) {
      const body = [circ(150, 230, 120), circ(250, 230, 120), ell(200, 300, 150, 80)];
      obj(g, 'R', ...body);
      within(g, body, () => {
        fill(g, 'r', circ(300, 330, 170));
        fill(g, 'R', circ(170, 210, 140));
        fill(g, 'W', ell(120, 180, 26, 48, 0.4));
      });
      part(g, 'N', rrect(188, 40, 26, 110, 10));
      part(g, 'G', ell(280, 90, 70, 34, -0.45));
      line(g, 'g', 10, 225, 115, 330, 70);
    },
  },
  {
    id: 'strawberry',
    name: { tr: 'Çilek', en: 'Strawberry' },
    size: 34,
    draw(g) {
      const body = [poly(70, 150, 330, 150, 300, 260, 200, 380, 100, 260), circ(130, 175, 75), circ(270, 175, 75)];
      obj(g, 'R', ...body);
      within(g, body, () => {
        fill(g, 'r', circ(300, 330, 160));
        fill(g, 'R', circ(170, 190, 150));
        fill(g, 'S', ell(120, 180, 22, 40, 0.3));
      });
      for (const [x, y] of [[150, 200], [210, 190], [260, 220], [180, 260], [240, 280], [120, 240], [200, 330], [290, 180]])
        fill(g, 'Y', ell(x, y, 9, 13));
      obj(g, 'G', poly(110, 140, 160, 90, 200, 125, 240, 85, 290, 140, 250, 165, 200, 150, 150, 170));
      part(g, 'g', rrect(190, 40, 22, 70, 8));
    },
  },
  {
    id: 'cherries',
    name: { tr: 'Kiraz', en: 'Cherries' },
    size: 34,
    draw(g) {
      line(g, 'K', 30, 140, 280, 215, 70, 290, 270);
      line(g, 'G', 14, 140, 280, 215, 70, 290, 270);
      part(g, 'G', ell(270, 70, 70, 32, 0.35));
      line(g, 'g', 8, 225, 60, 320, 90);
      for (const [x, y] of [[130, 290], [290, 280]]) {
        const c = [circ(x, y, 82)];
        obj(g, 'R', ...c);
        within(g, c, () => {
          fill(g, 'r', circ(x + 50, y + 55, 90));
          fill(g, 'W', ell(x - 32, y - 30, 16, 26, 0.5));
        });
      }
    },
  },
  {
    id: 'donut',
    name: { tr: 'Donut', en: 'Donut' },
    size: 37,
    draw(g) {
      const ring = (g2: G) => {
        g2.arc(200, 200, 175, 0, Math.PI * 2);
        g2.moveTo(255, 200);
        g2.arc(200, 200, 55, 0, Math.PI * 2, true);
      };
      g.lineWidth = OW;
      g.strokeStyle = hex('K');
      g.beginPath();
      ring(g);
      g.stroke();
      g.fillStyle = hex('n');
      g.fill('evenodd');
      within(g, [ring], () => fill(g, 'T', circ(250, 260, 170)));
      // Pembe krema (dalgalı kenar)
      const icing = (g2: G) => {
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 18) {
          const r = 150 + Math.sin(a * 6) * 12;
          const x = 200 + Math.cos(a) * r;
          const y = 195 + Math.sin(a) * r;
          if (a === 0) g2.moveTo(x, y);
          else g2.lineTo(x, y);
        }
        g2.moveTo(272, 195);
        g2.arc(200, 195, 72, 0, Math.PI * 2, true);
      };
      g.beginPath();
      icing(g);
      g.lineWidth = OW * 0.7;
      g.stroke();
      g.fillStyle = hex('P');
      g.fill('evenodd');
      within(g, [icing], () => {
        fill(g, 'q', circ(260, 250, 140));
        fill(g, 'P', circ(185, 180, 150));
      });
      const sprinkles: [number, number, string][] = [
        [120, 140, 'Y'], [170, 90, 'B'], [250, 95, 'W'], [300, 150, 'Y'], [310, 230, 'B'], [260, 300, 'W'],
        [180, 310, 'Y'], [110, 250, 'B'], [95, 190, 'W'], [215, 70, 'G'], [330, 190, 'G'], [140, 300, 'G'],
      ];
      for (const [x, y, c] of sprinkles) part(g, c, rrect(x - 14, y - 7, 28, 14, 7), 6);
      fill(g, 'W', ell(130, 120, 20, 10, -0.6));
    },
  },
  {
    id: 'watermelon',
    name: { tr: 'Karpuz', en: 'Watermelon' },
    size: 39,
    draw(g) {
      const slice = (r: number) => (g2: G) => {
        g2.moveTo(200 - r, 130);
        g2.arc(200, 130, r, Math.PI, 0, true);
        g2.closePath();
      };
      obj(g, 'g', slice(185));
      fill(g, 'G', slice(160));
      fill(g, 'W', slice(140));
      fill(g, 'R', slice(126));
      within(g, [slice(126)], () => fill(g, 'r', circ(320, 270, 160)));
      for (const [x, y] of [[130, 165], [190, 190], [250, 165], [160, 225], [225, 235], [290, 200], [110, 200], [200, 150]])
        fill(g, 'K', ell(x, y, 8, 13, 0.3));
      fill(g, 'S', ell(130, 145, 26, 8));
    },
  },
  {
    id: 'icecream',
    name: { tr: 'Dondurma', en: 'Ice Cream' },
    size: 39,
    draw(g) {
      const cone = [poly(110, 210, 290, 210, 200, 390)];
      obj(g, 'n', ...cone);
      within(g, cone, () => {
        fill(g, 'T', poly(200, 210, 300, 210, 200, 400));
        for (let i = -4; i < 6; i++) {
          line(g, 'T', 8, 90 + i * 40, 200, 210 + i * 40, 400);
          line(g, 'T', 8, 310 - i * 40, 200, 190 - i * 40, 400);
        }
      });
      const scoop2 = [circ(200, 170, 100)];
      obj(g, 'b', ...scoop2, ell(200, 215, 120, 30));
      within(g, scoop2, () => fill(g, 'B', circ(260, 230, 100)));
      const scoop = [circ(200, 105, 90)];
      obj(g, 'P', ...scoop, ell(200, 145, 105, 26));
      within(g, scoop, () => {
        fill(g, 'q', circ(255, 160, 80));
        fill(g, 'W', ell(160, 70, 18, 28, 0.6));
      });
      part(g, 'R', circ(205, 18, 26));
      line(g, 'K', 6, 205, 0, 225, -18);
    },
  },
  {
    id: 'cupcake',
    name: { tr: 'Kek', en: 'Cupcake' },
    size: 37,
    draw(g) {
      const cup = [poly(95, 220, 305, 220, 275, 380, 125, 380)];
      obj(g, 'B', ...cup);
      within(g, cup, () => {
        for (let x = 80; x < 320; x += 44) fill(g, 'b', poly(x, 210, x + 22, 210, x + 12, 400, x - 10, 400));
        fill(g, 'U', poly(200, 380, 320, 200, 330, 400));
      });
      const cream = [ell(200, 215, 125, 40), ell(200, 165, 105, 48), ell(200, 115, 75, 44), ell(205, 72, 40, 32)];
      obj(g, 'W', ...cream);
      within(g, cream, () => {
        fill(g, 'w', ell(240, 240, 100, 30));
        fill(g, 'w', ell(235, 190, 70, 28));
        fill(g, 'w', ell(225, 140, 45, 22));
      });
      for (const [x, y, c] of [[150, 200, 'P'], [240, 165, 'Y'], [180, 130, 'G'], [260, 215, 'p'], [120, 175, 'Y']] as [number, number, string][])
        fill(g, c, rrect(x - 10, y - 6, 20, 12, 6));
      part(g, 'R', circ(210, 30, 30));
      fill(g, 'S', ell(200, 20, 8, 10));
    },
  },
  {
    id: 'burger',
    name: { tr: 'Hamburger', en: 'Burger' },
    size: 42,
    draw(g) {
      // alt ekmek
      part(g, 'n', rrect(70, 300, 260, 60, 30), OW);
      within(g, [rrect(70, 300, 260, 60, 30)], () => fill(g, 'T', rrect(70, 335, 260, 30, 0)));
      // köfte
      part(g, 'M', rrect(55, 255, 290, 52, 26), OW);
      within(g, [rrect(55, 255, 290, 52, 26)], () => {
        for (const x of [100, 160, 220, 280]) fill(g, 'N', ell(x, 270, 18, 7));
      });
      // peynir (sarkan üçgenler)
      obj(g, 'Y', poly(50, 235, 350, 235, 350, 255, 300, 255, 280, 290, 255, 255, 160, 255, 140, 285, 115, 255, 50, 255));
      // domates
      part(g, 'R', rrect(60, 210, 280, 30, 15), OW * 0.8);
      // marul (dalgalı)
      const lettuce = (g2: G) => {
        g2.moveTo(45, 205);
        for (let x = 45; x <= 355; x += 31) g2.quadraticCurveTo(x + 15, 225, x + 31, 205);
        g2.lineTo(355, 190);
        g2.lineTo(45, 190);
        g2.closePath();
      };
      obj(g, 'G', lettuce);
      within(g, [lettuce], () => fill(g, 'L', rrect(45, 180, 310, 18, 0)));
      // üst ekmek
      const bun = [(g2: G) => {
        g2.moveTo(60, 195);
        g2.bezierCurveTo(60, 40, 340, 40, 340, 195);
        g2.closePath();
      }];
      obj(g, 'n', ...bun);
      within(g, bun, () => {
        fill(g, 'T', circ(290, 240, 140));
        fill(g, 'c', ell(140, 105, 34, 16, -0.5));
      });
      for (const [x, y] of [[150, 140], [200, 105], [250, 135], [190, 160], [285, 165], [110, 170], [235, 80]])
        fill(g, 'W', ell(x, y, 11, 7, 0.4));
    },
  },
  {
    id: 'pizza',
    name: { tr: 'Pizza', en: 'Pizza' },
    size: 39,
    draw(g) {
      const slice = [poly(60, 80, 340, 80, 200, 390)];
      obj(g, 'Y', ...slice);
      within(g, slice, () => {
        fill(g, 'y', poly(200, 80, 360, 80, 200, 400));
        fill(g, 'y', circ(150, 160, 18));
      });
      const crust = [rrect(45, 45, 310, 55, 27)];
      obj(g, 'T', ...crust);
      within(g, crust, () => fill(g, 'n', rrect(45, 40, 310, 25, 0)));
      for (const [x, y, r] of [[140, 150, 30], [240, 140, 32], [200, 230, 30], [170, 300, 20], [270, 200, 18]]) {
        part(g, 'R', circ(x, y, r), 10);
        fill(g, 'r', circ(x + r * 0.3, y + r * 0.3, r * 0.45));
      }
      for (const [x, y] of [[190, 120], [120, 200], [250, 260], [210, 180]]) part(g, 'G', ell(x, y, 16, 9, 0.6), 6);
    },
  },
  {
    id: 'sushi',
    name: { tr: 'Suşi', en: 'Sushi' },
    size: 42,
    draw(g) {
      // Tabak
      part(g, 'C', rrect(15, 250, 370, 70, 35), OW);
      within(g, [rrect(15, 250, 370, 70, 35)], () => fill(g, 'U', rrect(15, 295, 370, 40, 0)));
      // Nigiri ×2
      for (const x0 of [40, 205]) {
        const rice = [rrect(x0, 170, 155, 95, 40)];
        obj(g, 'W', ...rice);
        within(g, rice, () => fill(g, 'w', rrect(x0, 235, 155, 40, 0)));
        const fish = [rrect(x0 - 10, 120, 175, 75, 36)];
        obj(g, 'O', ...fish);
        within(g, fish, () => {
          for (let i = 0; i < 4; i++) line(g, 'S', 10, x0 + 20 + i * 38, 125, x0 + 2 + i * 38, 195);
          fill(g, 'D', rrect(x0 - 10, 175, 175, 30, 0));
        });
        part(g, 'K', rrect(x0 + 60, 110, 40, 160, 6), 8);
      }
      // Çubuklar
      line(g, 'K', 22, 30, 60, 380, 20);
      line(g, 'T', 12, 30, 60, 380, 20);
    },
  },
  {
    id: 'avocado',
    name: { tr: 'Avokado', en: 'Avocado' },
    size: 39,
    draw(g) {
      const outer = [ell(200, 240, 140, 155), circ(200, 110, 95)];
      obj(g, 'g', ...outer);
      const flesh = [ell(200, 245, 112, 125), circ(200, 120, 72)];
      fill(g, 'L', flesh[0]);
      fill(g, 'L', flesh[1]);
      within(g, flesh, () => {
        fill(g, 'G', ell(260, 300, 70, 90));
        fill(g, 'c', ell(150, 140, 20, 34, 0.3));
      });
      const pit = [circ(200, 270, 62)];
      obj(g, 'N', ...pit);
      within(g, pit, () => {
        fill(g, 'M', circ(235, 305, 60));
        fill(g, 'T', ell(180, 245, 16, 22, 0.5));
      });
    },
  },
  {
    id: 'breakfast',
    name: { tr: 'Kahvaltı', en: 'Breakfast' },
    size: 44,
    draw(g) {
      // Pastırma şeritleri
      for (const [y, o] of [[60, 0], [120, 18]]) {
        const strip = (g2: G) => {
          g2.moveTo(40, y + 20);
          for (let x = 40; x < 360; x += 40) g2.quadraticCurveTo(x + 20, y - 5 + o * 0.2, x + 40, y + 20);
          g2.lineTo(360, y + 60);
          for (let x = 360; x > 40; x -= 40) g2.quadraticCurveTo(x - 20, y + 35, x - 40, y + 60);
          g2.closePath();
        };
        obj(g, 'r', strip);
        within(g, [strip], () => {
          fill(g, 'S', rrect(30, y + 30, 340, 10, 5));
          fill(g, 'R', rrect(30, y + 42, 340, 8, 4));
        });
      }
      // Yumurta
      const white = [circ(200, 280, 105), circ(120, 300, 70), circ(285, 300, 72), circ(200, 345, 60)];
      obj(g, 'W', ...white);
      within(g, white, () => fill(g, 'w', circ(280, 380, 120)));
      const yolk = [circ(200, 280, 50)];
      obj(g, 'Y', ...yolk);
      within(g, yolk, () => {
        fill(g, 'O', circ(225, 305, 40));
        fill(g, 'c', ell(183, 262, 13, 9, -0.6));
      });
    },
  },
  {
    id: 'lemonade',
    name: { tr: 'Limonata', en: 'Lemonade' },
    size: 42,
    draw(g) {
      // Pipet
      line(g, 'K', 30, 250, 140, 300, 10);
      line(g, 'R', 16, 250, 140, 300, 10);
      line(g, 'W', 16, 262, 108, 270, 86);
      line(g, 'W', 16, 280, 58, 288, 36);
      const glass = [poly(100, 90, 300, 90, 275, 385, 125, 385)];
      obj(g, 'b', ...glass);
      within(g, glass, () => {
        fill(g, 'Y', poly(95, 150, 305, 150, 280, 400, 120, 400));
        fill(g, 'y', poly(220, 150, 310, 150, 290, 400, 220, 400));
        fill(g, 'b', rrect(95, 80, 220, 70, 0));
        part(g, 'W', rrect(140, 170, 50, 50, 10), 6);
        part(g, 'W', rrect(200, 210, 46, 46, 10), 6);
        fill(g, 'W', rrect(118, 110, 14, 250, 7));
      });
      // Limon dilimi
      const lemon = [circ(110, 110, 62)];
      obj(g, 'Y', ...lemon);
      fill(g, 'c', circ(110, 110, 44));
      for (let a = 0; a < 6; a++) {
        const an = (a / 6) * Math.PI * 2;
        line(g, 'Y', 6, 110, 110, 110 + Math.cos(an) * 44, 110 + Math.sin(an) * 44);
      }
    },
  },
  {
    id: 'cake',
    name: { tr: 'Pasta', en: 'Cake' },
    size: 42,
    draw(g) {
      // Tabak
      part(g, 'w', ell(200, 355, 185, 38), OW);
      fill(g, 'W', ell(200, 345, 165, 26));
      // Dilim gövdesi (önden görünüm)
      const body = [rrect(60, 150, 280, 200, 14)];
      obj(g, 'n', ...body);
      within(g, body, () => {
        fill(g, 'P', rrect(60, 210, 280, 26, 0));
        fill(g, 'P', rrect(60, 280, 280, 26, 0));
        fill(g, 'T', rrect(260, 150, 90, 210, 0));
        fill(g, 'q', rrect(260, 210, 90, 26, 0));
        fill(g, 'q', rrect(260, 280, 90, 26, 0));
      });
      // Krema tepesi + damlalar
      obj(g, 'W', rrect(50, 120, 300, 50, 25), circ(110, 175, 18), circ(190, 182, 22), circ(270, 172, 16));
      within(g, [rrect(50, 120, 300, 50, 25)], () => fill(g, 'w', rrect(250, 120, 110, 60, 0)));
      // Çilekler
      for (const x of [120, 280]) {
        const s = [poly(x - 34, 85, x + 34, 85, x, 140), circ(x - 18, 90, 20), circ(x + 18, 90, 20)];
        obj(g, 'R', ...s);
        part(g, 'G', poly(x - 20, 75, x, 60, x + 20, 75, x, 85), 6);
      }
      part(g, 'Y', rrect(192, 40, 16, 80, 6), 10);
      fill(g, 'O', ell(200, 30, 12, 18));
    },
  },
  {
    id: 'taco',
    name: { tr: 'Tako', en: 'Taco' },
    size: 44,
    draw(g) {
      const shell = (r: number) => (g2: G) => {
        g2.moveTo(200 - r, 180);
        g2.arc(200, 180, r, Math.PI, 0, true);
        g2.closePath();
      };
      // Dolgular (kabuğun arkasından taşan)
      obj(g, 'G', circ(85, 165, 40), circ(140, 115, 45), circ(205, 95, 45), circ(265, 115, 45), circ(318, 165, 40));
      for (const [x, y] of [[120, 150], [190, 125], [255, 145], [300, 185]]) part(g, 'R', circ(x, y, 22), 8);
      for (const [x, y] of [[160, 165], [230, 160]]) part(g, 'c', rrect(x - 25, y - 10, 50, 20, 10), 8);
      // Kabuk
      obj(g, 'Y', shell(185));
      within(g, [shell(185)], () => {
        fill(g, 'y', shell(185));
        fill(g, 'Y', circ(190, 380, 175));
        for (const [x, y] of [[120, 260], [200, 230], [270, 270], [160, 330], [240, 320]]) fill(g, 'y', circ(x, y, 9));
      });
    },
  },
];

/* ---------- Yemek dışı: hayvanlar, eşyalar, doğa ---------- */

/** 5 köşeli yıldız noktaları */
function starPts(cx: number, cy: number, R: number, r: number): number[] {
  const out: number[] = [];
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const rad = k % 2 === 0 ? R : r;
    out.push(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  return out;
}

ILLUSTRATIONS.push(
  {
    id: 'cat',
    name: { tr: 'Kedi', en: 'Cat' },
    size: 34,
    draw(g) {
      const head = [poly(70, 170, 105, 40, 175, 120), poly(330, 170, 295, 40, 225, 120), ell(200, 225, 150, 130)];
      obj(g, 'O', ...head);
      within(g, head, () => {
        fill(g, 'D', ell(280, 320, 160, 90));
        for (const [x, w] of [[190, 20], [150, 16], [234, 16]]) fill(g, 'D', rrect(x, 100, w, 46, w / 2));
      });
      fill(g, 'P', poly(95, 140, 112, 72, 152, 120));
      fill(g, 'P', poly(305, 140, 288, 72, 248, 120));
      fill(g, 'W', ell(200, 268, 72, 50));
      fill(g, 'K', ell(140, 205, 20, 27));
      fill(g, 'K', ell(260, 205, 20, 27));
      fill(g, 'W', circ(147, 196, 7));
      fill(g, 'W', circ(267, 196, 7));
      part(g, 'P', poly(184, 242, 216, 242, 200, 260), 8);
      line(g, 'K', 6, 200, 260, 200, 274);
      line(g, 'K', 6, 200, 274, 182, 286);
      line(g, 'K', 6, 200, 274, 218, 286);
      for (const [x1, y1, x2, y2] of [[120, 262, 40, 248], [120, 280, 40, 292], [280, 262, 360, 248], [280, 280, 360, 292]]) line(g, 'K', 5, x1, y1, x2, y2);
    },
  },
  {
    id: 'fish',
    name: { tr: 'Balık', en: 'Fish' },
    size: 36,
    draw(g) {
      const body = [ell(180, 200, 140, 95), poly(290, 200, 390, 115, 375, 200, 390, 285)];
      obj(g, 'B', ...body);
      within(g, body, () => {
        fill(g, 'U', ell(220, 285, 190, 60));
        fill(g, 'Y', rrect(150, 100, 24, 200, 12));
        fill(g, 'Y', rrect(212, 100, 24, 200, 12));
      });
      part(g, 'b', poly(160, 112, 230, 55, 245, 118), 10);
      part(g, 'W', circ(98, 178, 28), 10);
      fill(g, 'K', circ(103, 181, 13));
      line(g, 'K', 7, 45, 215, 72, 210);
    },
  },
  {
    id: 'frog',
    name: { tr: 'Kurbağa', en: 'Frog' },
    size: 34,
    draw(g) {
      const body = [circ(120, 125, 55), circ(280, 125, 55), ell(200, 235, 170, 120)];
      obj(g, 'G', ...body);
      within(g, body, () => {
        fill(g, 'g', ell(260, 330, 190, 80));
        fill(g, 'L', ell(200, 300, 110, 45));
      });
      part(g, 'W', circ(120, 120, 34), 10);
      part(g, 'W', circ(280, 120, 34), 10);
      fill(g, 'K', circ(126, 124, 16));
      fill(g, 'K', circ(274, 124, 16));
      line(g, 'K', 8, 110, 245, 160, 270, 240, 270, 290, 245);
      fill(g, 'P', ell(95, 240, 20, 12));
      fill(g, 'P', ell(305, 240, 20, 12));
    },
  },
  {
    id: 'chick',
    name: { tr: 'Civciv', en: 'Chick' },
    size: 32,
    draw(g) {
      part(g, 'O', rrect(140, 350, 46, 22, 10), 10);
      part(g, 'O', rrect(214, 350, 46, 22, 10), 10);
      const body = [circ(200, 225, 135), poly(178, 100, 195, 50, 212, 100), poly(205, 98, 235, 62, 232, 105)];
      obj(g, 'Y', ...body);
      within(g, body, () => fill(g, 'y', ell(270, 320, 160, 95)));
      part(g, 'y', ell(95, 250, 38, 60, 0.45), 10);
      fill(g, 'K', circ(155, 200, 16));
      fill(g, 'K', circ(245, 200, 16));
      fill(g, 'W', circ(161, 194, 5));
      fill(g, 'W', circ(251, 194, 5));
      part(g, 'O', poly(172, 232, 228, 232, 200, 272), 10);
      fill(g, 'P', ell(120, 240, 18, 11));
      fill(g, 'P', ell(280, 240, 18, 11));
    },
  },
  {
    id: 'ladybug',
    name: { tr: 'Uğur Böceği', en: 'Ladybug' },
    size: 34,
    draw(g) {
      line(g, 'K', 10, 175, 60, 140, 18);
      line(g, 'K', 10, 225, 60, 260, 18);
      obj(g, 'K', ell(200, 100, 75, 58));
      const shell = [circ(200, 245, 150)];
      obj(g, 'R', ...shell);
      within(g, shell, () => {
        fill(g, 'r', circ(275, 325, 150));
        for (const [x, y, r] of [[130, 190, 27], [270, 190, 27], [110, 290, 22], [290, 290, 22], [160, 345, 18], [240, 345, 18]]) fill(g, 'K', circ(x, y, r));
        fill(g, 'K', rrect(193, 95, 14, 310, 7));
        fill(g, 'S', ell(120, 140, 22, 12, -0.6));
      });
      fill(g, 'W', circ(172, 92, 12));
      fill(g, 'W', circ(228, 92, 12));
    },
  },
  {
    id: 'bee',
    name: { tr: 'Arı', en: 'Bee' },
    size: 36,
    draw(g) {
      part(g, 'b', ell(160, 110, 58, 80, -0.45), 10);
      part(g, 'b', ell(255, 110, 58, 80, 0.45), 10);
      part(g, 'K', poly(352, 238, 398, 228, 360, 258), 8);
      const body = [ell(200, 245, 160, 108)];
      obj(g, 'Y', ...body);
      within(g, body, () => {
        fill(g, 'K', rrect(160, 120, 40, 260, 0));
        fill(g, 'K', rrect(250, 120, 40, 260, 0));
        fill(g, 'y', ell(250, 330, 170, 60));
      });
      line(g, 'K', 8, 80, 175, 50, 120);
      line(g, 'K', 8, 105, 165, 95, 112);
      fill(g, 'K', circ(95, 228, 14));
      fill(g, 'W', circ(99, 223, 5));
      line(g, 'K', 6, 75, 268, 95, 280, 118, 272);
      fill(g, 'P', ell(125, 250, 16, 9));
    },
  },
  {
    id: 'rocket',
    name: { tr: 'Roket', en: 'Rocket' },
    size: 38,
    draw(g) {
      part(g, 'O', poly(160, 330, 240, 330, 200, 398), 10);
      fill(g, 'Y', poly(180, 330, 220, 330, 200, 375));
      part(g, 'R', poly(140, 240, 88, 330, 150, 320), 12);
      part(g, 'R', poly(260, 240, 312, 330, 250, 320), 12);
      const body = [poly(140, 335, 140, 150, 200, 25, 260, 150, 260, 335)];
      obj(g, 'W', ...body);
      within(g, body, () => {
        fill(g, 'w', rrect(222, 20, 60, 330, 0));
        fill(g, 'R', poly(130, 150, 200, 20, 270, 150));
        fill(g, 'r', poly(222, 60, 270, 150, 222, 150));
        fill(g, 'R', rrect(130, 290, 140, 20, 0));
      });
      part(g, 'b', circ(200, 200, 38), 12);
      fill(g, 'B', ell(210, 210, 22, 18));
      fill(g, 'W', ell(186, 186, 9, 6, -0.6));
    },
  },
  {
    id: 'house',
    name: { tr: 'Ev', en: 'House' },
    size: 36,
    draw(g) {
      part(g, 'G', rrect(30, 355, 340, 34, 17), 10);
      part(g, 'D', rrect(268, 70, 42, 90, 6), 10);
      const walls = [rrect(82, 180, 236, 185, 8)];
      obj(g, 'n', ...walls);
      within(g, walls, () => fill(g, 'T', rrect(260, 170, 70, 210, 0)));
      const roof = [poly(45, 205, 200, 58, 355, 205)];
      obj(g, 'R', ...roof);
      within(g, roof, () => fill(g, 'r', poly(200, 58, 360, 210, 200, 210)));
      part(g, 'N', rrect(172, 268, 58, 98, 10), 10);
      fill(g, 'Y', circ(218, 320, 6));
      for (const x of [104, 244]) {
        part(g, 'b', rrect(x, 222, 54, 54, 6), 10);
        line(g, 'K', 5, x + 27, 222, x + 27, 276);
        line(g, 'K', 5, x, 249, x + 54, 249);
      }
      part(g, 'Y', circ(200, 145, 22), 8);
    },
  },
  {
    id: 'cactus',
    name: { tr: 'Kaktüs', en: 'Cactus' },
    size: 34,
    draw(g) {
      const plant = [rrect(160, 70, 80, 240, 40), rrect(70, 150, 60, 110, 30), rrect(270, 120, 60, 110, 30), rrect(100, 220, 80, 40, 20), rrect(230, 190, 60, 40, 20)];
      obj(g, 'G', ...plant);
      within(g, plant, () => {
        fill(g, 'g', rrect(215, 60, 40, 260, 0));
        fill(g, 'g', rrect(108, 140, 30, 130, 0));
        fill(g, 'g', rrect(305, 110, 30, 130, 0));
      });
      for (const [x, y] of [[185, 120], [190, 180], [185, 240], [95, 190], [295, 160]]) line(g, 'L', 5, x, y, x + 10, y - 8);
      part(g, 'P', circ(200, 68, 24), 8);
      fill(g, 'Y', circ(200, 68, 9));
      part(g, 'D', poly(122, 300, 278, 300, 258, 392, 142, 392), 12);
      part(g, 'D', rrect(105, 278, 190, 36, 10), 12);
      fill(g, 'T', rrect(112, 284, 176, 10, 5));
    },
  },
  {
    id: 'flower',
    name: { tr: 'Çiçek', en: 'Flower' },
    size: 34,
    draw(g) {
      line(g, 'K', 30, 200, 230, 200, 392);
      line(g, 'G', 16, 200, 230, 200, 392);
      part(g, 'G', ell(148, 320, 52, 22, -0.5), 10);
      part(g, 'G', ell(252, 300, 52, 22, 0.5), 10);
      const petals = [circ(200, 85, 55), circ(285, 148, 55), circ(254, 245, 55), circ(146, 245, 55), circ(115, 148, 55)];
      obj(g, 'P', ...petals);
      within(g, petals, () => fill(g, 'q', circ(275, 275, 120)));
      part(g, 'Y', circ(200, 172, 54), 10);
      fill(g, 'y', ell(215, 190, 38, 30));
      fill(g, 'K', circ(184, 162, 7));
      fill(g, 'K', circ(216, 162, 7));
      line(g, 'K', 5, 186, 185, 200, 194, 214, 185);
    },
  },
  {
    id: 'balloon',
    name: { tr: 'Balon', en: 'Balloon' },
    size: 32,
    draw(g) {
      line(g, 'K', 14, 200, 300, 186, 340, 212, 370, 196, 398);
      const b = [ell(200, 160, 120, 145)];
      obj(g, 'R', ...b);
      within(g, b, () => {
        fill(g, 'r', ell(270, 225, 120, 140));
        fill(g, 'W', ell(148, 100, 22, 40, 0.5));
        fill(g, 'S', ell(150, 158, 11, 18));
      });
      part(g, 'R', poly(184, 300, 216, 300, 200, 322), 8);
    },
  },
  {
    id: 'crown',
    name: { tr: 'Taç', en: 'Crown' },
    size: 36,
    draw(g) {
      for (const [x, y, r] of [[70, 140, 18], [200, 92, 20], [330, 140, 18]]) part(g, 'Y', circ(x, y, r), 10);
      const c = [poly(70, 330, 70, 150, 135, 235, 200, 105, 265, 235, 330, 150, 330, 330)];
      obj(g, 'Y', ...c);
      within(g, c, () => {
        fill(g, 'y', poly(200, 105, 340, 140, 340, 340, 200, 340));
        fill(g, 'y', rrect(60, 280, 290, 60, 0));
      });
      part(g, 'Y', rrect(70, 278, 260, 52, 8), 10);
      part(g, 'R', circ(200, 304, 20), 8);
      part(g, 'B', circ(128, 304, 15), 8);
      part(g, 'G', circ(272, 304, 15), 8);
      fill(g, 'W', ell(193, 297, 6, 4));
    },
  },
  {
    id: 'ghost',
    name: { tr: 'Hayalet', en: 'Ghost' },
    size: 32,
    draw(g) {
      part(g, 'W', ell(70, 250, 32, 18, -0.6), 10);
      part(g, 'W', ell(330, 250, 32, 18, 0.6), 10);
      const body = [
        (g2: G) => {
          g2.moveTo(80, 350);
          g2.lineTo(80, 180);
          g2.arc(200, 180, 120, Math.PI, 0);
          g2.lineTo(320, 350);
          g2.quadraticCurveTo(290, 390, 260, 350);
          g2.quadraticCurveTo(230, 390, 200, 350);
          g2.quadraticCurveTo(170, 390, 140, 350);
          g2.quadraticCurveTo(110, 390, 80, 350);
          g2.closePath();
        },
      ];
      obj(g, 'W', ...body);
      within(g, body, () => fill(g, 'w', ell(290, 300, 90, 140)));
      fill(g, 'K', ell(160, 190, 18, 27));
      fill(g, 'K', ell(240, 190, 18, 27));
      fill(g, 'W', circ(166, 181, 6));
      fill(g, 'W', circ(246, 181, 6));
      fill(g, 'K', ell(200, 255, 22, 17));
      fill(g, 'P', ell(125, 230, 18, 10));
      fill(g, 'P', ell(275, 230, 18, 10));
    },
  },
  {
    id: 'rainbow',
    name: { tr: 'Gökkuşağı', en: 'Rainbow' },
    size: 38,
    draw(g) {
      const arc = (r: number, w: number, ch: string) => {
        g.beginPath();
        g.arc(200, 290, r, Math.PI, 0);
        g.lineWidth = w;
        g.lineCap = 'butt';
        g.strokeStyle = hex(ch);
        g.stroke();
      };
      arc(120, 156, 'K');
      ['R', 'O', 'Y', 'G', 'B', 'p'].forEach((ch, i) => arc(185 - i * 23, 24, ch));
      for (const cx of [70, 330]) {
        const cl = [circ(cx - 40, 300, 42), circ(cx, 278, 52), circ(cx + 40, 302, 40), rrect(cx - 80, 300, 160, 45, 22)];
        obj(g, 'W', ...cl);
        within(g, cl, () => fill(g, 'w', rrect(cx - 90, 325, 180, 40, 0)));
      }
    },
  },
  {
    id: 'sailboat',
    name: { tr: 'Yelkenli', en: 'Sailboat' },
    size: 38,
    draw(g) {
      part(g, 'B', rrect(20, 330, 360, 62, 30), 12);
      for (let x = 50; x < 360; x += 70) fill(g, 'b', ell(x, 350, 26, 7));
      part(g, 'N', rrect(192, 55, 16, 235, 6), 10);
      part(g, 'R', poly(208, 42, 255, 56, 208, 70), 8);
      const sail = [poly(214, 72, 214, 262, 335, 262)];
      obj(g, 'W', ...sail);
      within(g, sail, () => {
        fill(g, 'R', rrect(200, 150, 160, 22, 0));
        fill(g, 'R', rrect(200, 200, 160, 22, 0));
        fill(g, 'w', poly(214, 262, 335, 262, 260, 200));
      });
      part(g, 'W', poly(186, 100, 186, 262, 88, 262), 12);
      const hull = [poly(66, 278, 334, 278, 292, 348, 108, 348)];
      obj(g, 'N', ...hull);
      within(g, hull, () => {
        fill(g, 'M', rrect(60, 320, 290, 40, 0));
        fill(g, 'Y', rrect(60, 290, 290, 10, 0));
      });
    },
  },
  {
    id: 'tree',
    name: { tr: 'Elma Ağacı', en: 'Apple Tree' },
    size: 36,
    draw(g) {
      part(g, 'G', ell(200, 382, 150, 16), 10);
      part(g, 'N', poly(172, 385, 228, 385, 218, 250, 182, 250), 12);
      const crown = [circ(200, 135, 92), circ(118, 190, 76), circ(282, 190, 76), circ(200, 225, 86)];
      obj(g, 'G', ...crown);
      within(g, crown, () => {
        fill(g, 'g', circ(270, 275, 150));
        fill(g, 'L', ell(150, 95, 30, 16, -0.5));
      });
      for (const [x, y, r] of [[150, 165, 16], [250, 145, 16], [210, 232, 16], [118, 232, 14], [292, 222, 14]]) part(g, 'R', circ(x, y, r), 8);
    },
  },
  {
    id: 'octopus',
    name: { tr: 'Ahtapot', en: 'Octopus' },
    size: 36,
    draw(g) {
      for (const pts of [
        [120, 250, 92, 330, 58, 362],
        [165, 262, 150, 350, 128, 392],
        [235, 262, 250, 350, 272, 392],
        [280, 250, 308, 330, 342, 362],
      ]) {
        line(g, 'K', 48, ...pts);
        line(g, 'p', 30, ...pts);
      }
      const head = [ell(200, 165, 142, 132)];
      obj(g, 'p', ...head);
      within(g, head, () => {
        fill(g, 'u', ell(270, 240, 150, 80));
        for (const [x, y, r] of [[150, 95, 16], [250, 84, 12], [285, 135, 10]]) fill(g, 'V', circ(x, y, r));
      });
      part(g, 'W', circ(158, 180, 28), 10);
      part(g, 'W', circ(242, 180, 28), 10);
      fill(g, 'K', circ(163, 185, 13));
      fill(g, 'K', circ(237, 185, 13));
      line(g, 'K', 6, 175, 235, 200, 250, 225, 235);
    },
  },
  {
    id: 'star',
    name: { tr: 'Yıldız', en: 'Star' },
    size: 34,
    draw(g) {
      const st = [poly(...starPts(200, 215, 185, 78))];
      obj(g, 'Y', ...st);
      within(g, st, () => fill(g, 'y', poly(200, 215, 420, 215, 420, 420, 0, 420)));
      fill(g, 'K', ell(170, 205, 12, 18));
      fill(g, 'K', ell(230, 205, 12, 18));
      fill(g, 'W', circ(174, 199, 4));
      fill(g, 'W', circ(234, 199, 4));
      line(g, 'K', 6, 180, 238, 200, 250, 220, 238);
      fill(g, 'O', ell(145, 235, 16, 10));
      fill(g, 'O', ell(255, 235, 16, 10));
    },
  },
);

/* Ek çizim dosyaları (illustrations-*.ts) aynı yardımcıları kullanır. */
export { obj, part, fill, within, line, circ, ell, rrect, poly, starPts, hex, OW };
export type { G, Build };

/** Yay üzerinde noktalar (a0→a1, radyan). Hilal, muz gibi kavisli şekiller için. */
export function arcPts(cx: number, cy: number, r: number, a0: number, a1: number, n = 16): number[] {
  const out: number[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  return out;
}
