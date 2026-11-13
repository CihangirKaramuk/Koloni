/**
 * Bölüm yükleyici: bölümleri arka planda (Web Worker) hazırlar ve önbelleğe alır.
 * Oyun bir bölümü oynarken sıradakini `prefetch` ile önceden hazırlatır.
 * Worker yoksa (eski tarayıcı) aynı iş ana iş parçacığında yapılır.
 */
import type { LevelData } from '../core/types';
import { buildLevel } from './generator';
import { getLevel } from './levels';

const cache = new Map<number, Promise<LevelData>>();
const waiting = new Map<number, (lv: LevelData) => void>();
let worker: Worker | null = null;
let workerFailed = false;

function getWorker(): Worker | null {
  if (worker || workerFailed) return worker;
  try {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ n: number; level: LevelData }>) => {
      waiting.get(e.data.n)?.(e.data.level);
      waiting.delete(e.data.n);
    };
    worker.onerror = () => {
      // İşçi çalışmazsa bekleyenleri ana iş parçacığında tamamla.
      workerFailed = true;
      worker = null;
      for (const [n, resolve] of waiting) resolve(buildLevel(getLevel(n).spec));
      waiting.clear();
    };
  } catch {
    workerFailed = true;
    worker = null;
  }
  return worker;
}

/** n. bölümün verisi (hazırsa hemen, değilse hazırlanınca). */
export function loadLevel(n: number): Promise<LevelData> {
  const hit = cache.get(n);
  if (hit) return hit;
  const w = getWorker();
  const p = w
    ? new Promise<LevelData>((resolve) => {
        waiting.set(n, resolve);
        w.postMessage(n);
      })
    : Promise.resolve().then(() => buildLevel(getLevel(n).spec));
  cache.set(n, p);
  // Önbellek sınırsız büyümesin
  if (cache.size > 6) {
    const oldest = [...cache.keys()].sort((a, b) => a - b)[0];
    if (oldest !== n) cache.delete(oldest);
  }
  return p;
}

/** Sıradaki bölümü arka planda hazırlat. */
export function prefetchLevel(n: number) {
  void loadLevel(n);
}
