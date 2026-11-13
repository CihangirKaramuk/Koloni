/**
 * Bölüm hazırlama işçisi (Web Worker). Resimden bölüm üretip çözülebilirliğini doğrulamak
 * büyük resimlerde 1-3 sn sürebilir; ana iş parçacığı (çizim, dokunma) donmasın diye burada yapılır.
 */
import { buildLevel } from './generator';
import { getLevel } from './levels';

self.onmessage = (e: MessageEvent<number>) => {
  const n = e.data;
  const level = buildLevel(getLevel(n).spec);
  (self as unknown as Worker).postMessage({ n, level });
};
