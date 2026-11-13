# Koloni: Tasarım Notları

## Çekirdek döngü
1. Tahtada, renkli bloklardan oluşan pikselleştirilmiş bir yemek resmi var.
2. Altta 3 sütun halinde **karınca grupları** duruyor. Her grubun bir rengi ve bir karınca sayısı var.
3. Bir sütuna dokununca öndeki grup boş bir **slota** geçer.
4. Slottan **yalnızca o an ulaşılabilen yiyecek kadar** karınca çıkar. Bir piksel, herhangi bir yanı tahtanın dışına ya da dışarıya bağlı boş bir alana açılıyorsa ulaşılabilirdir; karıncalar boşalmış alanların içinden yürüyebilir. Ulaşılabilen yiyecek yoksa karıncalar slotta bekler.
5. Karıncalar delikten çıkar, tahtanın etrafındaki yolda yürür, hedef bloğa girer ve onu yer. Bir karınca bir lokma yer.
6. Bir blok yenince arkasındaki bloklar açığa çıkar ve bekleyen karıncalar kendiliğinden yola çıkar.
7. **Kazanma:** resmin tamamı yenir. **Kaybetme:** bütün slotlar dolu, hiçbir karınca hareket edemiyor ve yeni grup koyacak yer yok.

Asıl bulmaca dokunma sırasıdır: önce dıştaki renkleri aç, içerideki renkler için slot harcama.

## Bölüm üretimi
- Resimler `tools/illustrations.ts` içinde vektör olarak çizilir (konturlu, gölgeli). Sonra pikselleştirilip palete çevrilir ve `generated.ts` dosyasına yazılır.
- `generator.ts` resmi dışarıdan içeri "soyarak" doğru bir yeme sırası bulur. Bu sırayı gruplara böler ve sütunlara sırayı koruyarak rastgele dağıtır. Böylece çözüm her zaman vardır, ama oyuncunun bulması gerekir.
- Her bölüm üretilince 4 farklı karınca davranışıyla ekransız oynanır ve gerçekten çözülebildiği doğrulanır. Doğrulanamazsa başka tohumla tekrar üretilir.
- `npm test` ilk 40 bölümü bu şekilde test eder.

## Sonsuz bölümler ve zorluk (`src/level/levels.ts`)
- Bölüm bitince oyuncu ana menüye döner; deliğin üstündeki küpte sıradaki bölümün numarası ve zorluğu yazar.
- **Zorluk** her bölüm için numaradan türeyen sabit bir rastgeleyle seçilir: Kolay %50 (sarı), Orta %30 (mavi), Zor %15 (mor), Ekstra Zor %5 (kırmızı). Art arda iki Ekstra Zor gelmez. İlk 5 bölüm öğreticidir, hep Kolay.
- **Resimler** (şu an 33: 15 yemek, 18 hayvan/eşya) bir döngüde karıştırılır; hepsi bir kez çıkmadan aynı resim tekrar gelmez. Tekrar gelen resim aynı bölüm olmaz: aynalanabilir, zorluğu, grup dağılımı ve özel taşları değişir.
- **Zor / Ekstra Zor** bölümler (ve Orta bölümlerin yarısı) aynı resmin daha yüksek çözünürlüklü (daha detaylı, daha katmanlı) halini kullanır.
- **Grup sütunu sayısı** piksel yoğunluğuna göre 3–5: 800 bloğun altı 3, 800–1400 arası 4, üstü 5 sütun.
- Özel taşlar kademeli açılır: buz 8., gizli grup 12., donmuş grup 16. bölümden sonra (zorluğa göre). Bir özel taş ilk kez görüldüğünde ipucu çıkar.
- Her bölüm oyuncuya verilmeden önce ekransız oynanarak doğrulanır; doğrulanamazsa başka dağılım, o da olmazsa +1 slot denenir. Çözülemeyen bölüm verilmez.
- Yeni resim eklemek: `tools/illustrations.ts`'e çiz → `/tools/gallery.html` → Projeye kaydet. Döngüye kendiliğinden girer.

| Zorluk | Slot | Özel taşlar | Ek ödül |
| --- | --- | --- | --- |
| Kolay | 5 | yok | — |
| Orta | 5 | bazen buz / gizli | +5 |
| Zor | 4 | buz, gizli, 2 donmuş | +10 |
| Ekstra Zor | 4 | daha çok buz/gizli, 3 donmuş | +20 |

## Ekonomi ve güçler
Tüm sayılar `src/economy.ts` içinde.

