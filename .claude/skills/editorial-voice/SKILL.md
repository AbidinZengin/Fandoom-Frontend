---
name: editorial-voice
description: >-
  Fandoom portalının TEK editöryel yazım dili — derin-analiz (EpisodeStory)
  ve blog taslakları (docs_dev/blog-drafts) dahil her uzun editöryel metin
  için geçerlidir, kapsam ayrımı yoktur. Kullanıcı "analiz yaz", "blog
  yazısı yaz", "taslak hazırla", "portal tarzında yaz", "metni denetle"
  dediğinde devreye girer. UI copy'yi KAPSAMAZ — buton/başlık/boş durum
  metinleri learned-rules'un kısa-copy kuralına tabidir.
---

# Editorial Voice — Portal'ın Tek Editöryel Sesi

Fandoom'un uzun editöryel metni (derin-analiz veya blog fark etmez) bir
özet değil, bir **argümandır**. Bu dosya o argümanın sesini ölçülebilir
kurallara çevirir.

> **2026-09-06 birleşimi:** Daha önce blog ve derin-analiz iki ayrı ses
> olarak ele alınıyordu (blog "antitez-ağırlıklı" analiz sesini
> kullanmıyordu). Kullanıcı bu ayrımı kaldırdı: artık portal genelinde
> TEK ses var, aşağıdaki kurallar hem blog hem derin-analiz için geçerli.

**Ses için altın örnek:** `docs_dev/blog-drafts/skyler-white-hakliydi.md`
— doğal, video-deneme tonu kullanıcı tarafından açıkça onaylanmış tek
referanstır. Yeni bir metin yazarken üslup için BUNU aç.

**Yapı için golden örnek (SADECE EpisodeStory veri şeması):**
`src/pages/series/GameOfThrones/EpisodePage/EpisodeStory/EpisodeStory.data.js`
→ `'1-1'`. **Dikkat:** bu örnek eski antitez-ağırlıklı sesle yazıldı, o
tonu artık KOPYALAMA — sadece alan şeması (`thesis`, `kicker`, `quote`
vb.) için bakılır. *(Rapor: bu eski içerik ileride yeni sesle yeniden
yazılmalı — ayrı görev, şimdi kapsam dışı.)*

Kural ile örnek çelişirse örnek kazanır; çelişkiyi buraya kural olarak yaz.

## 1. Dil politikası — iki dilli

Site iki dillidir (TR + EN). İkisi de yayın kalitesindedir, biri diğerinin
gölgesi değildir.

- **Üretim sırası:** ÖNCE Türkçe yazılır → kullanıcı kaliteyi denetler →
  onaydan sonra İngilizce üretilir. Türkçe kaynak metindir.
- **İngilizce ÇEVİRİ DEĞİL, yeniden yazımdır.** Aynı tez, aynı yapı, aynı
  sahne sırası — ama İngilizcenin kendi ritmiyle kurulur. Birebir çeviri
  cümle yapısı taşır ve çeviri kokar; bu bir FAIL.
- **İngilizce imla BrE'dir:** `recognise`, `agonise`, `licence`, `honour`,
  `labour`, `theatre`, `organise`, `colour`, `favour`, `behaviour`.
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

### Yapısal eşdeğerlik (KRİTİK — EpisodeStory şeması için)

İki dil aynı grid'e oturur. `col`/`row` değerleri, sahne `id`'leri, blok
sayısı ve `quote` konumları **birebir aynıdır** — dile göre kompozisyon
değişmez. (Serbest-format blog taslaklarında grid yok; bu madde sadece
EpisodeStory şemasına bağlı içerik için geçerlidir.)

- Türkçe aynı içeriği doğal olarak daha uzun anlatır. Tolerans:
  **TR karakter sayısı EN'in ±%15'i içinde kalmalı.** Aşarsa metin
  kısaltılır, grid genişletilmez.
- Bir dilde paragraf bölünüyorsa diğerinde de bölünür.

## 2. Duruş — sesin çekirdeği

- **Birinci ağızdan gözlem tonu.** Video-deneme/sohbet sesi — rapor veya
  akademik dil değil.
- **Doğal bağlaçlarla ilerleme:** "Sonra...", "Ama...", "İşte tam
  burada..." — cümleler zincirleme değil akış hâlinde bağlanır.
