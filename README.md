# Koloni

Karınca temalı piksel bulmaca. Her bölüm pikselleştirilmiş bir resim (yemekler, hayvanlar, nesneler); bölümler sonsuz. Oyuncu alttaki karınca gruplarına dokunur, karıncalar tahtanın etrafında dolaşıp kendi renklerindeki açıkta kalan blokları yer. Slotlar dolup karıncalar yiyecek bulamazsa bölüm kaybedilir. Oyun [parolla](https://www.parolla.app) portalı için yapıldı.

## Komutlar

```bash
npm install        # bir kez
npm run dev        # geliştirme sunucusu → http://localhost:5173
npm test           # kurallar + tüm bölümlerin çözülebilirlik testi
npm run build      # yayın paketi → dist/
npm run preview    # dist/'i yerelde dene
```

`http://localhost:5173/?dev=1` adresi geliştirici modunu açar. `?dev=1&sandbox=1` ise ayrı bir kayıt alanı kullanır: denemeler gerçek ilerlemeye dokunmaz. Bu modda konsoldan `koloni.game`, `koloni.startLevel(5)` gibi komutlar kullanılabilir.

## Geliştirme araçları (yalnızca `npm run dev` açıkken)

| Adres | Ne işe yarar |
| --- | --- |
| `/tools/gallery.html` | `tools/illustrations.ts` içindeki yemek çizimlerini pikselleştirir. **Projeye kaydet** butonu sonucu `src/level/art/generated.ts` dosyasına yazar. |
| `/tools/png2level.html` | Herhangi bir PNG'yi (piksel art, illüstrasyon) palete çevirir ve bölüm kodu üretir. |
| `/tools/cover.html` | Parolla kapağını üretir (1920×1080). **Projeye kaydet** `docs/kapak.png` dosyasına yazar. |

## Klasör yapısı

```
src/
  core/        Saf oyun kuralları (DOM yok, test edilebilir)
    board.ts     Tahta, "açıkta mı" hesabı, lokma/rezervasyon
    track.ts     Tahtanın etrafındaki karınca yolu
    game.ts      Oyun durumu: dokunma, slotlar, karıncalar, kazan/kaybet, güçlendiriciler
  specials/    Özel bloklar ve gruplar (her biri tek dosya)
    ice.ts         Buzlu blok (2 lokma)
    frozenStack.ts Donmuş grup (N dokunuşta çözülür)
    hiddenStack.ts Gizli grup (öne gelince renk görünür)
  level/
    palette.ts   Renk paleti
    generator.ts Resimden bölüm üretimi + otomatik çözülebilirlik doğrulaması
    levels.ts    Bölüm listesi ve zorluk ayarları
    art/         Bölüm resimleri (generated.ts otomatik üretilir)
  render/      Canvas çizimi (ahşap masa, tepsi, 3B bloklar, karıncalar, gruplar)
  ui/          HTML arayüz (ana ekran, paneller, üst ve alt çubuk, metinler tr/en)
  platform/    parolla SDK sarmalayıcısı + ilerleme kaydı (yerel + bulut)
  audio/       Ses (public/sfx dosyaları, yoksa kodla üretilen yedek ses)
  app.ts       Hepsini birleştiren akış
tools/         Geliştirme araçları (yayına girmez)
tests/         Vitest testleri
docs/          Tasarım ve yayın notları
```

## Sık yapılacaklar

- **Yeni bölüm resmi:** `tools/illustrations.ts`'e bir çizim ekle, galeride **Projeye kaydet**'e bas. Resim kendiliğinden bölüm havuzuna girer (her resim 4 boyutta üretilir).
- **Yeni özel blok veya grup:** `src/specials/` içine `CellRule` ya da `StackRule` uygulayan bir dosya yaz ve `specials/index.ts`'e kaydet. Çizimini `render/renderer.ts` (`drawIce` örneği) veya `render/sprites.ts`'e ekle.
- **Zorluk ayarı:** `levels.ts` içinde: `TIER_WEIGHTS` (zorluk oranları), `SIZE_STAGES` (ilerledikçe resim boyutu), `MIN_ART_GAP` (aynı resmin tekrar aralığı), `TARGET_GROUPS` ve özel blokların başladığı bölümler.
- **Ses:** dosyaları `public/sfx/` altına koy. Ayrıntılar `docs/SESLER.md`'de.

Ayrıntılı tasarım: [docs/TASARIM.md](docs/TASARIM.md). Yayınlama: [docs/PAROLLA.md](docs/PAROLLA.md).
