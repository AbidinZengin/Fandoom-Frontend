---
name: editorial-voice
description: >-
  Fandoom'un derin-analiz editör dili. Bölüm/yapım analizi metni
  (EpisodeStory tipi uzun editöryel içerik) yazarken, düzenlerken veya
  denetlerken kullan. Kullanıcı "bölüm analizi yaz", "şu bölümü ele al",
  "analiz metnini düzelt" dediğinde devreye girer. UI copy'yi KAPSAMAZ —
  buton/başlık/boş durum metinleri learned-rules'un kısa-copy kuralına
  tabidir.
---

# Editorial Voice — Derin-Analiz Yazım Dili

Fandoom'un uzun editöryel metni bir özet değil, bir **argümandır**. Bu
dosya o argümanın sesini ölçülebilir kurallara çevirir.

**Altın örnek:** `src/pages/series/GameOfThrones/EpisodePage/EpisodeStory/
EpisodeStory.data.js` → `'1-1'`. Kural ile örnek çelişirse örnek kazanır;
çelişkiyi buraya kural olarak yaz.

**Kapsam sınırı:** Yalnız derin-analiz. News/Blog/bölüm özeti ve UI chrome
bu skill'in dışındadır.

## 1. Dil politikası — iki dilli

Site iki dillidir (TR + EN). İkisi de yayın kalitesindedir, biri diğerinin
gölgesi değildir.

- **Üretim sırası:** ÖNCE Türkçe yazılır → kullanıcı kaliteyi denetler →
  onaydan sonra İngilizce üretilir. Türkçe kaynak metindir.
- **İngilizce ÇEVİRİ DEĞİL, yeniden yazımdır.** Aynı tez, aynı yapı, aynı
  sahne sırası — ama İngilizcenin kendi ritmiyle kurulur. Birebir çeviri
  cümle yapısı taşır ve çeviri kokar; bu bir FAIL.
- **İngilizce imla BrE'dir:** `recognise`, `agonise`, `licence`, `honour`,
  `labour`, `theatre`. Tek metinde AmE/BrE karışımı FAIL. (Mevcut altın
  örnekte `honor` geçiyor — o bir hatadır, `honour` olarak düzeltilecek.)
- **Türkçe imla TDK'ya uyar**, diakritikler eksiksizdir. Kesme işareti
  özel adlarda kullanılır: `Ned'in`, `Winterfell'de`, `Stark'ların`.

### Türkçe terim politikası

Karışık bir evrende tutarlılık için sabit ayrım:

- **Orijinal kalır:** yer ve hane adları, kişi adları, kültüre özgü
  terimler — Winterfell, Casterly Rock, Stark, Lannister, Dothraki,
  khalasar, khaleesi, Valyrian.
- **Türkçeleşir:** kurum, ırk, unvan ve doğal öğeler — Gece Nöbeti,
  Ak Gezenler, Duvar, Kuzey, Demir Taht, Kralın Eli, kar kurdu,
  Dar Deniz, Yedi Krallık.
- Kararsız kaldığın terimi uydurma — orijinal bırak ve teslim özetinde
  bildir, politikaya kural olarak eklenir.

### Yapısal eşdeğerlik (KRİTİK)

İki dil aynı grid'e oturur. `col`/`row` değerleri, sahne `id`'leri, blok
sayısı ve `quote` konumları **birebir aynıdır** — dile göre kompozisyon
değişmez.

- Türkçe aynı içeriği doğal olarak daha uzun anlatır. Tolerans:
  **TR karakter sayısı EN'in ±%15'i içinde kalmalı.** Aşarsa metin
  kısaltılır, grid genişletilmez.
- Bir dilde paragraf bölünüyorsa diğerinde de bölünür.

## 2. Duruş — sesin çekirdeği

- **Tez önce, olay sonra.** Her sahne bir iddiayla açılır; olay yalnızca
  iddiayı taşıyacak kadar anlatılır.
  ✅ *"Jenerik öncesi sekans olay örgüsü değil, tür işi yapar."*
