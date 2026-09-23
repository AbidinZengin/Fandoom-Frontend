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
`src/pages/Series/GameOfThrones/EpisodePage/EpisodeStory/EpisodeStory.data.js`
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
- **Olay/bağlam anlatımı SERBEST, gereksiz yere kaçınılmaz.** Analizin
  dayandığı sahne/olay örgüsü izleyicinin takip edebileceği kadar
  anlatılır — "Sonra şu oldu, ardından bu oldu" zinciri hâlâ FAIL (olay
  kronolojisi tek başına amaç olamaz) ama okurun eseri zaten bildiği
  varsayımıyla bağlam atlamak da FAIL. Wikipedia sesi (yayın tarihi,
  izlenme oranı, ödül listesi) hâlâ yasak — bu madde SADECE anlaşılmak
  için gereken olay/karakter/kavram bağlamını kapsar.
- **Eleştirmen, hayran değil.** Kusur açıkça söylenir.
- **Retorik soru-cevap ANA YAPI ARACIDIR.** Soru sorup cevaplayarak
  ilerlemek FAIL değil — Portal'ın gerçek sesinin omurgası budur ("Peki
  kadınlar, onların da bir gölgesi yok mudur?", "Peki nedir gölge
  yansıtması?"). İzleyicinin aklından geçebilecek itirazı önden
  yakalayıp cevaplamak da ("Şöyle bir soru sorabilirsiniz: ...")
  meşru bir araçtır.
- **Kuru ironi, coşku yok.**
- **Okura güven.** Sembol/gönderme açıklanmaz, kurulur ve bırakılır —
  ama olay/karakter bağlamı (yukarıya bkz.) bundan ayrıdır.
