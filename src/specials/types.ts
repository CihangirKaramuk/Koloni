import type { Cell, Stack } from '../core/types';

/**
 * Özel blok kuralı (tahtadaki hücreler). Yeni bir blok türü eklemek için
 * bu arayüzü uygulayan bir dosya yazıp specials/index.ts'e kaydetmek yeterli.
 */
export interface CellRule {
  id: string;
  /** Başlangıç lokma sayısı. */
  hp: number;
  /** Bir lokma yendi ama hücre bitmedi. */
  onBite?(cell: Cell): void;
}

/** Özel stack kuralı (kuyruktaki karınca grupları). */
export interface StackRule {
  id: string;
  /** false dönerse bu stack'e dokunulamaz. */
  canTap?(s: Stack): boolean;
  /** Başka bir stack'e dokunulduğunda her bekleyen stack için çağrılır. */
  onOtherTapped?(s: Stack): void;
  /** Stack sütunun önüne geldiğinde çağrılır. */
  onFront?(s: Stack): void;
}
