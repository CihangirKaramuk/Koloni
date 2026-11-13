/**
 * Ek bölüm çizimleri: araçlar, yapılar ve doğa.
 * Kurallar illustrations.ts ile aynı: 400×400 tuval, kalın siyah kontur, yalnızca palet harfleri.
 */
import { arcPts, circ, ell, fill, line, obj, part, poly, rrect, starPts, within, type Illustration } from './illustrations';

export const EXTRA_WORLD: Illustration[] = [
  {
    id: 'car',
    name: { tr: 'Araba', en: 'Car' },
    size: 38,
    draw(g) {
      const body = [rrect(20, 200, 360, 110, 40), poly(90, 210, 135, 110, 280, 110, 330, 210)];
      obj(g, 'R', ...body);
      within(g, body, () => {
        fill(g, 'r', rrect(0, 270, 400, 60, 0));
        fill(g, 'b', poly(115, 200, 150, 130, 200, 130, 200, 200));
        fill(g, 'b', poly(215, 200, 215, 130, 270, 130, 305, 200));
      });
      part(g, 'Y', ell(355, 235, 16, 12), 8);
      for (const x of [105, 295]) {
        part(g, 'K', circ(x, 310, 50), 10);
        fill(g, 'w', circ(x, 310, 22));
      }
    },
  },
  {
    id: 'airplane',
    name: { tr: 'Uçak', en: 'Airplane' },
    size: 38,
    draw(g) {
      obj(g, 'B', poly(170, 200, 260, 200, 150, 380, 100, 380), poly(170, 200, 260, 200, 150, 20, 100, 20));
      obj(g, 'B', poly(40, 160, 80, 160, 105, 200, 40, 200), poly(40, 240, 80, 240, 105, 200, 40, 200));
      const body = [ell(210, 200, 175, 50)];
      obj(g, 'W', ...body);
      within(g, body, () => {
        fill(g, 'w', rrect(0, 215, 400, 50, 0));
        fill(g, 'R', rrect(0, 185, 400, 14, 0));
      });
      for (const x of [170, 215, 260]) part(g, 'b', circ(x, 192, 12), 6);
      part(g, 'b', poly(330, 175, 370, 190, 335, 200), 6);
    },
  },
  {
    id: 'hotairballoon',
    name: { tr: 'Sıcak Hava Balonu', en: 'Hot Air Balloon' },
    size: 38,
    draw(g) {
      line(g, 'K', 6, 140, 260, 165, 330);
      line(g, 'K', 6, 260, 260, 235, 330);
      part(g, 'N', rrect(155, 320, 90, 65, 12));
      line(g, 'T', 6, 160, 345, 240, 345);
      const balloon = [circ(200, 150, 140), poly(80, 220, 320, 220, 245, 290, 155, 290)];
      obj(g, 'R', ...balloon);
      within(g, balloon, () => {
        fill(g, 'Y', ell(200, 160, 95, 170));
        fill(g, 'R', ell(200, 160, 48, 170));
        fill(g, 'O', rrect(0, 210, 400, 30, 0));
        fill(g, 'c', ell(120, 90, 20, 40, 0.4));
      });
    },
  },
  {
    id: 'ufo',
    name: { tr: 'Uzay Gemisi', en: 'UFO' },
    size: 38,
    draw(g) {
      for (const x of [120, 280]) line(g, 'K', 16, x, 250, x + (x < 200 ? -30 : 30), 330);
      const dome = [poly(...arcPts(200, 180, 90, Math.PI, Math.PI * 2, 18))];
      obj(g, 'b', ...dome);
      fill(g, 'W', ell(165, 140, 18, 26, 0.4));
      const disc = [ell(200, 210, 185, 60)];
      obj(g, 'w', ...disc);
      within(g, disc, () => fill(g, 'W', rrect(0, 130, 400, 70, 0)));
      for (const x of [80, 140, 200, 260, 320]) part(g, 'Y', circ(x, 225, 14), 8);
      fill(g, 'G', ell(200, 160, 30, 26));
      fill(g, 'K', circ(190, 155, 6));
      fill(g, 'K', circ(210, 155, 6));
    },
  },
  {
    id: 'castle',
    name: { tr: 'Kale', en: 'Castle' },
    size: 38,
    draw(g) {
      for (const x of [60, 340]) {
        part(g, 'B', poly(x - 50, 110, x + 50, 110, x, 20));
        line(g, 'K', 6, x, 20, x, 0);
        part(g, 'R', poly(x, 0, x + 34, 10, x, 20), 6);
      }
      const walls = [rrect(15, 110, 90, 270, 6), rrect(295, 110, 90, 270, 6), rrect(85, 180, 230, 200, 6)];
      for (const x of [95, 155, 215, 275]) walls.push(rrect(x, 150, 34, 40, 4));
      obj(g, 'w', ...walls);
      within(g, walls, () => {
        fill(g, 'W', rrect(0, 0, 400, 140, 0));
        for (let y = 210; y < 380; y += 44) for (let x = 20; x < 400; x += 70) line(g, 'W', 4, x, y, x + 40, y);
      });
      const door = [poly(...arcPts(200, 300, 50, Math.PI, Math.PI * 2, 12), 250, 380, 150, 380)];
      obj(g, 'N', ...door);
      line(g, 'M', 6, 200, 255, 200, 380);
      for (const x of [60, 340]) part(g, 'b', rrect(x - 15, 180, 30, 46, 15), 8);
    },
  },
  {
    id: 'lighthouse',
    name: { tr: 'Deniz Feneri', en: 'Lighthouse' },
    size: 38,
    draw(g) {
      for (const pts of [[230, 85, 395, 40], [230, 85, 395, 135]]) line(g, 'c', 18, ...pts);
      part(g, 'K', poly(...arcPts(200, 70, 50, Math.PI, Math.PI * 2, 10)), 10);
      part(g, 'Y', rrect(160, 70, 80, 60, 8), 12);
      const tower = [poly(140, 140, 260, 140, 300, 360, 100, 360), rrect(130, 125, 140, 25, 8)];
      obj(g, 'W', ...tower);
      within(g, tower, () => {
        fill(g, 'R', rrect(0, 180, 400, 50, 0));
        fill(g, 'R', rrect(0, 280, 400, 50, 0));
        fill(g, 'w', poly(220, 130, 400, 130, 400, 400, 260, 400));
      });
      part(g, 'N', rrect(180, 300, 40, 60, 10), 8);
      const sea = [rrect(10, 355, 380, 40, 20)];
      obj(g, 'B', ...sea);
    },
  },
  {
    id: 'tent',
    name: { tr: 'Çadır', en: 'Tent' },
    size: 36,
    draw(g) {
      line(g, 'K', 8, 200, 60, 200, 20);
      part(g, 'Y', poly(200, 20, 250, 32, 200, 46), 6);
      const tent = [poly(200, 60, 380, 360, 20, 360)];
      obj(g, 'O', ...tent);
      within(g, tent, () => {
        fill(g, 'D', poly(200, 60, 400, 400, 280, 400));
        fill(g, 'Y', rrect(0, 300, 400, 20, 0));
      });
      const door = [poly(200, 170, 260, 360, 140, 360)];
      obj(g, 'M', ...door);
      line(g, 'n', 6, 200, 170, 200, 360);
      for (const x of [20, 380]) line(g, 'N', 8, x, 360, x + (x < 200 ? -10 : 10), 390);
    },
  },
  {
    id: 'snowman',
    name: { tr: 'Kardan Adam', en: 'Snowman' },
    size: 36,
    draw(g) {
      line(g, 'K', 22, 110, 220, 40, 170);
      line(g, 'N', 10, 110, 220, 40, 170);
      line(g, 'K', 22, 290, 220, 360, 170);
      line(g, 'N', 10, 290, 220, 360, 170);
      const body = [circ(200, 300, 95), circ(200, 165, 75)];
      obj(g, 'W', ...body);
      within(g, body, () => fill(g, 'b', circ(260, 360, 90)));
      part(g, 'K', rrect(135, 30, 130, 30, 6), 10);
      part(g, 'K', rrect(155, 0, 90, 50, 8), 10);
      part(g, 'R', rrect(120, 215, 160, 32, 14), 10);
      part(g, 'R', rrect(225, 225, 34, 80, 10), 10);
      fill(g, 'K', circ(175, 150, 10));
      fill(g, 'K', circ(225, 150, 10));
      part(g, 'O', poly(195, 170, 205, 170, 270, 185), 6);
      for (const y of [275, 320, 360]) fill(g, 'K', circ(200, y, 10));
    },
  },
  {
    id: 'pumpkin',
    name: { tr: 'Bal Kabağı', en: 'Pumpkin' },
    size: 36,
    draw(g) {
      part(g, 'g', rrect(185, 30, 30, 70, 10), 12);
      part(g, 'G', ell(250, 60, 45, 22, -0.4));
      const body = [ell(130, 230, 95, 140), ell(270, 230, 95, 140), ell(200, 230, 90, 150)];
      obj(g, 'O', ...body);
      within(g, body, () => {
        fill(g, 'D', ell(320, 300, 120, 100));
        line(g, 'D', 10, 150, 100, 145, 370);
        line(g, 'D', 10, 250, 100, 255, 370);
      });
      fill(g, 'K', poly(130, 200, 175, 200, 152, 165));
      fill(g, 'K', poly(225, 200, 270, 200, 248, 165));
      fill(g, 'K', poly(110, 260, 290, 260, 260, 310, 230, 290, 200, 315, 170, 290, 140, 310));
    },
  },
  {
    id: 'palm',
    name: { tr: 'Palmiye', en: 'Palm Tree' },
    size: 38,
    draw(g) {
      const sand = [ell(200, 375, 170, 30)];
      obj(g, 'n', ...sand);
      line(g, 'K', 52, 200, 360, 215, 250, 200, 120);
      line(g, 'T', 32, 200, 360, 215, 250, 200, 120);
      for (const y of [320, 270, 220, 170]) line(g, 'N', 6, 188, y, 222, y - 6);
      const leaves = [
        poly(200, 110, 40, 110, 70, 150),
        poly(200, 110, 360, 110, 330, 150),
        poly(200, 110, 90, 30, 60, 70),
        poly(200, 110, 310, 30, 340, 70),
        poly(200, 110, 170, 10, 230, 10),
        poly(200, 110, 60, 200, 100, 220),
        poly(200, 110, 340, 200, 300, 220),
      ];
      obj(g, 'G', ...leaves);
      within(g, leaves, () => fill(g, 'g', rrect(0, 115, 400, 120, 0)));
      for (const [x, y] of [[180, 130], [220, 130], [200, 150]]) part(g, 'N', circ(x, y, 18), 8);
    },
  },
  {
    id: 'volcano',
    name: { tr: 'Yanardağ', en: 'Volcano' },
    size: 38,
    draw(g) {
      for (const [x, y, r] of [[160, 50, 30], [215, 30, 36], [270, 60, 26]]) part(g, 'w', circ(x, y, r), 10);
      const mount = [poly(20, 380, 150, 130, 250, 130, 380, 380)];
      obj(g, 'N', ...mount);
      within(g, mount, () => {
        fill(g, 'M', poly(200, 130, 400, 130, 400, 400, 260, 400));
        fill(g, 'R', poly(150, 130, 250, 130, 240, 180, 270, 230, 230, 270, 215, 210, 185, 250, 170, 200, 160, 160));
        fill(g, 'O', poly(165, 130, 235, 130, 225, 170, 200, 200, 180, 165));
      });
      part(g, 'R', ell(200, 130, 60, 18), 10);
      fill(g, 'Y', ell(200, 128, 34, 8));
    },
  },
  {
    id: 'leaf',
    name: { tr: 'Sonbahar Yaprağı', en: 'Autumn Leaf' },
    size: 36,
    draw(g) {
      line(g, 'K', 28, 200, 330, 200, 395);
      line(g, 'N', 14, 200, 330, 200, 395);
      const leaf = [poly(200, 20, 240, 110, 330, 70, 300, 170, 380, 200, 300, 250, 330, 330, 200, 300, 70, 330, 100, 250, 20, 200, 100, 170, 70, 70, 160, 110)];
      obj(g, 'O', ...leaf);
      within(g, leaf, () => {
        fill(g, 'D', poly(200, 0, 400, 0, 400, 400, 200, 400));
        fill(g, 'Y', ell(150, 140, 40, 22, -0.6));
      });
      for (const pts of [[200, 300, 200, 60], [200, 230, 300, 120], [200, 230, 100, 120], [200, 270, 300, 230], [200, 270, 100, 230]]) line(g, 'r', 7, ...pts);
    },
  },
  {
    id: 'robot',
    name: { tr: 'Robot', en: 'Robot' },
    size: 36,
    draw(g) {
      line(g, 'K', 8, 200, 70, 200, 25);
      part(g, 'R', circ(200, 25, 18), 8);
      for (const x of [50, 350]) part(g, 'w', rrect(x - 25, 160, 50, 70, 14), 10);
      const head = [rrect(80, 70, 240, 200, 40)];
      obj(g, 'w', ...head);
      within(g, head, () => {
        fill(g, 'W', rrect(70, 60, 260, 50, 0));
        fill(g, 'b', ell(250, 260, 140, 30));
      });
      part(g, 'K', rrect(110, 110, 180, 90, 26), 10);
      fill(g, 'C', circ(160, 155, 22));
      fill(g, 'C', circ(240, 155, 22));
      fill(g, 'W', circ(166, 148, 7));
      fill(g, 'W', circ(246, 148, 7));
      part(g, 'w', rrect(150, 270, 100, 30, 8), 10);
      const body = [rrect(100, 295, 200, 95, 24)];
      obj(g, 'B', ...body);
      within(g, body, () => fill(g, 'U', rrect(0, 350, 400, 60, 0)));
      fill(g, 'Y', poly(...starPts(200, 335, 28, 12)));
      line(g, 'K', 6, 165, 230, 200, 245, 235, 230);
    },
  },
];
