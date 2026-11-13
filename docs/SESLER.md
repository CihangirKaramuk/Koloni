# Sesler

`public/sfx/` altındaki dosyalar otomatik kullanılır. Bir dosya yoksa ya da tarayıcı onu çözemezse oyun kodla üretilen yedek sesi çalar, yani ses hiç kesilmez.

## Şu anki dosyalar
Hepsi **Kenney** paketlerinden, lisans **CC0** (kamu malı, ticari kullanım serbest, atıf zorunlu değil). Lisans metinleri `docs/licenses/` altında.

| Oyundaki dosya | Ne zaman | Kaynak paket / dosya |
| --- | --- | --- |
| `tap.ogg` | Karınca grubuna dokununca | Interface Sounds / `select_002` |
| `blocked.ogg` | Dokunulamayan gruba dokununca | Interface Sounds / `error_004` |
| `slotDone.ogg` | Slot boşalınca | Interface Sounds / `confirmation_001` |
| `burn.ogg` | Ateş karıncası | Impact Sounds / `impactPunch_heavy_000` |
| `thaw.ogg` | Donmuş grup çözülünce | Interface Sounds / `glass_002` |
| `button.ogg` | Arayüz butonları | Interface Sounds / `click_002` |
| `win.ogg` | Bölüm kazanılınca | Music Jingles / `jingles_PIZZI04` |
| `lose.ogg` | Bölüm kaybedilince | Music Jingles / `jingles_PIZZI14` |

Paketler: https://kenney.nl/assets/interface-sounds · https://kenney.nl/assets/impact-sounds · https://kenney.nl/assets/music-jingles

## Değiştirmek
Aynı ada sahip başka bir `.ogg` veya `.mp3` dosyasını `public/sfx/` altına koy. Seviye ayarı `src/audio/audio.ts` içindeki `VOLUME` tablosunda.

## Piksel alma sesi ve müzik (kodla üretilir)
- **Piksel alma:** çok kısık, kısa bir kalimba "tık"ı; notalar Do majör pentatonikten rastgele seçilir, böylece üst üste çalınca rahatsız etmez, müzikle uyumlu bir şıkırtı olur. Sıklığı sınırlıdır.
- **Müzik:** `src/audio/music.ts` içinde, yavaş (84 BPM), tatlı, kalimba tınılı 8 ölçülük döngü (C–Am–F–G–C–Em–F–G). Dosya yok. Melodiyi ve akorları oradaki dizilerden değiştirebilirsin.
- Hazır bir müzik dosyası kullanmak istersen `public/sfx/` altına koyup `src/audio/audio.ts` içindeki `MUSIC_FILE` değerine yolunu yaz.

## Not: iPhone / Safari
Dosyalar `.ogg` (Vorbis) formatında. Bazı eski Safari sürümleri bunu çözemez, o cihazlarda yedek sesler çalar. Her cihazda aynı sesi istersen dosyaların `.mp3` kopyalarını da yanına koy (ör. `tap.mp3`); oyun önce `.ogg`'u dener, olmazsa `.mp3`'ü kullanır.