- **Özet yasağı.** "Sonra şu oldu, ardından bu oldu" zinciri FAIL. Okur
  bölümü izlemiş varsayılır.
- **Eleştirmen, hayran değil.** Kusur açıkça söylenir.
  ✅ *"en görünür ve en dengesiz olduğu yer"*, *"senaryonun yetişemediği
  bir iş yapan performans"*
- **Kuru ironi, coşku yok.** ✅ *"Şaka budur ve nazik bir şaka değildir."*
- **Okura güven.** Sembol açıklanmaz, kurulur ve bırakılır. Metin kendi
  zekâsını alkışlamaz.

## 3. Zorunlu üç eksen

Her analiz metni üç ekseni de işler. Biri eksikse metin yarımdır.

1. **Sinematografi ve sahneleme** — kadraj, palet, ışık, kamera yüksekliği,
   ses tasarımı, blocking. Yönetmen/görüntü yönetmeni adıyla anılır ve ne
   yaptığı söylenir.
   ✅ *"Van Patten sonrasını kabaca Bran'ın boyundan çeker."*
2. **Sembolizm** — imge ne yapıyor, karakterler onu okuyor mu. En güçlü
   hâli: izleyicinin gördüğü, karakterlerin göremediği sembol.
   ✅ *"bir geyiğin öldürdüğü kurt… kesinlikle hiç kimse tarafından
   okunmamıştır."*
3. **Felsefî okuma** — sahnenin altındaki etik/politik iddia. Filozof adı
   anmak zorunlu değil; anılırsa **tek cümlede işlevsel** olur, ders
   verilmez. Alıntı yapılmaz, terim yığılmaz.
   ✅ *"Deontoloji burada vicdanı temizler ama kurbanı kurtarmaz."*
   ❌ Paragraf boyu Kant özeti.

## 4. Cümle mekaniği

- **Antitez kalıbı — "X değil, Y"** baskın imzadır. Her sahnede en az bir
  kez, metin genelinde 4-8 kez. Fazlası maniyerizm olur.
  TR: `…değil, …` / `…yerine…` / `…den çok…`
  EN: `not X but Y` / `X rather than Y`
- **Üçlü ritim.** ✅ *"nal sesleri, gıcırdayan deri ve uzun hiçlik
  aralıkları"*
- **Kapanış aforizması.** Her paragraf kısa, vurucu bir cümleyle biter.
  Uzun cümleden sonra kısa cümle — ritim buradan gelir.
  ✅ *"…ve ölüler ortadan kaybolmuştur."*
- **Şimdiki zaman.** Sahne anlatımı geniş/şimdiki zamandadır, geçmiş
  zamanda değil.
- **Şahıs:** "sen/siz" hitabı YOK. "Biz" yalnız izleyici deneyimini
  anlatırken kullanılır (*"O odada ne beklediğini biliyoruz"*), yazarlık
  çoğulu olarak değil.
- **Oyuncu adı + ne yaptığı.** ✅ *"Mark Addy, Robert'ı kendi tacından
  yorulmuş bir adam olarak oynar."* Salt isim sayma FAIL.

## 5. Yasaklar

- Ünlem işareti, emoji, büyük harfle bağırma.
- Boş yüceltme sıfatları: *muhteşem, efsanevi, destansı, unutulmaz,
  epic, iconic, masterpiece*.
- Klişe eleştirmen kalıpları: *"tam anlamıyla bir başyapıt"*,
  *"kelimenin tam anlamıyla"*, *"tüyleri diken diken eden"*.
- Soru sorup kendi sorusunu cevaplama (*"Peki bu ne anlama geliyor?"*).
- Wikipedia sesi: yayın tarihi, izlenme oranı, ödül listesi — bir tezi
  taşımıyorsa metne girmez.
- Olay spoiler'ı: analiz edilen bölümün ÖTESİNDEKİ olaylar anlatılmaz.
  **Tematik ileri-referans serbesttir** — *"dizinin geri kalanı bu kodu
  söküp dağıtmaya harcanacaktır"* ✅, *"Ned 9. bölümde ölür"* ❌.

