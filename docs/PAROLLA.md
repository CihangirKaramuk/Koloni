# Koloni'yi parolla'da yayınlama

## 1. Build al
```bash
npm run build
```
Çıktı `dist/` klasörüne yazılır (yaklaşık 2,2 MB, sınır ~15 MB). İçindeki tüm yollar göreli olduğu için klasör herhangi bir adreste, alt klasörde de çalışır.

## 2. HTTPS ile yayınla (kendi sunucumuz)
`dist/` klasörünün içeriğini sunucudaki web klasörüne kopyala ve HTTPS ile sun.
Parolla oyunu iframe içinde açtığı için sunucu iframe'i engelleyen başlık göndermemeli.
nginx örneği:
```nginx
add_header Content-Security-Policy "frame-ancestors 'self' https://www.parolla.app https://parolla.app";
# X-Frame-Options EKLEME
location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
```
`assets/` içindeki dosya adları her build'de değiştiği için uzun önbellek güvenlidir; `index.html` önbelleğe alınmamalı.

## 3. Önce yerelde portal içinde dene
Geliştirici panelinde oyun URL'sini geçici olarak `http://localhost:5173` yap ve **Önizleme**'yi kullan (Chrome veya Firefox). İncelemeye göndermeden önce gerçek HTTPS adresine geri dön.

## 4. Geliştirici panelinde doldurulacaklar (https://www.parolla.app/gelistirici)
| Alan | Öneri |
| --- | --- |
| Oyun adı | **Koloni** |
| Kısa açıklama | Karıncaları besle, piksel yemekleri bir lokmada bitir! Sırayı iyi seç, slotları doldurma. |
| Oyun URL'si | Sunucudaki HTTPS adresi |
| Platform | Masaüstü ve mobil |
| Tür | Bulmaca |
| Kapak (16:9) | Hazır: `docs/kapak.png` (1920×1080, ~400 KB). Yeniden üretmek için `npm run dev` → `/tools/cover.html` → **Projeye kaydet** |

**Nasıl oynanır** (oyun sayfasının altındaki açıklama):

> Alttaki karınca gruplarından birine dokun: grup bir slota geçer ve karıncalar yola çıkar. Karıncalar tahtanın etrafında dolaşır ve sadece dışarıdan görebildikleri, kendi renklerindeki blokları yer. Ulaşabilecekleri yiyecek yoksa slotta beklerler. Slotlar dolarsa koloni sıkışır! Önce dıştaki renkleri aç, içerideki renkleri sonraya bırak. Tüm resmi yediğinde bölüm biter.
> Buzlu bloklar iki lokmada biter, "?" grupların rengi öne gelince görünür, donmuş gruplar başka gruplara dokundukça çözülür.
> Zorlandığında +1 Slot ve Ateş Karıncası güçlendiricilerini kullanabilirsin.
> Masaüstünde 1–3 tuşları sütunlara dokunur, Esc ayarları açar.

## 5. İnceleme öncesi kontrol listesi
- [ ] Oyun kendi adresinde (portal dışında) hatasız açılıyor.
- [ ] Konsolda sürekli tekrar eden hata yok.
- [ ] Telefonda dikey, masaüstünde yatay düzgün görünüyor.
- [ ] Ses ilk dokunuştan önce çalmıyor, sekme değişince duruyor.
- [ ] Oyunda kendi reklamı, ödeme ekranı, giriş ekranı ya da dış bağlantı yok.
- [ ] Metinler Türkçe ve İngilizce.