| | Değer |
| --- | --- |
| Başlangıç altını | 200 (+ her güçten 1 tane) |
| Bölüm kazanma | +15 altın (zor +10, çok zor +20 ek). Yalnızca ilk kazanışta verilir, tekrar oynayarak altın kasılamaz. |
| **Ekstra slot** | 120 altın: bölüm boyunca bir slot daha (en fazla 7) |
| **Havan topu** | 120 altın: tahtanın altında döner namlulu bir silah belirir, haritaya yayılan ~12 kavisli mermi atar; her mermi vurduğu pikseli (bazen yanındakini de) yok eder. Bölümü bitirecek kadar güçlü değildir. Ayarlar: `src/powers/minigun.ts` |
| **Parmak** | 250 altın: seçim modu açılır, tahtada bir renge dokununca o renkteki tüm pikseller yok olur. Vazgeçersen hak harcanmaz. |
| **Gökkuşağı yuvası** | 160 altın: her renkten piksel alabilen 24 karıncalık bir grup boş bir slota yerleşir. |
| **Hızlı karıncalar (2x)** | 100 altın: üstteki butonla açılıp kapanan zamanlı hız gücü (aşağıya bakın). |

- Gücün adedi alt çubukta rozet olarak görünür. Bitince yeşil **+** rozetine döner. Tıklayınca satın alma paneli açılır: altınla alınan güç envantere eklenir (butonda 1 görünür).
- Kaybetme panelinde "+1 slot" ve "Havan topu" var. Envanterde yoksa fiyatları yazar. (Gökkuşağı yuvası boş slot ister, o yüzden orada yok.)
- Bakiye ana ekranın üstünde ve oyun içinde alt çubuğun solunda görünür.
- Gerçek parayla satın alma yoktur (parolla kuralı). Altın yalnızca oynayarak ve günlük ödülle kazanılır; oyunda reklam yok.
- Yıldız: güç kullanmadan 3, bir güçle 2, daha fazlasıyla 1.

## Can sistemi
`src/lives.ts`, sayılar `src/economy.ts` içinde.
- En fazla **5 can**, her **15 dakikada 1 can** dolar (sayaç ana ekrandaki kalpte görünür).
- Bölüm kaybedilip "Tekrar" ya da "Ana sayfa" seçilince, veya bölüm yarıda bırakılınca (ayarlardan Tekrar/Ana sayfa) **1 can gider**. Hiç dokunmadan çıkmak ve kazanmak can harcatmaz. Güçle devam edilirse can gitmez.
- Can yokken bölüm başlamaz: "Can kalmadı" paneli açılır. Canları **200 altına** doldurmak mümkündür. Yeni can dolunca oyun kendiliğinden başlar.
- **Sınırsız can** aktifken kalpte ∞ ve kalan süre görünür, can harcanmaz.

## Günlük giriş ödülü
`src/daily.ts`. Günde bir kez alınır, ana ekran açılınca hazırsa panel kendiliğinden çıkar. Sol üstteki hediye butonunda kırmızı nokta "alınabilir" demektir. Bir gün kaçırılırsa seri 1. günden başlar, 7. günden sonra başa döner.

Hafta boyunca her ödül türü (altın, dört güç, hız, sınırsız can) en az bir kez gelir; değer gün gün artar.

| Gün | Ödül | Yaklaşık değer (altın) |
| --- | --- | --- |
| 1 | 50 altın | 50 |
| 2 | Havan topu | 120 |
| 3 | 3 dk hız + 50 altın | 150 |
| 4 | Ekstra slot + 15 dk sınırsız can | 170 |
| 5 | Gökkuşağı yuvası + 100 altın | 260 |
| 6 | Parmak + 3 dk hız | 350 |
| 7 | 300 altın + her güçten 1 + 30 dk sınırsız can | ~1000 |

## Parolla uyumu
- Açılışta `init()` çağrılır ve dil `locale`'e göre seçilir (tr/en).
- `gameplayStart` / `gameplayStop` oynanış, menü ve panel anlarında çağrılır.
- İlerleme misafirde localStorage'da, girişli oyuncuda ayrıca bulutta tutulur. Birleştirmede ilerleme asla geri gitmez. Kayıt 2 sn geciktirilir.
- Oyunda reklam yok.
- Sekme gizlenince oyun ve ses durur. Ses yalnızca ilk dokunuştan sonra başlar.

## Sonraki adımlar
- Döngüye uygun bir arka plan müziği (ses efektleri hazır, bkz. `docs/SESLER.md`).
- Daha fazla güçlendirici ("El": arkadaki bir grubu seç, "Top": bir sırayı temizle).
- Daha fazla resim ve özel blok (ateş bloğu, kilit-anahtar, taş).
- Skor tablosu: kendi sunucu ve `getToken()` doğrulaması gerekir.