## 6. Yapısal ölçüler

`EpisodeStory.data.js` şemasına birebir karşılık gelir:

| Alan | Kural |
|---|---|
| `thesis` | 4-6 cümle. Bölümün tek cümlelik iddiasını açar; sahne özeti değildir. |
| `kicker` | 2-4 kelime, kısa etiket. *"Before the Title Card"*, *"The Episode's Thesis"* |
| `title` | İmgesel, 3-7 kelime. *"A Realm at War with Winter"* — kicker'ı tekrar etmez. |
| `text[].lead: true` | Sahnenin açılış bloğu. 1 paragraf, 5-7 cümle. Tezi kurar. |
| `text[]` normal | 1-2 paragraf, paragraf başına 3-6 cümle. |
| `quote` | **Editörün kendi damıtılmış cümlesi — replik alıntısı DEĞİL.** 8-14 kelime, tek cümle, nokta ile biter. Metinden kopyalanmaz; metnin tezini sıkıştırır. |
| Sahne sayısı | 5-7. Her sahne bölümün bir hareketine karşılık gelir. |
| `tone` | `deep` (ağır/tematik sahne) veya `soft` (sıcak/insani sahne) — ardışık aynı ton 3'ü geçmez. |

Sahne sırası bölümün kronolojisini izler; finalde `pinned: true` olan
kapanış sahnesi bulunur.

## 7. Üretim akışı

1. Bölümü ve kredileri doğrula (yönetmen, görüntü yönetmeni, kilit
   oyuncular). **Uydurma yok** — emin değilsen kullanıcıya sor.
2. Tek cümlelik tez yaz. Metnin tamamı bu tezi kanıtlar.
3. Sahneleri seç (5-7), her birine bir hareket ve bir eksen ağırlığı ata.
4. **Türkçe** metni yaz → kullanıcıya sun → onay.
5. **İngilizce** (BrE) yeniden yazım → §1 eşdeğerlik kontrolü.
6. §8 kontrol listesini işaretle, teslim özetine ekle.

Görsel seçimi ve `col`/`row` kompozisyonu bu skill'in işi değildir —
`EpisodeStory.data.js` başındaki kompozisyon modeli notu bağlayıcıdır.

> **Not:** Şema henüz locale-aware değil. i18n altyapısı gelene kadar
> Türkçe kaynak metin `EpisodeStory.data.js`'e YAZILMAZ; ayrı bir
> `.source.tr.md` dosyasında saklanır ve şema hazır olunca taşınır.

## 8. Kontrol listesi

Teslimden önce her madde işaretlenir. İşaretlenmeyen madde = FAIL.

**İçerik**
- [ ] Tek cümlelik tez var ve her sahne onu besliyor
- [ ] Üç eksen (sinematografi / sembolizm / felsefe) metin genelinde işlendi
- [ ] En az bir yerde bölümün kusuru söylendi
- [ ] Yönetmen + en az 2 oyuncu adla ve yaptığı işle anıldı
- [ ] Olay özeti zinciri yok
- [ ] Bölüm ötesi olay spoiler'ı yok

**Ses**
- [ ] "X değil, Y" antitezi 4-8 kez
- [ ] Her paragraf kısa vurucu cümleyle kapanıyor
- [ ] Şimdiki zaman, "sen" hitabı yok
- [ ] Yasak sıfat/klişe listesinden hiçbiri geçmiyor
- [ ] Ünlem/emoji yok

**Yapı**
- [ ] `thesis` 4-6 cümle
- [ ] Sahne sayısı 5-7, final `pinned`
- [ ] Her `quote` editörün kendi cümlesi, 8-14 kelime
- [ ] `tone` dizisi 3'ten fazla ardışık aynı değeri içermiyor

**İki dil**
- [ ] TR ve EN aynı sahne `id`, `col`, `row`, blok sayısına sahip
- [ ] TR karakter sayısı EN'in ±%15'i içinde
- [ ] EN metin baştan sona BrE
- [ ] Türkçe terim politikası (§1) tutarlı uygulandı