- **Önce kavram, sonra sahne.** Soyut bir fikir (batık maliyet tuzağı,
  temel atıf hatası, deontoloji) önce sade açıklanır, sonra doğrudan
  olaya/sahneye uygulanır. Filozof/kavram adı anılırsa tek cümlede
  işlevsel olur, ders verilmez.
- **Tez önce, olay sonra.** Her bölüm/sahne bir gözlem veya iddiayla
  açılır; olay yalnızca onu taşıyacak kadar anlatılır.
- **Özet yasağı.** "Sonra şu oldu, ardından bu oldu" zinciri FAIL. Okur
  eseri izlemiş/bilmiş varsayılır.
- **Eleştirmen, hayran değil.** Kusur açıkça söylenir.
- **Retorik soru-cevap YOK.** "Peki bu ne anlama geliyor?" diye sorup
  kendi kendine cevaplama yok; gözlem → çıkarım akışı kullanılır.
- **Kuru ironi, coşku yok.**
- **Okura güven.** Sembol/gönderme açıklanmaz, kurulur ve bırakılır.
  Metin kendi zekâsını alkışlamaz.
- **Açılış kalıbı:** genel/tüketilmiş söylemi adlandır ve reddet
  ("bugüne kadar söylenmedik söz kalmadı, ben bugün onlardan
  konuşmayacağım"), sonra TEK konuya daralt. İstatistik-hook veya
  sahne-betimlemesiyle AÇMA — ikisi de denenip "yapay" bulundu.

## 3. Bağlam genişletme — çapraz-alan çıkarımlar

Portalın imzası: konuyu sadece kendi alanında değil, görünüşte alakasız
başka bir alanla (felsefe, tarih, edebiyat/hikâye, sanat, gündelik hayat)
ilişkilendirerek okumak. Bu hem bağlamı güçlendirir hem farklı bir bakış
açısı katar. Bu kural HEM blog HEM derin-analiz için geçerlidir.

**Nasıl uygulanır:**
- Araştırma sadece ana konunun kendi kaynaklarıyla sınırlı kalmaz — ana
  konuyu destekleyebilecek, onun üzerine yazılmış yan yazıları/analizleri
  de araştır (web-researcher agent'ı bu ikinci tur araştırma için de
  kullanılır).
- Örnek: "Black Swan" (film) hakkında yazarken sadece film eleştirilerini
  değil, siyah/beyaz kuğu sembolizmi üzerine yazılmış metinleri de
  araştır — bu, masumiyet kaybı / Madonna-fahişe kompleksi gibi bambaşka
  bir okuma katmanı açabilir.
- Çapraz-alan çıkarımı ana argümanı DESTEKLER, yerini almaz. Ayrı, kopuk
  bir bölüm gibi durmaz — ana teze hizmet eden 1 (nadiren 2) bölümde/
  sahnede örülür.

**Sınır (KRİTİK):** Aşırıya kaçma. Yan alandaki çıkarım metnin TEK odağı
hâline gelirse metin kopuk ve okunması güç hale gelir — bu FAIL. Çapraz-
alan referansı bir kıvılcım/derinlik katmanıdır, ana konunun yerini alan
ikinci bir makale değildir.

## 4. Cümle mekaniği

- **Antitez kalıbı — "X değil, Y"** (TR: `…değil, …` / `…yerine…` /
  `…den çok…`; EN: `not X but Y` / `X rather than Y`) artık **baskın
  imza DEĞİL**, serbest kullanılan araçlardan biridir. Doğal akışa
  zorlanarak sıkıştırılmaz; metinde hiç geçmese de sorun değildir.
  (Önceki "4-8 kez zorunlu" kuralı KALDIRILDI — kullanıcı bu yoğunluğu
  "yapay" buldu.)
- **Üçlü ritim.** Yeri geldiğinde: *"nal sesleri, gıcırdayan deri ve
  uzun hiçlik aralıkları"* gibi üç öğeli sıralama güçlü bir araçtır ama
  zorunlu değildir.
- **Vurucu kapanış cümlesi** paragrafın doğal sonucuysa iyidir, ama HER
  paragrafta zorunlu değildir — doğal akışı bozacaksa atlanır.
- **Şimdiki zaman.** Sahne/olay anlatımı geniş/şimdiki zamandadır.
- **Şahıs:** "sen/siz" hitabı YOK. "Biz" yalnız izleyici deneyimini
  anlatırken kullanılır, yazarlık çoğulu olarak değil.
- **Oyuncu/yaratıcı adı + ne yaptığı.** ✅ *"Mark Addy, Robert'ı kendi
  tacından yorulmuş bir adam olarak oynar."* Salt isim sayma FAIL.

## 5. Pull-quote / damıtılmış cümle

- Pull-quote (ayrı vurgulanan tek cümle) EKLENEBİLİR ama **nadir ve
  zorlamasız** — sadece metinden doğal olarak çıkan, gerçekten güçlü
  bir cümle varsa. Varsayılan davranış paragraf içine gömmektir.
- Bir metinde toplam **0-2** pull-quote yeterlidir. Her bölüme/sahneye
  bir tane sıkıştırma — fazlası dekoratif zorlama olur.
- EpisodeStory şemasındaki `quote` alanı yapısal olarak zorunludur
  (bkz. §7a) ama içeriği bu maddedeki doğal/zorlamasız üslupla yazılır.

## 6. Yasaklar

- Ünlem işareti, emoji, büyük harfle bağırma.
- Boş yüceltme sıfatları: *muhteşem, efsanevi, destansı, unutulmaz,
  epic, iconic, masterpiece*.
- Klişe eleştirmen kalıpları: *"tam anlamıyla bir başyapıt"*,
  *"kelimenin tam anlamıyla"*, *"tüyleri diken diken eden"*.
- Soru sorup kendi sorusunu cevaplama (*"Peki bu ne anlama geliyor?"*).
- Wikipedia sesi: yayın tarihi, izlenme oranı, ödül listesi — bir tezi
  taşımıyorsa metne girmez.
- Olay spoiler'ı: analiz edilen bölüm/eserin ÖTESİNDEKİ olaylar
  anlatılmaz. **Tematik ileri-referans serbesttir** — *"dizinin geri
  kalanı bu kodu söküp dağıtmaya harcanacaktır"* ✅, *"Ned 9. bölümde
  ölür"* ❌.
- BTS/prodüksiyon mekanik trivia'sı (kaç fps çekildi, hangi lokasyon,
  peruk vb.) sahnenin ANLAMINI güçlendirmiyorsa metne girmez. Sadece
  doğrudan tematik paralellik kuran detaylar (1-2 tane, tek cümlelik
  dokunuş) kalır.

