/**
 * Görsel tema: ahşap masa üstünde, parlak 3B bloklu, yumuşak gölgeli "cilalı casual" stil.
 * Renkler ve şekiller tek yerden buradan değiştirilir.
 */
export const THEME = {
  // Ahşap masa
  woodLight: '#f0cfa4',
  woodMid: '#e6bd8c',
  woodDark: '#d6a676',
  woodGrain: 'rgba(150,95,45,0.10)',
  // Tepsi (tahta)
  tray: '#d6d0c8',
  trayEdge: '#f1ece6',
  trayShadow: 'rgba(120,70,30,0.28)',
  groove: 'rgba(160,120,90,0.16)',
  grooveDash: 'rgba(255,255,255,0.55)',
  // Karınca deliği
  holeOuter: '#9c6238',
  holeInner: '#4f2c16',
  // Slotlar
  slot: '#ffffff',
  slotShade: '#e7dccf',
  slotShadow: 'rgba(120,70,30,0.22)',
  // Kuyruk
  queueShade: 'rgba(120,70,30,0.10)',
  // Diğer
  ice: 'rgba(200,240,255,0.32)',
  iceEdge: 'rgba(255,255,255,0.95)',
  hidden: '#b8b2c8',
  hint: '#ffe25a',
  textDark: '#5a3418',
  font: '"Lilita One", "Baloo 2", "Trebuchet MS", system-ui, sans-serif',
};

/** Renk karıştırma yardımcıları (parlak / gölge tonları için). */
export function mix(hex: string, to: string, k: number): string {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(to.slice(1), 16);
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

const shadeCache = new Map<string, { light: string; base: string; dark: string; deep: string }>();
export function shades(hex: string) {
  let s = shadeCache.get(hex);
  if (!s) {
    s = { light: mix(hex, '#ffffff', 0.38), base: hex, dark: mix(hex, '#000000', 0.22), deep: mix(hex, '#000000', 0.42) };
    shadeCache.set(hex, s);
  }
  return s;
}
