/**
 * Ekran yerleşimi. Dikey (telefon, 9:16) ve yatay (masaüstü, 16:9) için ayrı hesaplanır.
 * Mobilde dokunulacak her şey (slotlar, sütunlar) ekranın altında, başparmak bölgesinde.
 */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Layout {
  /** Tahtanın sol üst köşesi (piksel) ve hücre boyu. */
  boardX: number;
  boardY: number;
  cell: number;
  slotSize: number;
  slotCenters: { x: number; y: number }[];
  slotsPanel: Rect;
  tile: number;
  /** Her sütunun dokunma alanı ve öndeki stack'in merkezi. */
  columns: { rect: Rect; cx: number; cy: number }[];
  queuePanel: Rect;
  /** Karınca yuvası (delik): tepsinin altında, slotların üstünde. rx/ry yarıçap. */
  nest: { x: number; y: number; rx: number; ry: number };
}

export interface LayoutInput {
  w: number;
  h: number;
  boardW: number;
  boardH: number;
  slots: number;
  columns: number;
  /** Üstteki HTML çubuğu için ayrılan yükseklik. */
  top: number;
  /** Alttaki güçlendirici çubuğu için ayrılan yükseklik. */
  bottom: number;
}

/** Tahta + çevresindeki yol için hücre biriminde pay. */
const BOARD_MARGIN = 3.6;

/**
 * Oyun her ekranda telefon düzeninde: ortada dikey bir sütun, tahta üstte, slotlar ve
 * gruplar altta. Masaüstünde sütun ortalanır (arayüz çubukları da aynı genişliği kullanır).
 */
export function gameColumnWidth(w: number, h: number): number {
  return Math.min(w, Math.max(420, h * 0.62));
}

export function computeLayout(i: LayoutInput): Layout {
  const colW = gameColumnWidth(i.w, i.h);
  const dx = (i.w - colW) / 2;
  const L = portraitLayout({ ...i, w: colW });
  if (dx === 0) return L;
  const shift = <T extends { x: number }>(r: T): T => ({ ...r, x: r.x + dx });
  return {
    ...L,
    boardX: L.boardX + dx,
    slotCenters: L.slotCenters.map(shift),
    slotsPanel: shift(L.slotsPanel),
    queuePanel: shift(L.queuePanel),
    nest: shift(L.nest),
    columns: L.columns.map((c) => ({ ...c, rect: shift(c.rect), cx: c.cx + dx })),
  };
}

function rowOfSlots(n: number, cx: number, y: number, maxW: number, maxSize: number) {
  const gap = 8;
  const size = Math.min(maxSize, (maxW - gap * (n - 1)) / n);
  const total = n * size + (n - 1) * gap;
  const x0 = cx - total / 2 + size / 2;
  return { size, centers: Array.from({ length: n }, (_, k) => ({ x: x0 + k * (size + gap), y })) };
}

function queueColumns(n: number, area: Rect, tile: number) {
  const colW = area.w / n;
  return Array.from({ length: n }, (_, k) => {
    const rect = { x: area.x + k * colW, y: area.y, w: colW, h: area.h };
    return { rect, cx: rect.x + colW / 2, cy: area.y + tile * 0.6 };
  });
}

function portraitLayout(i: LayoutInput): Layout {
  const pad = 12;
  const usableW = i.w - pad * 2;
  const slotMax = Math.min(64, i.h * 0.075);
  const slotSize = Math.min(slotMax, (usableW - 8 * 6) / Math.max(5, i.slots));
  // Sütun arttıkça kutular sütun genişliğinin daha büyük kısmını kullanır (dokunması rahat kalsın).
  const fill = i.columns >= 5 ? 0.74 : i.columns === 4 ? 0.66 : 0.56;
  const tile = Math.min(70, (usableW / i.columns) * fill, i.h * 0.075);
  const queueH = tile * 2.6;
  const queueY = i.h - i.bottom - queueH;
  const slotsY = queueY - 18 - slotSize / 2;
  const slotsPanel = { x: pad, y: slotsY - slotSize / 2 - 8, w: usableW, h: slotSize + 16 };

  // Yuva için tepsiyle slotlar arasında boşluk bırak.
  const nestRy = Math.max(9, Math.min(14, i.h * 0.015));
  const nestRx = nestRy * 2;
  const nestGap = nestRy * 2 + 30;
  // Yuva boşluğun üst kısmında: altında karıncaların yana geçeceği bir şerit kalır.
  const nest = { x: i.w / 2, y: slotsPanel.y - 4 - nestGap + nestRy + 6, rx: nestRx, ry: nestRy };
  const boardTop = i.top + 4;
  const boardBottom = slotsPanel.y - 4 - nestGap;
  const availH = boardBottom - boardTop;
  const cell = Math.min(usableW / (i.boardW + BOARD_MARGIN), availH / (i.boardH + BOARD_MARGIN));
  const boardX = i.w / 2 - (i.boardW * cell) / 2;
  const boardY = boardTop + availH / 2 - (i.boardH * cell) / 2;

  const slots = rowOfSlots(i.slots, i.w / 2, slotsY, usableW, slotMax);
  const queuePanel = { x: pad, y: queueY, w: usableW, h: queueH };
  return {
    boardX,
    boardY,
    cell,
    slotSize: slots.size,
    slotCenters: slots.centers,
    slotsPanel,
    tile,
    columns: queueColumns(i.columns, queuePanel, tile),
    queuePanel,
    nest,
  };
}
