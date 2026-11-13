/**
 * Bölüm resimleri. Asıl kaynak tools/illustrations.ts: oradaki vektör çizimler
 * tools/gallery.html ile pikselleştirilip generated.ts'e yazılır.
 * Dışarıdan bir PNG eklemek için: tools/png2level.html.
 */
import { GENERATED } from './generated';

export interface PixelArt {
  id: string;
  name: { tr: string; en: string };
  /** '.' boş, diğer harfler palette.ts'deki renkler. */
  rows: string[];
  /** Aynı çizimin daha yüksek çözünürlüklü (detaylı) hali: zor bölümler için. */
  hd?: string[];
  /** İleri bölümler için daha büyük haller (1.6× ve 1.85×): daha çok piksel, daha uzun bölüm. */
  big?: string[][];
}

export const FOODS: PixelArt[] = GENERATED;
export const FOOD_BY_ID: Record<string, PixelArt> = Object.fromEntries(FOODS.map((f) => [f.id, f]));
