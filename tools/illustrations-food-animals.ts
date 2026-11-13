/**
 * Ek bölüm çizimleri: yiyecekler ve hayvanlar. Kurallar illustrations.ts ile aynı:
 * 400×400 tuval, kalın siyah kontur, yalnızca palet harfleri.
 */
import { arcPts, circ, ell, fill, line, obj, part, poly, rrect, within, type Illustration } from './illustrations';

export const EXTRA_FOOD_ANIMALS: Illustration[] = [
  /* ---------- Yiyecekler ---------- */
  {
    id: 'banana',
    name: { tr: 'Muz', en: 'Banana' },
    size: 40,
    draw(g) {
      // Kalın hilal: dış yay aşağıda, iç yay daha yukarıda → ortası dolgun, uçları ince.
      const body = [poly(...arcPts(200, 0, 320, Math.PI * 0.2, Math.PI * 0.8), ...arcPts(200, -150, 330, Math.PI * 0.72, Math.PI * 0.28))];
      obj(g, 'Y', ...body);
      within(g, body, () => {
        fill(g, 'y', poly(...arcPts(200, 0, 320, Math.PI * 0.2, Math.PI * 0.8), ...arcPts(200, -40, 320, Math.PI * 0.8, Math.PI * 0.2)));
        fill(g, 'c', ell(160, 220, 70, 14, 0.2));
      });
      part(g, 'N', rrect(360, 150, 30, 46, 8), 10);
      part(g, 'M', circ(30, 250, 12), 8);
    },
  },
  {
    id: 'grapes',
    name: { tr: 'Üzüm', en: 'Grapes' },
    size: 34,
    draw(g) {
      part(g, 'N', rrect(188, 30, 24, 70, 8), 10);
      part(g, 'G', ell(270, 70, 75, 34, 0.3));
      line(g, 'g', 8, 222, 62, 320, 82);
      const grapes = [
        [140, 130], [200, 125], [260, 130],
        [110, 190], [170, 190], [230, 190], [290, 190],
        [140, 250], [200, 250], [260, 250],
        [170, 310], [230, 310], [200, 365],
      ];
      obj(g, 'p', ...grapes.map(([x, y]) => circ(x, y, 38)));
      for (const [x, y] of grapes) {
        fill(g, 'u', circ(x + 10, y + 10, 26));
        fill(g, 'p', circ(x - 4, y - 4, 26));
        fill(g, 'V', circ(x - 14, y - 14, 8));
      }
    },
  },
  {
    id: 'pear',
    name: { tr: 'Armut', en: 'Pear' },
    size: 34,
    draw(g) {
      const body = [circ(200, 135, 75), ell(200, 280, 135, 110), poly(140, 160, 260, 160, 300, 240, 100, 240)];
      obj(g, 'L', ...body);
      within(g, body, () => {
        fill(g, 'G', circ(300, 340, 170));
        fill(g, 'L', circ(170, 230, 130));
        fill(g, 'c', ell(140, 250, 20, 40, 0.3));
      });
      part(g, 'N', rrect(190, 20, 22, 70, 8), 10);
      part(g, 'G', ell(255, 55, 50, 24, -0.4));
    },
  },
  {
    id: 'orange',
    name: { tr: 'Portakal', en: 'Orange' },
    size: 34,
    draw(g) {
      const ring = [circ(200, 210, 175)];
      obj(g, 'O', ...ring);
      fill(g, 'c', circ(200, 210, 150));
      fill(g, 'O', circ(200, 210, 140));
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        line(g, 'c', 14, 200, 210, 200 + Math.cos(a) * 140, 210 + Math.sin(a) * 140);
      }
      fill(g, 'c', circ(200, 210, 22));
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4 + Math.PI / 8;
        fill(g, 'Y', ell(200 + Math.cos(a) * 85, 210 + Math.sin(a) * 85, 22, 12, a));
      }
    },
  },
  {
    id: 'carrot',
    name: { tr: 'Havuç', en: 'Carrot' },
    size: 36,
    draw(g) {
      for (const [x2, y2] of [[140, 30], [200, 15], [260, 30]]) {
        line(g, 'K', 46, 200, 120, x2, y2);
        line(g, 'G', 28, 200, 120, x2, y2);
      }
      const body = [poly(110, 130, 290, 130, 215, 390, 185, 390), ell(200, 140, 92, 40)];
      obj(g, 'O', ...body);
      within(g, body, () => {
        fill(g, 'D', poly(230, 120, 320, 120, 220, 400));
        for (const y of [190, 250, 310]) line(g, 'D', 10, 160, y, 200, y + 6);
      });
    },
  },
  {
    id: 'mushroom',
    name: { tr: 'Mantar', en: 'Mushroom' },
    size: 34,
    draw(g) {
      part(g, 'c', rrect(150, 200, 100, 170, 40));
      const cap = [poly(...arcPts(200, 220, 180, Math.PI, Math.PI * 2)), rrect(20, 200, 360, 40, 20)];
      obj(g, 'R', ...cap);
      within(g, cap, () => {
        fill(g, 'r', rrect(0, 190, 400, 60, 0));
        for (const [x, y, r] of [[120, 130, 30], [215, 90, 36], [300, 150, 26], [180, 185, 18]]) fill(g, 'W', circ(x, y, r));
      });
      fill(g, 'K', ell(180, 290, 10, 16));
      fill(g, 'K', ell(220, 290, 10, 16));
    },
  },
  {
    id: 'cheese',
    name: { tr: 'Peynir', en: 'Cheese' },
    size: 34,
    draw(g) {
      const body = [poly(40, 160, 340, 70, 370, 300, 40, 320)];
      obj(g, 'Y', ...body);
      within(g, body, () => {
        fill(g, 'y', poly(40, 160, 340, 70, 370, 140, 40, 200));
        for (const [x, y, r] of [[110, 250, 26], [220, 220, 34], [310, 270, 20], [170, 300, 16], [290, 170, 14]]) fill(g, 'y', circ(x, y, r));
      });
    },
  },
  {
    id: 'cookie',
    name: { tr: 'Kurabiye', en: 'Cookie' },
    size: 32,
    draw(g) {
      const body = [circ(200, 205, 170)];
      obj(g, 'T', ...body);
      within(g, body, () => {
        fill(g, 'N', circ(280, 300, 170));
        fill(g, 'T', circ(180, 180, 150));
      });
      for (const [x, y, r] of [[130, 140, 24], [240, 120, 20], [290, 210, 26], [170, 240, 22], [120, 300, 18], [240, 300, 24], [200, 180, 14]]) fill(g, 'M', circ(x, y, r));
    },
  },
  {
    id: 'lollipop',
    name: { tr: 'Lolipop', en: 'Lollipop' },
    size: 36,
    draw(g) {
      part(g, 'W', rrect(186, 230, 28, 160, 10), 12);
      const candy = [circ(200, 150, 135)];
      obj(g, 'P', ...candy);
      within(g, candy, () => {
        for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI) / 3;
          fill(g, 'q', poly(200, 150, 200 + Math.cos(a) * 200, 150 + Math.sin(a) * 200, 200 + Math.cos(a + 0.5) * 200, 150 + Math.sin(a + 0.5) * 200));
        }
        fill(g, 'W', ell(140, 100, 24, 14, -0.6));
      });
      part(g, 'P', circ(200, 150, 26), 10);
    },
  },
  {
    id: 'popsicle',
    name: { tr: 'Buzlu Şeker', en: 'Ice Pop' },
    size: 36,
    draw(g) {
      part(g, 'n', rrect(178, 290, 44, 100, 18), 12);
      const body = [rrect(110, 20, 180, 290, 80)];
      obj(g, 'B', ...body);
      within(g, body, () => {
        fill(g, 'P', rrect(100, 10, 200, 100, 0));
        fill(g, 'W', rrect(100, 110, 200, 40, 0));
        fill(g, 'U', rrect(240, 150, 60, 170, 0));
        fill(g, 'b', rrect(140, 170, 18, 100, 9));
      });
    },
  },
  {
    id: 'pineapple',
    name: { tr: 'Ananas', en: 'Pineapple' },
    size: 38,
    draw(g) {
      const leaves = [poly(200, 10, 230, 120, 170, 120), poly(130, 40, 200, 130, 160, 140), poly(270, 40, 240, 140, 200, 130)];
      obj(g, 'G', ...leaves);
      within(g, leaves, () => fill(g, 'g', poly(200, 10, 215, 140, 200, 140)));
      const body = [ell(200, 265, 120, 130)];
      obj(g, 'Y', ...body);
      within(g, body, () => {
        fill(g, 'y', ell(260, 330, 120, 110));
        for (let k = -4; k <= 4; k++) {
          line(g, 'O', 9, 80 + k * 55, 130, 320 + k * 55, 400);
          line(g, 'O', 9, 320 + k * 55, 130, 80 + k * 55, 400);
        }
      });
    },
  },
  {
    id: 'corn',
    name: { tr: 'Mısır', en: 'Corn' },
    size: 36,
    draw(g) {
      const cob = [ell(200, 180, 85, 165)];
      obj(g, 'Y', ...cob);
      within(g, cob, () => {
        for (let y = 30; y < 360; y += 34) for (let x = 120; x < 290; x += 34) fill(g, 'y', rrect(x + 4, y + 4, 26, 26, 10));
        for (let y = 30; y < 360; y += 34) for (let x = 120; x < 290; x += 34) fill(g, 'Y', rrect(x, y, 24, 24, 10));
      });
      const husk = [poly(110, 230, 60, 390, 200, 340), poly(290, 230, 340, 390, 200, 340)];
      obj(g, 'G', ...husk);
      within(g, husk, () => fill(g, 'g', poly(200, 300, 340, 390, 200, 400)));
    },
  },

  /* ---------- Hayvanlar ---------- */
  {
    id: 'dog',
    name: { tr: 'Köpek', en: 'Dog' },
    size: 34,
    draw(g) {
      const head = [ell(200, 215, 140, 130)];
      part(g, 'N', ell(80, 210, 50, 100, 0.25));
      part(g, 'N', ell(320, 210, 50, 100, -0.25));
      obj(g, 'n', ...head);
      within(g, head, () => {
        fill(g, 'T', ell(280, 320, 150, 70));
        fill(g, 'N', ell(255, 165, 52, 48));
      });
      fill(g, 'c', ell(200, 280, 72, 52));
      fill(g, 'K', ell(150, 190, 17, 22));
      fill(g, 'K', ell(250, 190, 17, 22));
      fill(g, 'W', circ(155, 182, 6));
      fill(g, 'W', circ(255, 182, 6));
      fill(g, 'K', ell(200, 250, 26, 18));
      line(g, 'K', 7, 200, 266, 200, 290);
      line(g, 'K', 7, 175, 298, 200, 290, 225, 298);
      part(g, 'P', ell(200, 318, 20, 16), 8);
    },
  },
  {
    id: 'rabbit',
    name: { tr: 'Tavşan', en: 'Rabbit' },
    size: 36,
    draw(g) {
      const ears = [ell(145, 100, 38, 95, -0.15), ell(255, 100, 38, 95, 0.15)];
      obj(g, 'W', ...ears);
      fill(g, 'P', ell(145, 105, 18, 70, -0.15));
      fill(g, 'P', ell(255, 105, 18, 70, 0.15));
      const head = [ell(200, 265, 140, 115)];
      obj(g, 'W', ...head);
      within(g, head, () => fill(g, 'w', ell(270, 360, 150, 60)));
      fill(g, 'K', ell(150, 250, 16, 20));
      fill(g, 'K', ell(250, 250, 16, 20));
      fill(g, 'W', circ(155, 243, 5));
      fill(g, 'W', circ(255, 243, 5));
      part(g, 'P', poly(186, 280, 214, 280, 200, 296), 8);
      line(g, 'K', 6, 200, 296, 200, 312);
      fill(g, 'P', ell(120, 290, 20, 12));
      fill(g, 'P', ell(280, 290, 20, 12));
    },
  },
  {
    id: 'panda',
    name: { tr: 'Panda', en: 'Panda' },
    size: 34,
    draw(g) {
      obj(g, 'K', circ(95, 100, 55), circ(305, 100, 55));
      const head = [ell(200, 220, 160, 140)];
      obj(g, 'W', ...head);
      within(g, head, () => fill(g, 'w', ell(270, 330, 160, 70)));
      fill(g, 'K', ell(140, 210, 42, 54, 0.5));
      fill(g, 'K', ell(260, 210, 42, 54, -0.5));
      fill(g, 'W', circ(148, 205, 15));
      fill(g, 'W', circ(252, 205, 15));
      fill(g, 'K', circ(150, 207, 8));
      fill(g, 'K', circ(250, 207, 8));
      fill(g, 'K', ell(200, 268, 26, 18));
      line(g, 'K', 7, 175, 300, 200, 290, 225, 300);
      fill(g, 'P', ell(120, 280, 18, 10));
      fill(g, 'P', ell(280, 280, 18, 10));
    },
  },
  {
    id: 'pig',
    name: { tr: 'Domuz', en: 'Pig' },
    size: 34,
    draw(g) {
      const head = [poly(80, 140, 95, 40, 165, 95), poly(320, 140, 305, 40, 235, 95), ell(200, 225, 160, 135)];
      obj(g, 'P', ...head);
      within(g, head, () => fill(g, 'q', ell(270, 340, 160, 70)));
      fill(g, 'K', ell(140, 190, 15, 20));
      fill(g, 'K', ell(260, 190, 15, 20));
      fill(g, 'W', circ(145, 183, 5));
      fill(g, 'W', circ(265, 183, 5));
      part(g, 'S', ell(200, 260, 62, 44), 12);
      fill(g, 'q', ell(178, 260, 12, 18));
      fill(g, 'q', ell(222, 260, 12, 18));
    },
  },
  {
    id: 'owl',
    name: { tr: 'Baykuş', en: 'Owl' },
    size: 36,
    draw(g) {
      const body = [poly(90, 120, 110, 40, 170, 90), poly(310, 120, 290, 40, 230, 90), ell(200, 230, 150, 160)];
      obj(g, 'N', ...body);
      within(g, body, () => {
        fill(g, 'n', ell(200, 300, 100, 100));
        for (const [x, y] of [[170, 270], [230, 270], [200, 310], [170, 345], [230, 345]]) fill(g, 'T', ell(x, y, 16, 10));
      });
      part(g, 'W', circ(145, 165, 50), 12);
      part(g, 'W', circ(255, 165, 50), 12);
      fill(g, 'Y', circ(145, 170, 28));
      fill(g, 'Y', circ(255, 170, 28));
      fill(g, 'K', circ(145, 170, 15));
      fill(g, 'K', circ(255, 170, 15));
      part(g, 'O', poly(182, 210, 218, 210, 200, 245), 8);
    },
  },
  {
    id: 'penguin',
    name: { tr: 'Penguen', en: 'Penguin' },
    size: 36,
    draw(g) {
      part(g, 'O', ell(150, 380, 45, 18), 10);
      part(g, 'O', ell(250, 380, 45, 18), 10);
      const body = [ell(200, 215, 135, 170), ell(70, 240, 34, 90, 0.4), ell(330, 240, 34, 90, -0.4)];
      obj(g, 'K', ...body);
      fill(g, 'W', ell(200, 250, 95, 125));
      fill(g, 'W', ell(160, 150, 42, 50));
      fill(g, 'W', ell(240, 150, 42, 50));
      fill(g, 'K', circ(165, 150, 14));
      fill(g, 'K', circ(235, 150, 14));
      part(g, 'O', poly(176, 180, 224, 180, 200, 210), 8);
      fill(g, 'P', ell(130, 200, 16, 9));
      fill(g, 'P', ell(270, 200, 16, 9));
    },
  },
  {
    id: 'turtle',
    name: { tr: 'Kaplumbağa', en: 'Turtle' },
    size: 36,
    draw(g) {
      const legs = [ell(110, 320, 40, 30), ell(290, 320, 40, 30), ell(355, 230, 55, 45)];
      obj(g, 'L', ...legs);
      fill(g, 'K', circ(370, 220, 9));
      const shell = [poly(...arcPts(190, 300, 160, Math.PI, Math.PI * 2)), rrect(25, 285, 330, 40, 20)];
      obj(g, 'G', ...shell);
      within(g, shell, () => {
        fill(g, 'g', rrect(0, 280, 400, 60, 0));
        for (const [x, y, r] of [[190, 210, 46], [100, 250, 30], [280, 250, 30], [140, 175, 24], [240, 175, 24]]) fill(g, 'g', circ(x, y, r));
        for (const [x, y, r] of [[190, 210, 34], [100, 250, 20], [280, 250, 20], [140, 175, 14], [240, 175, 14]]) fill(g, 'L', circ(x, y, r));
      });
    },
  },
  {
    id: 'snail',
    name: { tr: 'Salyangoz', en: 'Snail' },
    size: 36,
    draw(g) {
      line(g, 'K', 8, 70, 220, 45, 140);
      line(g, 'K', 8, 100, 220, 100, 140);
      fill(g, 'K', circ(45, 140, 12));
      fill(g, 'K', circ(100, 140, 12));
      const foot = [poly(40, 340, 380, 340, 380, 300, 120, 300, 110, 210, 40, 220)];
      obj(g, 'n', ...foot);
      fill(g, 'K', circ(75, 255, 9));
      const shell = [circ(240, 220, 120)];
      obj(g, 'O', ...shell);
      within(g, shell, () => {
        fill(g, 'D', circ(270, 260, 120));
        fill(g, 'O', circ(230, 210, 105));
      });
      line(g, 'D', 18, ...arcPts(240, 220, 80, 0, Math.PI * 1.6, 12), ...arcPts(250, 215, 45, Math.PI * 1.6, Math.PI * 3.2, 10));
    },
  },
  {
    id: 'butterfly',
    name: { tr: 'Kelebek', en: 'Butterfly' },
    size: 36,
    draw(g) {
      const wings = [ell(115, 130, 95, 85, -0.4), ell(285, 130, 95, 85, 0.4), ell(130, 280, 70, 65, 0.4), ell(270, 280, 70, 65, -0.4)];
      obj(g, 'p', ...wings);
      within(g, wings, () => {
        for (const [x, y, r] of [[110, 125, 45], [290, 125, 45], [135, 280, 32], [265, 280, 32]]) fill(g, 'V', circ(x, y, r));
        for (const [x, y, r] of [[105, 120, 18], [295, 120, 18]]) fill(g, 'Y', circ(x, y, r));
      });
      obj(g, 'K', ell(200, 210, 22, 130));
      line(g, 'K', 8, 190, 90, 160, 30);
      line(g, 'K', 8, 210, 90, 240, 30);
    },
  },
  {
    id: 'whale',
    name: { tr: 'Balina', en: 'Whale' },
    size: 38,
    draw(g) {
      line(g, 'b', 12, 150, 90, 150, 40);
      line(g, 'b', 10, 150, 60, 115, 35);
      line(g, 'b', 10, 150, 60, 185, 35);
      const body = [ell(180, 240, 165, 115), poly(310, 230, 390, 140, 395, 220, 360, 260)];
      obj(g, 'B', ...body);
      within(g, body, () => {
        fill(g, 'b', ell(170, 320, 150, 60));
        for (let x = 80; x < 300; x += 40) line(g, 'U', 6, x, 290, x + 10, 345);
      });
      fill(g, 'K', circ(110, 220, 14));
      fill(g, 'W', circ(114, 215, 5));
      line(g, 'K', 7, 55, 265, 95, 285, 140, 280);
      fill(g, 'P', ell(150, 255, 18, 10));
    },
  },
  {
    id: 'crab',
    name: { tr: 'Yengeç', en: 'Crab' },
    size: 36,
    draw(g) {
      for (const [x1, y1, x2, y2] of [[110, 250, 40, 320], [130, 280, 80, 360], [290, 250, 360, 320], [270, 280, 320, 360]]) {
        line(g, 'K', 32, x1, y1, x2, y2);
        line(g, 'R', 16, x1, y1, x2, y2);
      }
      line(g, 'K', 34, 130, 200, 80, 120);
      line(g, 'R', 18, 130, 200, 80, 120);
      line(g, 'K', 34, 270, 200, 320, 120);
      line(g, 'R', 18, 270, 200, 320, 120);
      obj(g, 'R', poly(30, 100, 80, 40, 120, 90, 80, 110, 110, 135, 60, 150), poly(370, 100, 320, 40, 280, 90, 320, 110, 290, 135, 340, 150));
      const body = [ell(200, 240, 130, 85)];
      obj(g, 'R', ...body);
      within(g, body, () => fill(g, 'r', ell(220, 310, 150, 50)));
      line(g, 'K', 8, 170, 165, 160, 120);
      line(g, 'K', 8, 230, 165, 240, 120);
      part(g, 'W', circ(160, 115, 18), 8);
      part(g, 'W', circ(240, 115, 18), 8);
      fill(g, 'K', circ(163, 118, 8));
      fill(g, 'K', circ(237, 118, 8));
      line(g, 'K', 7, 175, 250, 200, 265, 225, 250);
    },
  },
  {
    id: 'fox',
    name: { tr: 'Tilki', en: 'Fox' },
    size: 34,
    draw(g) {
      const head = [poly(55, 70, 175, 120, 110, 210), poly(345, 70, 225, 120, 290, 210), poly(55, 150, 200, 110, 345, 150, 200, 360)];
      obj(g, 'O', ...head);
      within(g, head, () => {
        fill(g, 'W', poly(40, 200, 200, 360, 200, 250, 130, 220));
        fill(g, 'W', poly(360, 200, 200, 360, 200, 250, 270, 220));
        fill(g, 'D', poly(200, 120, 400, 160, 400, 400, 200, 400));
      });
      fill(g, 'K', poly(85, 95, 140, 125, 108, 160));
      fill(g, 'K', poly(315, 95, 260, 125, 292, 160));
      fill(g, 'K', ell(150, 205, 14, 20));
      fill(g, 'K', ell(250, 205, 14, 20));
      fill(g, 'K', ell(200, 335, 22, 16));
    },
  },
  {
    id: 'mouse',
    name: { tr: 'Fare', en: 'Mouse' },
    size: 34,
    draw(g) {
      const ears = [circ(95, 120, 80), circ(305, 120, 80)];
      obj(g, 'w', ...ears);
      fill(g, 'P', circ(95, 125, 50));
      fill(g, 'P', circ(305, 125, 50));
      const head = [ell(200, 245, 130, 120)];
      obj(g, 'w', ...head);
      within(g, head, () => fill(g, 'W', ell(200, 300, 90, 70)));
      fill(g, 'K', ell(155, 225, 16, 22));
      fill(g, 'K', ell(245, 225, 16, 22));
      fill(g, 'W', circ(160, 218, 6));
      fill(g, 'W', circ(250, 218, 6));
      part(g, 'P', circ(200, 275, 18), 8);
      for (const [x1, y1, x2, y2] of [[150, 285, 60, 270], [150, 300, 60, 315], [250, 285, 340, 270], [250, 300, 340, 315]]) line(g, 'K', 5, x1, y1, x2, y2);
    },
  },
  {
    id: 'bear',
    name: { tr: 'Ayı', en: 'Bear' },
    size: 34,
    draw(g) {
      const head = [circ(95, 105, 55), circ(305, 105, 55), ell(200, 225, 160, 140)];
      obj(g, 'N', ...head);
      within(g, head, () => {
        fill(g, 'M', ell(270, 340, 160, 70));
        fill(g, 'T', circ(95, 105, 28));
        fill(g, 'T', circ(305, 105, 28));
      });
      fill(g, 'n', ell(200, 275, 75, 55));
      fill(g, 'K', circ(145, 205, 16));
      fill(g, 'K', circ(255, 205, 16));
      fill(g, 'W', circ(150, 199, 5));
      fill(g, 'W', circ(260, 199, 5));
      fill(g, 'K', ell(200, 255, 26, 18));
      line(g, 'K', 7, 175, 295, 200, 285, 225, 295);
    },
  },
];