## 7. Yapısal ölçüler (içerik türüne göre değişir)

Ses (§1-6) her ikisinde de aynıdır; sadece BELGE ŞEKLİ farklıdır.

### 7a. EpisodeStory (derin-analiz veri şeması)

`EpisodeStory.data.js` şemasına birebir karşılık gelir:

| Alan | Kural |
|---|---|
| `thesis` | 4-6 cümle. Bölümün tek cümlelik iddiasını açar; sahne özeti değildir. |
| `kicker` | 2-4 kelime, kısa etiket. *"Before the Title Card"*, *"The Episode's Thesis"* |
| `title` | İmgesel, 3-7 kelime. *"A Realm at War with Winter"* — kicker'ı tekrar etmez. |
| `text[].lead: true` | Sahnenin açılış bloğu. 1 paragraf, 5-7 cümle. Tezi kurar. |
| `text[]` normal | 1-2 paragraf, paragraf başına 3-6 cümle. |
| `quote` | Editörün kendi damıtılmış cümlesi — replik alıntısı DEĞİL. 8-14 kelime, tek cümle. §5'teki doğal/zorlamasız üslupla yazılır. |
| Sahne sayısı | 5-7. Her sahne bölümün bir hareketine karşılık gelir. |
| `tone` | `deep` (ağır/tematik sahne) veya `soft` (sıcak/insani sahne) — ardışık aynı ton 3'ü geçmez. |

