/**
 * Oyunun renk paleti. Bölüm çizimlerinde her karakter bir rengi temsil eder.
 * Renkler birbirinden kolay ayrılsın diye bilerek az ve canlı tutuldu.
 */
export interface PaletteColor {
  char: string;
  hex: string;
  /** Koyu kontur / gölge tonu. */
  dark: string;
  name: { tr: string; en: string };
}

export const PALETTE: PaletteColor[] = [
  { char: 'R', hex: '#ee4035', dark: '#9e1f1a', name: { tr: 'Kırmızı', en: 'Red' } },
  { char: 'O', hex: '#ff8c1a', dark: '#b35a00', name: { tr: 'Turuncu', en: 'Orange' } },
  { char: 'Y', hex: '#ffd23f', dark: '#b8901a', name: { tr: 'Sarı', en: 'Yellow' } },
  { char: 'G', hex: '#4cc34a', dark: '#23772a', name: { tr: 'Yeşil', en: 'Green' } },
  { char: 'g', hex: '#1f7a3a', dark: '#0d3f1c', name: { tr: 'Koyu yeşil', en: 'Dark green' } },
  { char: 'L', hex: '#c3e85f', dark: '#7a9a24', name: { tr: 'Fıstık yeşili', en: 'Lime' } },
  { char: 'B', hex: '#3a8dff', dark: '#1a4fa8', name: { tr: 'Mavi', en: 'Blue' } },
  { char: 'b', hex: '#86dcff', dark: '#3a8fb0', name: { tr: 'Açık mavi', en: 'Sky' } },
  { char: 'P', hex: '#ff79b0', dark: '#b33a72', name: { tr: 'Pembe', en: 'Pink' } },
  { char: 'p', hex: '#8a4fff', dark: '#4b22a8', name: { tr: 'Mor', en: 'Purple' } },
  { char: 'V', hex: '#d2b0ff', dark: '#8a62c2', name: { tr: 'Lila', en: 'Lilac' } },
  { char: 'N', hex: '#7a4a24', dark: '#3f230d', name: { tr: 'Kahverengi', en: 'Brown' } },
  { char: 'n', hex: '#e0a868', dark: '#94642d', name: { tr: 'Bej', en: 'Tan' } },
  { char: 'W', hex: '#fbf7ee', dark: '#a8a196', name: { tr: 'Beyaz', en: 'White' } },
  { char: 'K', hex: '#2b2838', dark: '#110f18', name: { tr: 'Siyah', en: 'Black' } },
  { char: 'D', hex: '#c8501c', dark: '#7a2a08', name: { tr: 'Kiremit', en: 'Rust' } },
  // Gölge / detay tonları (illüstrasyonlardan üretilen bölümler için)
  { char: 'r', hex: '#b3202a', dark: '#6e0f15', name: { tr: 'Bordo', en: 'Crimson' } },
  { char: 'y', hex: '#e0a01a', dark: '#8a5e05', name: { tr: 'Hardal', en: 'Mustard' } },
  { char: 'U', hex: '#2152c4', dark: '#102a6e', name: { tr: 'Lacivert', en: 'Navy' } },
  { char: 'q', hex: '#d0407c', dark: '#7e1d45', name: { tr: 'Fuşya', en: 'Magenta' } },
  { char: 'u', hex: '#5a2fc0', dark: '#2e1470', name: { tr: 'Patlıcan', en: 'Violet' } },
  { char: 'M', hex: '#4e2c14', dark: '#251305', name: { tr: 'Çikolata', en: 'Chocolate' } },
  { char: 'T', hex: '#b97a3c', dark: '#6a4114', name: { tr: 'Karamel', en: 'Caramel' } },
  { char: 'w', hex: '#d4cdc3', dark: '#857d72', name: { tr: 'Gri', en: 'Grey' } },
  { char: 'c', hex: '#fff0b8', dark: '#b8a56a', name: { tr: 'Krem', en: 'Cream' } },
  { char: 'S', hex: '#ff9c7a', dark: '#b55a3c', name: { tr: 'Somon', en: 'Salmon' } },
  { char: 'C', hex: '#22b8b0', dark: '#0e6662', name: { tr: 'Turkuaz', en: 'Teal' } },
];

export const CHAR_TO_COLOR: Record<string, number> = Object.fromEntries(PALETTE.map((c, i) => [c.char, i]));

export function colorHex(id: number): string {
  return PALETTE[id]?.hex ?? '#ff00ff';
}
