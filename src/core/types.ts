// Çekirdek veri tipleri. Bu klasör (core/) DOM'a, çizime ve sese dokunmaz;
// saf oyun kuralıdır, bu yüzden testlerde ekransız çalıştırılabilir.

/** Palet indeksi. Renk değerleri level/palette.ts içinde. */
export type ColorId = number;

/** Gökkuşağı grubu: karıncaları her renkten piksel alabilir. */
export const RAINBOW: ColorId = -2;

export type Side = 'top' | 'bottom' | 'left' | 'right';

export interface Cell {
  color: ColorId;
  /** Kalan "lokma" sayısı. 0 = boş. Buzlu bloklar 2 ile başlar. */
  hp: number;
  /** Bu hücreye yönelmiş, henüz yemeyi bitirmemiş karınca sayısı. */
  reserved: number;
  /** Özel blok modülü kimliği (ör. 'ice'). Yoksa undefined. */
  special?: string;
}

export interface StackDef {
  color: ColorId;
  count: number;
  /** Stack üzerindeki özel durumlar (specials/ modülleri yorumlar). */
  hidden?: boolean;
  /** Bu stack'e dokunabilmek için kaç başka dokunuş gerekiyor (buzlu stack). */
  frozen?: number;
}

export interface Stack extends StackDef {
  id: number;
  /** Henüz slottan çıkmamış karınca sayısı. */
  remaining: number;
}

export interface Slot {
  stack: Stack | null;
  /** Bir sonraki karıncanın çıkmasına kalan süre (sn). */
  cooldown: number;
}

/**
 * Karınca yolculuğu: slottan çık → yolda yürü → piksele gir → pikseli al →
 * geri çık → yolda yuvaya dön → pikselle birlikte yuvaya gir.
 */
export type AntPhase = 'exit' | 'track' | 'in' | 'grab' | 'out' | 'back' | 'home';

export interface Ant {
  id: number;
  color: ColorId;
  slotIndex: number;
  phase: AntPhase;
  /** Faz içi ilerleme (sn veya hücre birimi, faza göre). */
  t: number;
  /** Fazın toplam uzunluğu. */
  dur: number;
  /** Pistteki başlangıç ve bitiş parametresi (çevre uzunluğu birimi). */
  trackFrom: number;
  trackTo: number;
  /** +1 saat yönü, -1 ters. */
  dir: 1 | -1;
  targetX: number;
  targetY: number;
  side: Side;
  /** Animasyon için birikimli yürüme mesafesi. */
  walk: number;
  /** Çıktığı slotun tahta koordinatındaki yeri (slottan yola yürürken). */
  fromX: number;
  fromY: number;
  /** Slottan yola giden yol: slot → (gerekirse ara noktalar) → yol girişi. */
  path: { x: number; y: number }[];
  /** Dönüşte yoldan ayrılıp yuvaya indiği yol parametresi. */
  nestJoin: number;
  /** Yoldan piksele giden iç yol (boşlukların içinden), ve uzunluğu. */
  inPts: { x: number; y: number }[];
  inLen: number;
  /** Taşıdığı pikselin rengi (-1: boş). */
  carry: ColorId;
  /** Yuvaya dönüş yönü. */
  backDir: 1 | -1;
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface LevelSpec {
  /** Satırlar; '.' boş, diğer karakterler palete göre renk. */
  art: string[];
  /** Her pikselin kaç×kaç bloğa büyütüleceği. */
  scale?: number;
  slots: number;
  columns: number;
  /** Bir stack'teki en fazla karınca sayısı. */
  maxStack: number;
  minStack?: number;
  seed: number;
  /** Buzlu blok oranı (0..1). */
  ice?: number;
  /** Gizli (?) stack oranı (0..1). */
  hidden?: number;
  /** Buzlu (dondurulmuş) stack sayısı. */
  frozenStacks?: number;
}

export interface LevelData {
  width: number;
  height: number;
  /** width*height; boş hücre için color = -1. */
  cells: { color: ColorId; special?: string }[];
  /** Kuyruk sütunları; her sütunda index 0 önde. */
  columns: StackDef[][];
  slots: number;
  /** Doğru sırada oynanırsa çözüme götüren dizi (test ve ipucu için). */
  solution: { column: number }[];
}