Sahne sırası bölümün kronolojisini izler; finalde `pinned: true` olan
kapanış sahnesi bulunur. Zorunlu üç eksen (yeri geldiğinde işlenir,
hepsi HER metinde zorunlu değildir ama en az biri güçlü olmalı):
sinematografi/sahneleme (kadraj, palet, ışık, blocking — yönetmen/
görüntü yönetmeni adıyla), sembolizm (imge ne yapıyor, karakterler onu
okuyor mu), felsefî okuma (sahnenin altındaki etik/politik iddia).

> **Not:** Şema henüz locale-aware değil. i18n altyapısı gelene kadar
> Türkçe kaynak metin `EpisodeStory.data.js`'e YAZILMAZ; ayrı bir
> `.source.tr.md` dosyasında saklanır ve şema hazır olunca taşınır.

Görsel seçimi ve `col`/`row` kompozisyonu bu skill'in işi değildir —
`EpisodeStory.data.js` başındaki kompozisyon modeli notu bağlayıcıdır.

### 7b. Blog taslağı (`docs_dev/blog-drafts/*.md`)

- **Kaynak notu:** üstte (blockquote OLMAYAN düz paragraf) hangi
  kaynaklardan (web-researcher raporu, Wikipedia, akademik makale,
  WebSearch doğrulaması) beslenildiği belirtilir. Cümleler hiçbir
  kaynaktan birebir kopyalanmaz.
- **Görseller bölümü:** seçilmemişse "henüz seçilmedi" notu; Cloudinary
  yüklemesi AYRI onay gerektiren bir adımdır, taslak aşamasında yapılmaz.
- **Kicker-Başlık-Dek** bloğu.
- **Kısa/soyut bölüm başlıkları:** Zemin, Teşhis, Kusur, Simetri gibi —
  sahne özeti değil, argümanın o bölümdeki işlevini adlandırır.
- TR onaylanmadan EN yazılmaz; onay sonrası EN aynı dosyanın sonuna
  `## EN` başlığıyla eklenir (ayrı dosya değil).

## 8. Üretim akışı

1. Konuyu ve gerekli olguları doğrula (yönetmen, kilit oyuncular, olay
   örgüsü). **Uydurma yok** — emin değilsen kullanıcıya sor.
2. Ana konuyu destekleyebilecek çapraz-alan yazılarını araştır (§3).
3. Tek cümlelik tez/gözlem belirle. Metnin tamamı bunu kanıtlar.
4. (EpisodeStory ise) sahneleri seç (5-7); (blog ise) bölüm başlıklarını
   belirle.
5. **Türkçe** metni yaz → kullanıcıya sun → onay.
6. **İngilizce** (BrE) yeniden yazım → §1 eşdeğerlik kontrolü.
7. §9 kontrol listesini işaretle, teslim özetine ekle.

## 9. Kontrol listesi

Teslimden önce her madde işaretlenir. İşaretlenmeyen madde = FAIL.

**İçerik**
- [ ] Tek cümlelik tez/gözlem var ve metin onu besliyor
- [ ] En az bir çapraz-alan (felsefe/tarih/sanat/gündelik hayat)
      bağlantısı var, ama ana konuyu boğmuyor (§3 sınırı)
- [ ] (EpisodeStory ise) üç eksenden en az biri güçlü işlendi
- [ ] En az bir yerde kusur/eleştiri söylendi
- [ ] Olay özeti zinciri yok, bölüm/eser ötesi spoiler yok
- [ ] BTS trivia'sı sadece tematik paralellik kuruyorsa var

**Ses**
- [ ] Açılış: genel söylemi adlandır-reddet → daralma kalıbı
- [ ] Retorik soru sorup kendi cevaplama yok
- [ ] Antitez kalıbı varsa doğal, zorlama sayıda değil (§4)
- [ ] Pull-quote sayısı 0-2, zorlama değil (§5)
- [ ] Şimdiki zaman, "sen" hitabı yok
- [ ] Yasak sıfat/klişe listesinden hiçbiri geçmiyor (§6)
- [ ] Ünlem/emoji yok

**İki dil**
- [ ] TR onaylandı, sonra EN (BrE) eklendi — çeviri değil yeniden yazım
- [ ] (EpisodeStory ise) TR/EN aynı sahne `id`, `col`, `row`, blok
      sayısına sahip; TR karakter sayısı EN'in ±%15'i içinde
- [ ] Türkçe terim politikası (§1) tutarlı uygulandı