- **Açılış kalıbı:** genel/tüketilmiş söylemi adlandır ve reddet
  ("bugüne kadar söylenmedik söz kalmadı, ben bugün onlardan
  konuşmayacağım") YA DA bir alıntı/özdeyişle açıp anlamını sorma
  ("Kökleri cehenneme uzanmayan bir ağacın dalları cennete yükselemez.
  Bu söz bize ne anlatmaya çalışır?"), sonra TEK konuya daralt.
  İstatistik-hook veya sahne-betimlemesiyle AÇMA — ikisi de denenip
  "yapay" bulundu.

  > **2026-09-17 düzeltmesi:** Yukarıdaki üç madde, kullanıcının
  > paylaştığı İKİ gerçek Portal video transkriptinden (biri incel/red-
  > pill/seri katil konulu, biri Black Swan/gölge konulu) sonra
  > değiştirildi. Önceki hâlleri (özet/expozisyon yasağı, retorik soru
  > yasağı) golden örnekten (`skyler-white-hakliydi.md`, bir AI
  > yeniden-yazımı) çıkarılmıştı ve gerçek kaynakla ÇELİŞİYORDU — gerçek
  > transkriptler hem tam olay örgüsü anlatıyor (örn. Kuğu Gölü baresini
  > baştan anlatan pasaj) hem sürekli soru-cevapla ilerliyor. Gerçek
  > kaynak AI yazımından daha yetkilidir, bu üç madde ona göre düzeltildi.

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

- **Antitez kalıbı — "X değil, Y" YASAK, istisnasız.** (TR: `…değil, …`
  / `…yerine…` / `…den çok…`; EN: `not X but Y` / `X rather than Y`).
  İddia/gözlem karşıtlık üzerinden değil doğrudan kurulur: ❌ "Bu bir
  aşk hikâyesi değil" ✅ "Bu, köşeye sıkışmış birinin son hamlesi."
  > **2026-09-17 kararı:** Üç bağımsız üçüncü parti araç
  > (`claude-voice-editor`, `riff`, `ECC/brand-voice`) birbirinden
  > habersiz bu kalıbı generic AI işareti sayıp kendi hard-ban
  > listesine koydu. Kullanıcı bunu yeterli kanıt sayıp kalıbı kalıcı
  > olarak yasakladı — golden örneklerdeki (skyler, ozymandias,
  > alicent) mevcut kullanımları ARTIK ÖRNEK SAYILMAZ, yeni metin
  > yazılırken taklit edilmez. Bu, dosya başındaki "kural ile örnek
  > çelişirse örnek kazanır" ilkesinin BİLİNÇLİ istisnasıdır.
- **Üçlü ritim.** Yeri geldiğinde: *"nal sesleri, gıcırdayan deri ve
  uzun hiçlik aralıkları"* gibi üç öğeli sıralama güçlü bir araçtır ama
  zorunlu değildir.
- **Vurucu kapanış cümlesi** paragrafın doğal sonucuysa iyidir, ama HER
  paragrafta zorunlu değildir — doğal akışı bozacaksa atlanır.
- **Zaman kipi ESNEK, tek kipte katılaşmaz.** Sahne/olay anlatımı geniş/
  şimdiki zamanda kalabilir ama art arda 2'den fazla cümle aynı "-yor"
  ekiyle bitmez — bu haber-spikeri/vaka-raporu ritmi yaratır ve FAIL
  sayılır. Cümle yapısı bilinçli çeşitlendirilir: yorum/çıkarım cümleleri,
  bağımlı cümlecikler (çünkü/-dığı için/rağmen), farklı uzunluklar
  birbirine karışır. "Hikâye anlatma" hissi (X oluyor, Y oluyor, Z
  oluyor zinciri) portal sesinin tam tersidir — ses bir ARGÜMAN
  yürütüyor, olay kronolojisi aktarmıyor.
- **Şahıs:** "siz" hitabı SERBEST — emir kipiyle izleyiciyi doğrudan
  sahneye çağırmak meşru bir araçtır: *"İyi bir insanı düşünelim"*,
  *"Şimdi bir FBI dedektifi olduğunuzu hayal edin"*, *"dikkat
  ederseniz"* (gerçek Portal transkriptlerinden, 2026-09-17). "Biz"
  temel olarak izleyici deneyimini anlatırken kullanılır, ama yapısal
  geçiş cümlesinde de serbesttir — *"biz ikincisinden başlayalım"*
  (ozymandias-kumlarin-arasinda-bir-kral.md). Birinci tekil şahıs
  ("ben şahsen...") net bir yorumsal duruş bildirirken kullanılabilir —
  gerçek transkriptte görülen bir kalıp, zorlama değil.
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
- **Em dash (—) YASAK, istisnasız.** 2026-09-17'de kullanıcı bu kararı
  kesin olarak verdi (bir önceki "paragraf başına en fazla 1" istisnası
  KALDIRILDI). Cümle iki ayrı cümleye bölünür, virgülle bağlanır ya da
  iki nokta üst üste kullanılır. Em dash hiçbir koşulda kullanılmaz.
- **Parantez tek bir dar istisnayla yasak.** Genel yan bilgi parantez
  içine sıkıştırılmaz. Tek istisna: bölüm/kaynak adını gövde cümlesi
  içinde belirtmek, örnek: "olayın geçtiği bölüme ('I.F.T.') yakından
  bakıldığında..." (skyler-white-hakliydi.md). Bunun dışındaki her yan
  bilgi ya kendi cümlesine çıkarılır ya da tamamen elenir.

  > **2026-09-17 düzeltmesi:** Bu üç madde ("biz" istisnası dahil) ve bir
  > önceki madde, `claude-voice-editor`/`claude-voice-analyzer`
  > plugin'leriyle yapılan bir test sırasında golden örneklerin (skyler,
  > ozymandias, alicent) kendi yazılı kurallarını ihlal ettiği fark
  > edilince fiili pratiğe uydurulacak şekilde güncellendi — kural
  > örnekle çelişiyorsa (bkz. dosya başı not) örnek kazanır.
- **Ardışık eylem betimlemesi (haber spikeri tonu) YASAK.** "Karakter X
  yapıyor, Y yapıyor, Z yapıyor" biçiminde olay listeleme FAIL — her
  eylem mutlaka bir çıkarım/yorumla birlikte taşınır, salt aktarılmaz.
  ✅ *"Görevi sessizce yerine getirip geri çekilmesi, kırılmışlıktan çok
  erken öğrenilmiş bir hayatta kalma refleksini gösteriyor."*
  ❌ *"Ağlamıyor, kaçmıyor, görevi yerine getiriyor, geri çekiliyor."*
- **Şablonlaşmış geçiş kalıbı tekrarı YASAK.** "Ama aslında
  gördüğümüz...", "Burada ilginç olan..." gibi bir geçiş cümlesi bir
  metinde en fazla 1 kez kullanılır; ikinci kullanım mekanik/şablon
  hissi verir ve metnin geri kalanı FARKLI bağlaçlarla ilerler.
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
- [ ] Bölüm/eser ötesi spoiler yok
- [ ] BTS trivia'sı sadece tematik paralellik kuruyorsa var

**Ses**
- [ ] Açılış: adlandır-reddet YA DA alıntı-sorgu kalıbı (§2)
- [ ] Antitez kalıbı ("X değil, Y") hiç geçmiyor (§4)
- [ ] Pull-quote sayısı 0-2, zorlama değil (§5)
- [ ] Şimdiki zaman; "siz" hitabı/retorik soru varsa zorlama değil, doğal
- [ ] Yasak sıfat/klişe listesinden hiçbiri geçmiyor (§6)
- [ ] Ünlem/emoji yok

**İki dil**
- [ ] TR onaylandı, sonra EN (BrE) eklendi — çeviri değil yeniden yazım
- [ ] (EpisodeStory ise) TR/EN aynı sahne `id`, `col`, `row`, blok
      sayısına sahip; TR karakter sayısı EN'in ±%15'i içinde
- [ ] Türkçe terim politikası (§1) tutarlı uygulandı
