---
name: learned-rules
description: >-
  Kullanıcının kayıtlı tasarım düzeltmeleri — HER UI işinden (component,
  sayfa, animasyon, stil ayarı) önce oku; buradaki kurallar
  design-philosophy dahil HER ŞEYİ ezer.
  Kullanıcı bir tasarım/kod kararını düzelttiğinde de kullan: düzeltmeyi
  tek satırlık kurala damıtıp bu dosyanın Kurallar bölümüne ekle.
---

# Learned Rules — Kullanıcının Kayıtlı Tasarım Tercihleri

Bu dosya kullanıcının verdiği her tasarım düzeltmesinin tek satırlık
kalıcı kurala damıtılmış hâlidir. Öncelik zincirinin EN ÜSTÜDÜR: çelişki
varsa bu dosya kazanır — çünkü bunlar kullanıcının gerçekte söyledikleri,
tahmin değil. İhlal = denetimde otomatik FAIL.

## Kayıt protokolü

1. Kullanıcı bir tasarım kararını düzelttiğinde ("bunu beğenmedim, şöyle
   olsun"), düzeltmeyi uyguladıktan HEMEN sonra buraya tek satır kural
   ekle. Kullanıcıya sorma — ekle ve eklediğini tek cümleyle bildir.
2. Format: `- **[kategori]** kural metni _(YYYY-AA, kaynak component)_`
3. Kurallar spesifik ve eyleme dönük olmalı ("başlıklar asla gradient
   olmasın" ✅), muğlak olmamalı ("daha güzel olsun" ❌).
4. Yeni bir düzeltme eski bir kuralla çelişirse eski kuralı güncelle
   veya sil — dosya kısa, güncel ve çelişkisiz kalmalı.
5. Kullanıcının ONAYLADIĞI ilk denemeler de sinyaldir: bir yaklaşım ilk
   seferde beğenildiyse ve genellenebilirse, o da kural olabilir.

## Kurallar

Başlangıç seti iki kaynaktan geldi: kullanıcının önceki projesinden
(Apple-clone) aktarılan marka-bağımsız kurallar ve 2026-07 tercih
anketi (kullanıcıya sorulan yapılandırılmış sorularla alınan kararlar).

### Asset & Görsel Kaynak

- **[asset]** Kullanıcının verdiği/eklediği görseller mutlaka teslimatta
  kullanılmalı; eksik varyantlar için resmi kaynak görselleri bulunmalı,
  placeholder üretilmemeli. _(2026-07, önceki projeden aktarım)_
- **[asset]** Referans siteden klonlarken siteye ait kredi/tanıtım
  parçaları (yapımcı portresi, "other projects", banner) asla dahil
  edilmez — sadece hedef deneyim klonlanır. _(2026-07, aktarım)_
- **[asset]** Referansın metin envanteri screenshot örneklemesinden
  değil DOM'dan (HTML text extraction) çıkarılır — scroll sahnelerinde
  akıp giden overlay/anlatım metinleri screenshot'ta kaçar; tüm metin
  katmanları eksiksiz alınmalı. _(2026-07, aktarım)_

### Motion

- **[motion]** Referansta scroll'a bağlı animasyon olan bölümler
  teslimatta statik görselle geçiştirilemez; gerçek scrub uygulanır.
  Statik kare yalnızca iskelet onay aşamasında kabul edilir.
  _(2026-07, aktarım)_
- **[motion]** ATMOSFER scroll-scrub sahnelerinde ana görsel ekranı
  dolduracak kadar büyük olmalı (~90-100vw, küçük ortalanmış kutu değil)
  ve scrub boyunca yumuşak bir scale büyümesi eşlik etmeli. Editöryel
  analiz sahnelerinde geçersiz — orada görsel kolon genişliğindedir ve
  scrub boyunca hafifçe KÜÇÜLÜR (~%6), büyümez. _(2026-07, aktarım;
  2026-07 EpisodeStory kararıyla kapsamlandırıldı)_
- **[motion]** Pinned giriş sekanslarındaki ardışık başlık geçişleri
  dört noktalı enter→hold→exit trapezi alır, trapezler arasında ~0.04
  progress boşluğu bırakılır, opacity + hafif y birlikte yumuşatılır;
  pinned bölüm ~100vh/faz boyutlanır — ne sıkışık ne "animasyon çok geç
  geliyor" dedirtecek kadar uzun. _(2026-07, aktarım)_
- **[motion]** Her sayfanın hero'su ilk açılışta giriş animasyonu alır
  (başlık yükselerek belirir, alt eleman kademeli takip eder) — sayfa
  asla "aniden var olmaz". _(2026-07, aktarım)_
- **[motion]** Ardışık scrub/video sahneleri arasındaki geçiş tam ekran
  başlık fazıyla BÖLÜNMEZ — metin animasyonun yanında akar, ana görsel
  kesintisiz kalır. _(2026-07, aktarım)_
- **[motion]** İç içe geçen animasyonlar (birinin finali diğerinin
  başlangıcı olan) ayrı pinned bölümler olarak alt alta konmaz — TEK
  pinned sahnede katmanlar crossfade ile devir teslim yapar; bölüm
  metinleri ilgili katman oynarken belirir. _(2026-07, aktarım)_
- **[motion]** Scrub animasyonu pin bitmeden (~progress 0.85-0.9'da)
  son karesine ulaşmalı; kalan pin son karede "hold" yapar — 0.98'e
  uzatmak animasyonu yarım kalmış hissettirir. _(2026-07, aktarım)_
- **[motion]** Tempo sinematik yavaştır: sahne/reveal animasyonları
  uzun süre (~0.8-1.2s) ve yumuşak ease alır — snappy "uygulama hissi"
  bu markanın dili değil. _(2026-07, tercih anketi)_
- **[motion]** Her section scroll ile görünüme girerken reveal alır
  (fade + hafif y, başlık→içerik kademeli) — giriş animasyonu sadece
  hero'ya özgü değildir. _(2026-07, tercih anketi)_
- **[motion]** Görseller yüklendiğinde fade-in ile belirir, öncesinde
  koyu zemin durur — skeleton/shimmer veya blur-up kullanılmaz.
  _(2026-07, tercih anketi)_
- **[motion]** Çekirdek fikri hareket olan bölümlerde (parallax sahne,
  scroll-scrub, path-follow) "yön doğru mu?" onayına MOTION DAHİL sunulur —
  salt statik iskelet bu bölümlerde değerlendirilemez; statik-önce kuralı
  yalnız layout'u fikir olan bölümler içindir. _(2026-07, GoT Intro)_
- **[motion]** Path-follow rotaları köşeli/simetrik zigzag değil, yumuşak
  oval-dairesel eğrilerle akar (MotionPath curviness); rotaya ara sıra
  hafif yüksel-alçal salınımı eklenir. _(2026-07, GoT Intro)_
- **[motion]** Smooth-scroll kütüphanesi (Lenis vb.) KULLANILMAZ — iki
  kez denendi, iki kez reddedildi. Scroll native kalır, kontrol
  kullanıcıdadır; izinli tek otomatik hareket storytelling bantlarında
  scroll DURUNCA devreye giren yönlü GSAP snap'tir: aşağıda sıradaki,
  yukarıda önceki bandın merkezine akılır, bantlar ARASINDA durulmaz
  (CSS proximity yön bilmediği için yetersiz bulundu). _(2026-07, GoT
  sayfası)_
- **[motion]** Storytelling intro'su PINNED TIMELINE'dır (kullanıcı
  kararı, referans videoya sadık — akış-bantları + boşluk mimarisi
  denendi ve videoya benzemediği için değişti): section 100svh pin'lenir,
  scroll timeline'ı sarar; sahneler AYNI karede crossfade ile devir
  teslim yapar (sayfa fiziksel inmez), metinler trapez alır (scrub →
  çift yönlü, hold'da TAM OPAK), snap scroll durunca sahnenin hold
  merkezine yöne duyarlı kilitlenir. Faz başına ~100vh scroll.
  _(2026-07, GoT Intro)_
- **[motion]** Pinned kamera sahnesinde (haritada durak durak ilerleyen
  görünüm gibi) bilgi kartları sahnenin ALTINDA ayrı bir liste OLARAK
  akmaz — haritanın/görselin YANINDA sabit tek bir panel konumunda
  durur, kamera durağa vardıkça o panelin içeriği crossfade (fade
  in/out) eder. Aşağı-liste düzeni bu bağlamda reddedildi.
  _(2026-08, GoT WorldMap — kullanıcı düzeltmesi)_
- **[renk]** Storytelling sis/erime zemini SİYAHLA karışıktır: yapım
  temasının sıcak bg tonu sise işlemez (kahve tonu reddedildi) — zemin
  `color-mix(bg %30, black)`, görselin kendi tonu yalnız düşük opak
  ambient tint olarak eklenir. _(2026-07, GoT Intro)_
- **[renk]** GoT sayfasında `theme.bg`/`theme.cardBg` (GameOfThrones.data.js)
  sitenin standart siyahı kalır (`#050505` / `#101012`) — yapımın sıcak
  karakter rengi (`#e8974a`) SADECE `--accent`'e işler, zemine YAYILMAZ.
  Önceki "TAM TEMA" genellemesi bg'yi de ısıtmıştı, kullanıcı bunu
  "çirkin kahverengi" diye reddetti — zemin rengi production teması
  genellemesinin İSTİSNASI, tekrar kahveye çekilmez. _(2026-07, GoT sayfa
  zemini)_
- **[motion]** Storytelling sahnesinde kamera hareketi ZOOM'dur
  (video-sadık): görsel sahne ömrü boyunca scale 1.0 → 1.5 büyür
  ("sahneye girme" hissi); sis maskesi/pencere SABİT durur, zoom onun
  altında olur — maskeyle birlikte hareket eden görselde efekt okunmaz.
  Salt dikey translate parallax'ı bu bağlamda yetersiz bulundu.
  _(2026-07, GoT Intro)_
- **[motion]** Bölüm sayfası girişi MERKEZDEN AÇILAN KARE'dir: perde ANLIK
  siyah olur (ayrı fade-in beat'i "siyah ekranda bekleme" hissi yarattı ve
  reddedildi), ardından still görsel ekran merkezinden `scale 0 → 1`,
  `0.65s`, `power3.inOut` ile açılır. Tıklanan öğeden büyüyen FLIP DEĞİL —
  her girişte (link, doğrudan URL, yenileme) AYNI animasyon oynar.
  `power3.inOut` kendi tersiyle simetrik olduğu için kapanış gerekirse aynı
  eğri ters yönde kullanılır. _(2026-07, GoT EpisodePage)_
- **[motion]** Sinematik sayfa girişinde navbar geri çekilir (~0.7s) ve
  yalnız kullanıcı yukarı scroll edince geri gelir. Navbar `position:
  sticky` olduğu için transform ile gizlense bile layout alanını bırakır —
  hero arka planı o boşluğu da kaplayacak şekilde yukarı taşar ve hero'da
  `overflow:hidden` KULLANILMAZ (kırparsa siyah şerit açığa çıkar).
  _(2026-07, GoT EpisodePage)_
- **[motion]** Sayfa İÇİ route param değişiminde (bölüm/sezon seçme)
  App-seviyesi tam sayfa fade'i ÇALIŞTIRILMAZ ve scroll başa sarılmaz —
  sayfa yerinde durduğu için yanıp sönme olarak okunur. Değişen görsel
  ÖNCE decode edilir, hazır olunca görsel + başlık BİRLİKTE crossfade eder
  (~0.55s); eski kare son ana kadar durur, arada siyah boşluk oluşmaz.
  _(2026-07, GoT EpisodePage)_
- **[motion]** Hero'dan sonraki bölüme geçiş SİS ERİMESİDİR (Intro'daki
  maskenin dikey karşılığı): hero medyası sert kenarla bitmez, alt kenarı
  çok duraklı uzun rampalı `mask-image: linear-gradient(to bottom, #000 0%,
  #000 62%, rgba(0,0,0,.78) 76%, rgba(0,0,0,.38) 88%, transparent 100%)`
  ile zemine erir. Maske YALNIZ medya katmanına uygulanır — metin kardeş
  katmanda kalıp net görünür. Giriş animasyonunun klonu da AYNI maskeyi
  taşımalı, yoksa klon kalkarken alt kenar sıçrar. _(2026-07, EpisodePage —
  kullanıcı isteği, "mükemmel oldu")_
- **[motion]** Bölüm sayfasının hero'su scroll'da TAM EKRAN COVER CARD →
  İNCE FIXED HEADER'a dönüşür (uyarlama: scroll-driven-animations.style
  "Full-Height Cover Card to Fixed Header", Apache-2.0). Teknik CSS
  scroll-driven'dır (GSAP DEĞİL): `position: fixed` (sticky değil — yükseklik
  animasyonu document boyunu kısaltıp scroll mesafesini bozar),
  `animation-timeline: scroll(root)` (isimsiz `scroll()` değil; `body`'deki
  `overflow-x:hidden` yanlış scroller'a bağlanmaya yol açar),
  `animation-range: 0 90vh`, akıştan çıkan hero'nun yerini bir spacer tutar.
  Tüm efekt `@supports (animation-range: …)` içindedir — destek yoksa hero
  statik tam ekran kalır, bu yeterli fallback'tir. Önceki "hero metinleri
  scrub'la söner" kuralının YERİNE geçer. _(2026-07, EpisodePage)_
- **[motion]** Dönüşümde başlık FADE ETMEZ, punto küçülerek header'a taşınır
  ve ŞEKİL DEĞİŞTİRMEZ: `max-width` `ch` biriminde sabit tutulur, böylece
  sınır fontla birlikte oransal daralır ve satır kırılımı aynı kalır (iki
  satırsa iki satır kalarak küçülür). _(2026-07, EpisodePage — kullanıcı
  düzeltmesi: "olduğu gibi küçülsün")_
- **[motion]** Görsel yalnız kırpılarak küçülmez, KENDİSİ de küçülür:
  `object-position` pan'ının üstüne `scale 1.25 → 1` zoom-out binder — kart
  geri çekilerek header'a oturur. Demodaki salt `background-position` kayması
  "sadece yazı küçülüyor" diye reddedildi. _(2026-07, EpisodePage)_
- **[layout]** Bölüm şeridi cover'da ESKİ hâlinde kalır (`‹ 01 02 … ›`);
  dönüşümde ORTADAKİ pill listesi söner, `‹ ›` okları ise `translateX` ile
  sağa/sola kayıp kartın kenarlarındaki son konumlarını alır. Ayrı bir kenar
  butonu çifti EKLENMEZ (denendi, "saçma sapan kenarlar" diye reddedildi) —
  kenardaki oklar şeridin kendi oklarıdır. _(2026-07, EpisodePage — kullanıcı
  düzeltmesi)_
- **[layout]** Header şeridi olabildiğince İNCEDİR: alt/üst padding minimuma
  iner (`--space-2xs`), başlık gerekiyorsa `--text-sm`'e kadar küçülür —
  "başlığı sığdırmak yeterli". Navbar için üstte pay BIRAKILMAZ; bar yalnız
  içeriği kadar yüksektir (~56px). Navbar aşağı scroll'da zaten geri çekili,
  yukarı scroll'da geri gelirken dönüşüm ters sarıp kartı büyüttüğü için iki
  katman pratikte çakışmaz. _(2026-07, EpisodePage — kullanıcı düzeltmesi:
  "üstteki boşluk tamamen kalksın")_
- **[layout]** Şeridin okları header'da KÜÇÜLMEZ, BÜYÜR (44 → 48px,
  `--text-h2`) ve `translateY` ile başlığın dikey hizasına çekilir; yatayda
  kartın en ucuna değil viewport merkezinden ~28vw uzağa oturur — en kenar
  "dağınık" bulundu. Bar boyunu başlık değil bu ok kutusu belirler.
  _(2026-07, EpisodePage — kullanıcı düzeltmesi)_
- **[motion]** Hero altındaki blok TEK SEFERLİK fade+rise reveal alır
  (`once: true`, `start:'top 80%'`, `0.9s power3.out`, `stagger 0.12`).
  Önceki scrub'lı "gel-git" timeline'ı KALDIRILDI: hero dönüşümü aynı scroll
  aralığını kullandığı için iki scroll-bağlı katman çakışıp blok sönüp geri
  geliyordu. Dönüşüm boyunca sahnede tek scroll-bağlı hareket kalmalı.
  _(2026-07, EpisodeBrief — hero dönüşümüyle birlikte güncellendi; önceki
  "dalga kalkmasın aşağı yukarı eklensin" kuralının yerine geçer)_
- **[yüzey]** Puan AYRI yıldızlı değer olarak IMDb rozetinin ÖNÜNDE durur
  (değer + ★ + ayrı "IMDB" rozeti) — önceki "puan rozetin içinde/gömülü"
  kararının YERİNE geçti (kullanıcı düzeltmesi, wireframe ile netleştirildi).
  IMDb rozeti artık salt statik marka etiketi: pill radius YOK (`--radius-sm`,
  keskin de değil), dolgu dar — gerçek IMDb logosu gibi sarı metnin etrafında
  neredeyse görünmeyecek kadar az. Üçüncü taraf marka rozetleri (IMDb, HBO
  Max) genre pill grubundan görünür boşlukla ayrılır ve satırın sağ ucuna
  yaslanır (`justify-content: space-between` ile iki alt-grup). Platform
  rozetleri (HBO Max vb.) kullanıcının kendi verdiği gerçek ikon/logo asset'i
  ile kurulur — IMDb metin rozetinin aksine KODLA yeniden çizilmez, çerçeve/
  dolgu eklenmez (asset'in kendi zemini/kenar yuvarlaması yeterli).
  _(2026-08, EpisodeBrief — kullanıcı düzeltmesi)_
- **[layout]** Hero altındaki künye bloğu ORTALANMAZ: `max-width` +
  `margin:auto` yerine sayfa yatay padding'inden başlar (sola dayalı);
  görsel kolonu `clamp(240px, 30%, 460px)` — geniş ekranda devleşmesin
  diye üst sınırlı. _(2026-07, EpisodeBrief — kullanıcı düzeltmesi)_
- **[motion]** Tarayıcının geri tuşu animasyon için ENGELLENMEZ. Teknik
  olarak mümkün (popstate nöbetçi kaydı) ama geri tuşu "anında" beklenir;
  jest/çift basma kenar durumları ve history kirlenmesi maliyeti kazancı
  aşıyor. Kapanış animasyonu istenirse sayfa içi açık bir kapat/geri
  kontrolüne bağlanır. _(2026-07, GoT EpisodePage — kullanıcı kararı)_

### Yapı

- **[yapı]** Referans sitelerden sayfa/bölüm klonlarken navbar
  klonlanmaz — projenin mevcut global `Navbar`'ı tüm sayfalarda tek
  gezinmedir; sayfaya özel ikinci bir nav eklenmez. _(2026-07, aktarım)_
- **[yapı]** Kullanıcı "X sayfasındaki Y bileşeninin aynısını"
  dediğinde, o mevcut paylaşılan bileşen birebir yeniden kullanılır —
  yeni bir varyant/alternatif tasarım uydurulmaz; referans verilen
  bileşeni önce oku, aynı prop deseniyle besle. _(2026-07, aktarım)_

### Layout

- **[layout]** Boşluk karakteri ferah/premium: bol negatif alan, büyük
  section aralıkları — sıkışık Netflix-vari içerik grid'i varsayılan
  değildir. _(2026-07, tercih anketi)_
- **[layout]** Responsive eşit önceliklidir: her component baştan hem
  masaüstü hem mobil kırılımda tam deneyim verecek şekilde tasarlanır —
  mobil "sonra bakarız" uyarlaması değildir. _(2026-07, tercih anketi)_
- **[layout]** Mobil gezinme deseni (≤900px): hamburger → koyu TAM EKRAN
  overlay menü — linkler büyük tipografiyle kademeli girer, arama tam
  genişlik input olarak overlay'e taşınır, Community alt linkleri açık
  liste olur (mobilde dropdown yok). _(2026-07, Navbar responsive kararı)_
- **[layout]** Kart görsel oranı bağlama göredir: katalog/keşfet
  satırları dikey poster (2:3), öne çıkan/hero satırları yatay still
  (16:9). _(2026-07, tercih anketi)_
- **[layout]** Hero görsel işleme (full-bleed vs çerçeveli), section
  başlık hizası ve hero'da video kullanımı KULLANICI KARARIDIR — iş
  başında sorulur, varsayılan uydurulmaz; kullanıcının genel eğilimi
  full-bleed + koyu gradient overlay yönündedir. _(2026-07, tercih anketi)_

### Tipografi

- **[tipografi]** Başlık deseni: üstte küçük UPPERCASE kicker etiketi,
  altında büyük normal-case bold başlık — tam-uppercase afiş başlığı
  kullanılmaz. _(2026-07, tercih anketi)_
- **[tipografi]** Hero'nun imza başlığı: yapımın RESMİ LOGO görseli varsa
  o kullanılır (`<img>`, drop-shadow ile marka glow'u), yoksa dizi display
  fontu + glow'lu dev başlık. Her iki hâlde sayfada TEK KEZ — sonraki
  bölümler hero'yu tekrarlamaz, kendi kurgusunu (premise/künye) kurar.
  Logo görselinde harf-harf stagger geçersiz → clip/scale + fade reveal.
  _(2026-07, GoT Hero; logo webp kullanıcı kararı)_
- **[tipografi]** Behance sinematik referans iskeletleri serif (Constantia
  vb.) kullansa da Fandoom marka fontu Montserrat KALIR — iskelet/topografi
  ödünç alınır, tipografi serife çevrilmez. _(2026-07, Behance referans analizi)_
- **[metin]** Site İKİ DİLLİDİR (TR + EN) — ikisi de yayın kalitesinde,
  biri diğerinin gölgesi değil. Önceki "arayüz metinleri İngilizcedir"
  kuralının YERİNE geçer. İngilizce imla BrE'ye sabittir (`honour`,
  `recognise`, `licence`) — tek metinde AmE/BrE karışımı hatadır.
  Uzun editöryel metin ÖNCE Türkçe yazılır (kullanıcının kalite denetimi
  Türkçe üzerinden yapılabiliyor), onaydan sonra İngilizce YENİDEN YAZILIR —
  birebir çeviri değil. İki dil aynı grid'e oturduğu için sahne `id`/`col`/
  `row`/blok sayısı birebir aynı kalır, TR uzunluğu EN'in ±%15'ini aşamaz.
  _(2026-07, dil kararı; detaylı yazım kuralları: `editorial-voice` skill'i)_
- **[metin]** i18n şeması BAŞTAN locale-aware kurulur (CMS'te `locale`
  alanı + `?locale=` param): backend henüz yazılmadığı için şimdi bedava,
  sonradan eklemek migration maliyeti. UI sözlüğü için yeni paket
  (react-i18next vb.) EKLENMEZ — arayüz metni az olduğu için Context +
  JSON sözlük yeterlidir. _(2026-07, dil kararı — altyapı HENÜZ
  uygulanmadı)_
- **[metin]** Copy tonu kısa + vurucudur: 2-4 kelimelik başlıklar,
  minimal açıklama — uzun anlatımlı pazarlama metni yazılmaz.
  _(2026-07, tercih anketi)_
- **[metin]** Kısa-copy kuralı UI chrome'una aittir; STORYTELLING
  bölümlerinde (intro/lore anlatısı) gövde metni gerçek hikâye anlatır —
  4-6 cümlelik dolu paragraf, 1-2 cümlelik özet geçiştirme FAIL.
  _(2026-07, GoT Intro)_

### İmza Animasyonlar (marka karakteristiği — kullanıcı onaylı, yeniden kullan)

Bu üç desen Fandoom'un hareket dilidir; yeni component/sayfa animasyonu
gerekince ÖNCE bunlardan biri uygulanır, yenisi icat edilmez. Değerler
birebir korunur ki site tek dille konuşsun.

- **[imza-dalga]** Bölüm girişi "dalga"sı: elemanlar sağdan sola akar —
  `from { opacity: 0, x: 140, y: 56 }`, `duration: 0.9`,
  `ease: 'power3.out'`, çoklu elemanda `stagger: 0.12`; başlık tek blok
  önden (~0.15s offset) girer. _(2026-07, FeaturedCarousel)_
- **[imza-şerit]** Route geçişi "cinematic şerit reveal": mevcut sayfa
  `opacity 0.25 / 0.3s power1.out` kararır → hedef hero
  `clip-path inset(0 49.75%)` → `inset(0 0)` `0.55s power3.in` ile
  merkezden açılır → görsel `scale 2.3 → 1` `0.95s power2.out`
  counter-zoom → başlık harf harf (`stagger 0.09, duration 0.3`) →
  sinopsis fade+rise. Kaynak: `src/motion/cinematic.js` bayrağı.
  _(2026-07, FeaturedCarousel→GoT)_
- **[imza-uzama]** Poster/kart hover'ı: kutu sabit, içteki medya katmanı
  `inset: 0 → -7% 0` ile üstten+alttan uzar,
  `0.35s cubic-bezier(0.33, 1, 0.68, 1)`; grayscale'den renke
  `filter 0.35s ease` eşlik eder. _(2026-07, FeaturedCarousel)_

### FeaturedCarousel / Poster Dizisi

- **[layout]** FeaturedCarousel'de dev arka plan tipografisi kullanılmaz —
  bölüm başlığı ("Featured Titles") kartların ÜSTÜNDE büyük, sola hizalı
  ve İNCE ağırlıklıdır (font-weight 300, kullanıcı düzeltmesi); kartlarla
  aynı dalgayla TEK BLOK olarak sağdan sola girer — section başlığında
  harf/kelime stagger KULLANILMAZ (harf stagger yalnız cinematic hero
  başlığına aittir). _(2026-07, FeaturedCarousel)_
- **[etkileşim]** Home girişi kapılıdır: serbest scroll yok — Explore/clear
  butonu VEYA ilk scroll niyeti (tekerlek/swipe/klavye) kapıyı açar,
  sayfa Featured Titles'a kayar ve giriş dalgası o anda başlar.
  _(2026-07, Home/Hero)_
- **[yüzey]** Featured poster kartları düz dikey dilimdir: radius, çerçeve,
  gradient dolgu ve metin overlay YOK — grayscale bekler, hover'da
  renklenir ve dikeyde uzar; oran referansın 1:3.3'ünden dolgun (~1:2.7).
  _(2026-07, FeaturedCarousel)_
- **[motion]** Carousel → seri sayfası geçişi "cinematic şerit reveal"dir:
  sayfa ~0.3s kararır, hedef hero merkezden dikey şeritle tüm ekrana
  açılır (görsel counter-zoom ile oturur), başlık harf harf yazılır,
  sinopsis fade+rise ile takip eder. _(2026-07, FeaturedCarousel→GoT)_

### Renk

- **[renk]** brand-gradient başlıklarda yalnızca kilit noktalarda
  kullanılır (hero başlığı, tekil vurgu kelimesi) — her section
  başlığına yayılmaz, nadirliği değerini korur. _(2026-07, tercih anketi)_
- **[renk]** Sinematik referanslar tamamen grayscale (accent renk yok, renk
  yalnız fotoğraftan) olsa da Fandoom bunu birebir almaz: brand-gradient İNCE
  ACCENT olarak kullanılır (CTA, hover, aktif state, ince çizgi/border) —
  geniş yüzeye yayılmaz. _(2026-07, Behance referans analizi)_
- **[renk]** Yapım sayfaları TAM TEMA kurar: yapımın karakter rengi
  `--accent`'e ve vurgu/buton tonlarına işler; global brand-gradient
  site chrome'unda (Navbar/Footer) kalır. İSTİSNA: `--bg`/`--card-bg`
  zemin rengi sitenin standart siyahında kalır — yapımın sıcak/renkli
  tonu zemine YAYILMAZ (GoT'ta `#120e08` kahvesi "çirkin kahverengi"
  diye reddedildi, bkz. GoT sayfa zemini kuralı). _(2026-07, tercih
  anketi; 2026-07 GoT zemin düzeltmesiyle güncellendi)_

### Yüzey & Etkileşim

- **[yüzey]** Kart/yüzey karakteri yumuşak + parlaktır: belirgin
  radius, hafif glow/gölge — keskin köşeli editoryal stil değil.
  _(2026-07, tercih anketi)_
- **[yüzey]** ATMOSFER/INTRO bantlarında görsel kart çerçevesine
  HAPSEDİLMEZ: bandın TAMAMINA yayılır (full-bleed atmosfer zemini) ve
  yazı görselin ÖNÜNDE durur. Erime görselin öznesine merkezli ÇOK
  YUMUŞAK asimetrik radial sönmedir: rampa uzun ve çok duraklı —
  algılanabilir geometrik sınır (keskin oval dahil) YASAK, sis gibi
  organik erime; yazı tarafına doğru erken söner, metne koyu alan açar.
  Simetrik üst/alt kenar bandı ve dikdörtgen kenar rampası YASAK.
  Görseli silen ağır soldurma/yıkama İSTENMEZ. Kart çerçevesi
  katalog/grid bağlamına aittir. _(2026-07, GoT Intro; referans:
  intro-beat-oval.png — piksel-dissolve, dört-kenar lineer maske,
  simetrik fog bandı, KESKİN kenarlı oval, ağır soldurma ve dar
  yan-görsel yerleşimi denendi, hepsi reddedildi)_
- **[layout]** EDİTÖRYEL ANALİZ bölümleri (bölüm sayfasının derin-analiz
  scrollytelling'i) yukarıdaki full-bleed atmosfer kuralının DIŞINDADIR:
  görsel bir yanda sticky durur, metin öbür yandan akar, sahneler arası
  sol↔sağ dönüşümlüdür. Gerekçe: burada amaç atmosfer değil OKUMA — uzun
  editöryel metin görselin önünde durduğunda okunmuyor. Full-bleed +
  önde-yazı deseni intro/atmosfer bantlarına aittir. _(2026-07,
  EpisodeStory — kullanıcı kararı, referans: gezondheidsgids.maglr.com
  breindossier)_
- **[layout]** Editöryel analiz grid'inde görsel hücresi yanındaki metin
  satırının yüksekliğine UZAR (`align-self: stretch` + figure `height: 100%`);
  `aspect-ratio` yalnız taban değerdir, `object-fit: cover` kadrajı korur.
  Uzun metin kolonunun yanında görselin kendi oranında küçük kalıp altında
  boşluk bırakması reddedildi ("görseller küçük kalmış, boşlukları kapat").
  Görsel birden çok metin satırını KAPSAMAZ — tek satırla (lead bloğuyla)
  hizalanır, kalan bloklar iki dengeli kolona bölünür; çok satır kapsayan
  uzayan görsel 16:9 kareyi portre sliverına kırpıyor. Sabitlenen (sticky)
  kolon satıra bağlı olmadığı için orada görsel bir sütun genişletilip daha
  dolgun orana (3/2) çekilir. _(2026-07, EpisodeStory — kullanıcı düzeltmesi)_
- **[layout]** GENEL: çok kolonlu editöryel grid'de hiçbir satır tek taraflı
  kalmaz — bir kolon bitip yanında büyük boş dikdörtgen açılıyorsa paragraflar
  kolonlar arasında YENİDEN DAĞITILIR (okuma sırası sol→sağ korunarak cümle/
  paragraf taşınır), kolon yükseklikleri kabaca eşitlenir. `lead` bloğu daha
  büyük punto olduğu için aynı karakter sayısı daha uzun sürer — ona daha AZ
  metin verilir. Boşluğu kapatmanın yolu metni yerinde bırakıp kutu eklemek
  değil, metni taşımaktır. İstisna: sadece başlık satırı ve kapanış alıntısı
  satırı tek taraflı kalabilir (ince, kasıtlı nefes). _(2026-07, EpisodeStory —
  kullanıcı düzeltmesi, kırmızı-kutu screenshot'ı)_
- **[layout]** Storytelling waypoint kompozisyonu (kullanıcı referansı,
  intro-beat-oval.png): başlık üstte, altında TEK gövde paragrafı; metin
  DÜMDÜZ dikey kolon hizasında DURMAZ — erimenin yumuşak bölgesinin
  içine taşar: başlık görsele doğru kayar, gövde karşı yönde nefes alır,
  tek düz hiza çizgisi kırılır. _(2026-07, GoT Intro; önceki "dağınık
  editoryal 2 parça" ve düz kolon denemeleri reddedildi)_
- **[etkileşim]** Kart hover'ı hafif scale + glow'dur — kart sabit
  kalıp içerik zoom'u yapılmaz. _(2026-07, tercih anketi)_
- **[etkileşim]** Birincil CTA brand-gradient dolgulu pill butondur.
  _(2026-07, tercih anketi)_
- **[etkileşim]** Dokunmatik cihazlarda (`@media (hover: none)`) hover'a
  bağlı efektler devreden çıkar: grayscale posterler baştan RENKLİ başlar,
  uzama/scale/glow hover efektleri kapalıdır — genişlik değil hover
  yeteneği ölçülür. _(2026-07, responsive kararı)_
- **[veri]** Backend'de karşılığı OLMAYAN bir UI öğesi sahte/örnek veriyle
  DOLDURULMAZ. Kullanıcı kararı: kutu doğru hizada bırakılır, kesik çerçeve
  + düşük opaklıkla "beklemede" iskelet olarak durur ve alan gelince tek
  satırda dolar (prop'la beslenen slot). `src/shared/data/` Spring Boot
  sözleşmesi olduğu için alan eklenerek çözülmez — eksik alanlar backend
  istek listesine yazılır. _(2026-07, EpisodeBrief)_
- **[layout]** Bölüm sayfasının yatay bölüm şeridi KORUNUR (grid/dikey
  listeye çevrilmez); şeridin "07 neydi?" bilgi açığı pill'e başlık ipucu
  (`title` + `aria-label`) ve hero altındaki künye bloğuyla kapatılır.
  _(2026-07, EpisodePage — kullanıcı kararı)_
- **[a11y]** Dokunma hedefi büyütmesi görsel görünümü bozmadan yapılır:
  padding vermek aktif-durum alt çizgisini metinden koparıyorsa alan
  `::after` + negatif `inset` ile genişletilir. Komşu öğelerle çakışma
  sınırdır — yatay büyütme, aradaki boşluğun yarısını AŞAMAZ (aşarsa
  yanlış öğeye tıklanır). _(2026-07, EpisodePage)_
- **[etkileşim]** Navbar zemini HER durumda sabit hafif koyudur
  (`rgba(5,5,5,0.3)`) — scroll'da koyulaşmaz, blur/border kazanmaz.
  _(2026-07, Navbar)_
- **[etkileşim]** Navbar aşağı scroll'da yukarı kayarak smooth gizlenir,
  yukarı scroll'da smooth geri gelir (yPercent, ~0.4s power2.out).
  _(2026-07, Navbar)_

### Topluluk (Community) — Bilgi Mimarisi

Aşağıdaki kurallar proje-bağımsız bir araştırma oturumunda (forum/community
platformu UX araştırması, 3+3 paralel ajan) çıkarılıp kullanıcı tarafından
onaylandı. Community özelliği HENÜZ uygulanmadı — bu kurallar, uygulama
başladığında yeniden tartışılmaması için önceden kilitlendi.

- **[topluluk-yapı]** Community sitede bağımsız üst-seviye bir alan
  (`/community`), yapım detay sayfalarının (GoT vb.) İÇİNE gömülü bir bölüm
  DEĞİL. _(2026-07, Community mimari planlama)_
- **[topluluk-yapı]** İkincil ayrım evren/franchise bazlıdır (ör. Westeros =
  Game of Thrones + House of the Dragon birleşik), tekil yapım başlığı bazlı
  değil — yeni platformda kritik-kütle/"ghost town" riskini azaltır; bir
  yapım gerçekten büyürse ayrışma ileride organik ve düşük risklidir, tersi
  (baştan ayırıp sonra birleştirmek) zor bir migrasyondur.
  _(2026-07, Fandom.com'un "Wiki of Westeros" emsali — GoT+HotD tek wiki)_
- **[topluluk-veri]** News / Blog / Discussion / Theory / Fan Art beş
  yüzeyi TEK çekirdek veri modelinde toplanır (Thread + Post + Vote +
  Category), ayrı sistemler kurulmaz — `Category.surface` alanı
  (`NEWS|BLOG|DISCUSSION|THEORY|FAN_ART`) sadece sıralama
  (`default_sort`), görsel şablon ve yazma-iznini (`write_permission`)
  değiştirir. Premium/erişim kısıtı ayrı bir silo değil, içerik seviyesinde
  çapraz-kesen bir bayraktır (`Thread.is_premium`).
  _(2026-07, Community mimari planlama — News eklendi, [[topluluk-yüzey]] ile tutarlı)_
- **[topluluk-kategori]** Discussion tek-seviye kategori (5-9 arası) + tag;
  Theory ve Fan Art flat + küratörlü/kısıtlı tag listesi. Hiçbir yüzeyde
  derin (3+ seviye) kategori ağacı veya serbest/moderasyonsuz tag girişi
  kullanılmaz — hacim ve editöryel kontrol arttıkça nested'e, kullanıcı
  üretimi + çapraz-kesen içerikte flat+küratörlü tag'e kayılır.
  _(2026-07, NN/g "Flat vs. Deep Hierarchies" + Discourse/StackOverflow pratiği)_
- **[topluluk-navigasyon]** Community ana sayfası hub-and-spoke modelindedir:
  4 yüzeyden karışık öne-çıkanlar vitrini + her yüzeyin "Tümünü Gör" ile
  kendi tam listesine (spoke) geçişi — ne tam birleşik akış ne tam ayrı
  sekmeler tek başına kullanılır. Yeni kullanıcı/boş durum asla çıplak
  bırakılmaz, editöryel küratörlükle doldurulur (henüz beğeni sinyali yok).
  _(2026-07, Discourse/Reddit hibrit pratiği)_
- **[topluluk-feed]** İçerik feed'i infinite scroll + "load more" eşiği
  hibrittir; arama/arşiv gibi hedef-odaklı sayfalarda pagination kullanılır.
  Liste→detay geçişinde scroll pozisyonu oturum içi (~30-60dk) korunur.
  _(2026-07, NN/g infinite-scroll ve scroll-restoration araştırması)_
- **[topluluk-feed]** Sıralama seçenekleri en fazla 3-4, net bir varsayılanla
  sunulur (decision fatigue). Kart bilgi yoğunluğu: başlık baskın,
  meta-veri (yazar+tarih, oy+yorum) kompakt gruplanmış TEK satır — aşırı
  satır satır meta-veri dizilmez (F-pattern tarama araştırması).
  _(2026-07, NN/g)_
- **[topluluk-arama]** Tek global arama kutusu, tür-bazlı (Blog/Discussion/
  Theory/Fan Art) facet filtreyle daraltılabilir tek sonuç listesi — yüzey
  başına ayrı arama kutusu açılmaz. _(2026-07, Algolia faceted-search modeli)_
- **[topluluk-bildirim]** Platform-içi anlık bildirim tür-spesifiktir
  ("teorine oy geldi", "yazına yorum geldi"); haftalık özet e-postası ise
  4 türden karışık, takip edilen konulara öncelikli bir dijesttir.
  _(2026-07, Community mimari planlama)_

#### Thread Detay Sayfası

- **[topluluk-yanıt]** Discussion ve Theory yüzeylerinde yanıtlar nested
  (Reddit-lite): görsel indent 3 seviyede durur, sonrası "yanıtı görüntüle"
  ile aynı hizada devam eder. Fan Art yüzeyinde yanıtlar FLAT (YouTube-tarzı,
  1 seviye) — dallanma gereksiz bilişsel yük, takdir yorumları bağımsız.
  _(2026-07, Discourse/Reddit/YouTube emsali)_
- **[topluluk-yanıt]** Silinen yorum/yanıt üç yüzeyde de "[silindi]" olur,
  alt yanıtlar korunur — ağaç/liste bütünlüğü bozulmaz (Reddit modeli).
  _(2026-07, Thread detay araştırması)_
- **[topluluk-header]** Thread detay header sırası: başlık → yazar(avatar+
  isim+rozet)+zaman+tag tek meta satırı → oy bloğu (masaüstü dikey-sol,
  mobil yatay inline — dikey blok dar ekranda yer yer) → aksiyon ikonları
  (paylaş/kaydet/rapor) sağda. _(2026-07, Reddit/StackOverflow emsali)_
- **[topluluk-composer]** Yanıt kutusu alttan sticky slide-up panel
  (Discourse modeli) — sayfa kaymadan okumaya devam edilir, minimize
  edilebilir, taslak otomatik kaydedilir. StackOverflow'un statik-en-alt
  modeli KULLANILMAZ. _(2026-07, Thread detay araştırması)_
- **[topluluk-sayfalama]** Thread içindeki yanıtlar feed'in aksine sonsuz
  kaydırma DEĞİL — ilk 50 yanıt (en çok oylanan/en yeni) + "Tümünü Yükle"
  eşiği. Feed kuralından (infinite scroll) AYRI tutulur, karıştırılmaz.
  _(2026-07, Reddit/YouTube emsali)_
- **[topluluk-spoiler]** Spoiler gizleme tıkla-aç + blur kombinasyonu,
  HOVER değil — Fandom.com'un kendi SpoilerBlur'u hover-bazlı olduğu için
  mobilde çalışmıyor (kendi dev wiki'lerinde bilinen kısıt), bu hata
  Fandoom'da tekrarlanmaz. _(2026-07, Fandom.com dev wiki analizi)_
- **[topluluk-rozet]** "Kanıtlanan teori" rozeti SADECE Theory yüzeyinde,
  topluluk oyu/moderatör onaylı (yazarın tekil onayı değil) —
  StackOverflow'un "kabul edilen yanıt" paterninin fan-teorisi bağlamına
  uyarlanmış hâli, diğer yüzeylere taşınmaz. _(2026-07, Thread detay araştırması)_

#### Kart/Liste Bileşenleri

- **[topluluk-kart]** Discussion satırı: okunmadı göstergesi (renk+ikon
  birlikte, salt renge güvenilmez) → kategori rozeti → başlık (okunmamışsa
  bold) → altta yazar avatarı+adı → sağda yanıt/görüntülenme sayısı + son
  yanıt zamanı+kişisi. _(2026-07, Discourse/phpBB emsali)_
  Discourse'un "son yanıtlayanlar avatar yığını" (en aktif 3 kişinin
  çakışan küçük avatarı) tıklamadan sosyal kanıt verdiği için benimsenir.
- **[topluluk-kart]** Theory kartında oy gösterimi kompakt inline ok+sayı
  (detay sayfasındaki büyük dikey blok DEĞİL), kartın soluna sabit dar
  sütun. Excerpt max 2 satır, cümle sınırında kesilir (karakter-bazlı
  otomatik kesme kullanılmaz). _(2026-07, Reddit card-view/StackExchange emsali)_
- **[topluluk-kart]** Blog kartı: kapak(16:9)→başlık→excerpt→yazar/tarih/
  okuma-süresi (küçük gri tek satır). İlk kart 2x büyük (Medium/Substack
  featured deseni), sonrakiler küçük satır — aynı görsel dilde.
  _(2026-07, Medium/Substack emsali)_
- **[topluluk-kart]** Fan Art grid'i masonry/justified, orijinal görsel
  oranı korunur — Instagram'ın kare zorlaması KULLANILMAZ (kompozisyonu
  bozar). Overlay bilgi masaüstünde hover katmanı, mobilde sabit alt şerit.
  Sütun: 4-5(geniş masaüstü)→3(masaüstü)→2(tablet)→1(mobil).
  _(2026-07, Pinterest/DeviantArt/ArtStation emsali)_
- **[topluluk-kart]** NSFW filtresi spoiler-blur'dan AYRI bir sistemdir:
  hesap seviyesinde kalıcı yaş-onaylı ayar, varsayılan gizli — kart bazında
  tekil "göster" tıklamasıyla karıştırılmaz. _(2026-07, DeviantArt/ArtStation emsali)_
- **[topluluk-kart]** Hover'da beliren HİÇBİR bilgi (oy, aksiyon ikonu)
  dokunmatik cihazda gizli kalmaz — kartın dinlenme durumu zaten tam bilgi
  içerir, hover sadece ekstra vurgu. _(2026-07, a11y/dokunmatik pratiği)_

#### Navbar + Support

- **[topluluk-navbar]** Navbar kesin sırası: `Home(logo) · Series · Movies ·
  News · Blog · Coming Soon · Shop · Community ▾ · Support`. Community
  dropdown SADECE 3 kullanıcı-üretimi yüzeyi taşır (Discussion, Theories,
  Fan Art) — News/Blog editöryel oldukları için dropdown'ın DIŞINDA, ayrı
  üst-seviye linkler. _(2026-07, navbar planlama — kullanıcı onaylı kesin sıra)_
- **[topluluk-yüzey]** News, Blog'dan AYRI bir surface'tır (`surface: NEWS`),
  Blog'a gömülmez — projenin kendi mevcut mock verisinde (`shared/data/
  content.js`) `news`/`blogPosts` zaten farklı alan şekilleriyle (news:
  `date`; blogPosts: `readTime`) ayrı tutuluyordu, bu emsal genel forum
  araştırmasından (Fandom'ın News'i Discussions'a gömmesi) daha
  bağlayıcı sayıldı. İkisi de aynı muameleyi görür (write_permission:
  EDITOR_ONLY, default_sort: RECENT) ama ayrı nav öğesi+sayfadır.
  _(2026-07, navbar planlama — proje verisiyle düzeltme)_
- **[topluluk-premium]** Premium/Pricing tanıtım-odaklı, ayrı bir ürün
  sayfası (`/pricing`) olacak — içerik hâlâ çapraz-kesen `is_premium`
  bayrağıyla mevcut yüzeylerde yaşar, Pricing sadece "bunu ne kapsıyor,
  ne kadar" tanıtımıdır (Reddit Premium/Discord Nitro emsali). ŞİMDİLİK
  navbar'a EKLENMEDİ — kullanıcı kararıyla ertelendi. _(2026-07, navbar planlama)_
- **[topluluk-navbar]** Support tek üst-seviye link (dropdown değil),
  kendi alt-sayfalarını barındırır: `/support` (ana+SSS arama),
  `/support/faq`, `/support/contact`. _(2026-07, navbar planlama)_

#### Yapım/Evren Organizasyonu — Klasör Değil, Etiket

- **[topluluk-organizasyon]** Hiçbir yüzey (Blog dahil) yapıma/evrene göre
  KLASÖR gibi hiyerarşik bölünmez — tek global liste + yapım/evren TAG'i
  (n-n, çapraz-kesen). Üstüne İKİ giriş noktası eklenir: (1) Community ana
  sayfasında "evrene göre gez" kartları (Westeros gibi) — tıklanınca o
  evrenin tag'iyle önceden-süzülmüş görünüm açılır; (2) her global yüzey
  sayfasının (Haberler/Discussion/Theories/Fan Art) üstünde öne-çıkan
  evren/yapım chip'leri — hepsi aynı tek kaynağın filtrelenmiş görünümü,
  veri hiçbir yerde kopyalanmaz/bölünmez. _(2026-07, Community mimari planlama)_
- **[topluluk-organizasyon]** Her yapımın kendi sayfasında (GoT, House of
  the Dragon vb.) 4 küçük "vitrin" kutusu olur (Haberler/Discussion/
  Theories/Fan Art, her biri 2-3 öğe) + "devamı için →" linki ilgili
  global sayfaya (yapım etiketiyle önceden süzülmüş). Bu, en baştaki
  "Community yapım sayfasına gömülmesin" kararıyla ÇELİŞMEZ çünkü tam bir
  bölüm değil, teaser+link-out (Fandom.com DiscussionsRailModule emsali).
  Boş vitrin "0 tartışma" göstermez — davet copy'sine döner ("Bu yapım
  hakkında ilk teoriyi sen paylaş") — ghost-town hissini önler.
  _(2026-07, Community mimari planlama)_

#### Görsel Kimlik Eşlemesi (Fandoom marka diliyle kesişim)

- **[topluluk-görsel]** Community, "utility/tüketim kipi" adında ÜÇÜNCÜ bir
  motion register kullanır — Hero/Intro'nun yavaş-sinematik kipinden
  (0.8-1.2s) AYRI, UI chrome'un kısa-copy kuralına yakın: kart/liste
  girişleri 0.3-0.4s (FeaturedCarousel hover-uzama süresiyle aynı aile).
  Liste↔detay geçişinde cinematic-şerit reveal KULLANILMAZ (o hero/flagship
  anları için ayrılmış) — basit crossfade/instant + scroll-restore.
  _(2026-07, marka-dili/Community UX kesişimi)_
- **[topluluk-görsel]** Community sayfaları NÖTR marka temasını kullanır
  (`--bg`, `--accent` brand-purple) — bir yapım gibi TAM TEMA kurmaz
  (çoklu-yapım, tek yapıma ait değil). Yapım rengi sadece her kart/thread'in
  kategori/production tag'inde `--prod-accent` ince tint olarak yaşar
  (ContentSection'daki mevcut desenin tekrarı). Tipografi istisnasız
  Montserrat — GoT'un özel display fontu Community'de geçersiz.
  _(2026-07, marka-dili/Community UX kesişimi)_
- **[topluluk-görsel]** Birincil CTA ("Yanıtla/Gönder") brand-gradient
  dolgulu pill — mevcut kural birebir. Oy/vote butonu ACCENT renk (nötr/
  beyaz DEĞİL) — oylanmış/aktif durumda `--accent` (Community sayfalarında
  brand-purple, yapım bağlamında `--prod-accent`) dolar.
  _(2026-07, marka-dili/Community UX kesişimi)_

### Blog (Kısa Bilgi Deck'i) — Bilgi Mimarisi

Aşağıdaki kararlar Blog özelliğinin mimari planlamasında kullanıcı
tarafından onaylandı. Özellik HENÜZ uygulanmadı — Community kurallarıyla
aynı gerekçeyle (uygulama başladığında yeniden tartışılmaması için)
önceden kilitlendi. Önceki adı "Shorts", sonra "Content Drops" idi;
2026-07'de kullanıcı kararıyla Content Drops olarak uygulandı, 2026-08'de
(backend'in `content-drop`→`blog` yeniden adlandırmasıyla birlikte) Blog'a
çevrildi — route, klasör/dosya adları, motion fonksiyonları ve bu
bölümdeki kural etiketleri dahil.

- **[blog-yapı]** Blog BAĞIMSIZ bir içerik yüzeyidir (`/blog/:slug`),
  bölüm verisinin içine gömülü bir alan DEĞİL. Bölüm sayfasının altındaki
  "ilgini çekebilir" şeridi aynı tek kaynağın filtrelenmiş VİTRİNİDİR —
  veri hiçbir yerde kopyalanmaz. `[topluluk-organizasyon]` kuralının
  Blog'a uygulanmış hâli. _(2026-07, Content Drops mimari planlama;
  2026-08 Blog'a yeniden adlandırıldı)_
- **[blog-veri]** Blog yazısı↔yapım/sezon/bölüm bağı n-n ÇAPRAZ-KESEN
  tag'dir (`tags: [{ productionSlug, seasonNumber?, episodeNumber? }]`) —
  bir blog yazısı birden çok bölüme bağlanabilir. Backend'de ayrı bir
  `blog_tag` tablosu ister; mevcut CMS modülüne (`section`/`orderIndex`
  deseni) SIKIŞTIRILMAZ çünkü CMS sayfa-slot içeriği içindir, Blog bir
  entity'dir. _(2026-07, Content Drops mimari planlama; 2026-08 Blog'a
  yeniden adlandırıldı)_
- **[blog-veri]** İlgili blog yazısı seçimi kademeli geri düşüşle çözülür:
  tam bölüm → aynı sezon → aynı yapım → aynı evren → recency+popülerlik.
  Ayrı bir cold-start mantığı yazılmaz (`[topluluk-kişiselleştirme]` ile
  aynı formül). _(2026-07, Content Drops mimari planlama; 2026-08 Blog'a
  yeniden adlandırıldı)_
- **[blog-navigasyon]** Blog yazısı AYRI SAYFA ROUTE'unda açılır
  (`/blog/:slug`, tam sayfa) — modal overlay + `location.state` hibridi
  DEĞİL. Gerekçe: paylaşılabilir URL, tek render yolu, geri tuşu doğal
  çalışır. Geri dönüşte bölüm sayfasının scroll pozisyonu korunur.
  _(2026-07, Content Drops mimari planlama; 2026-08 Blog'a yeniden
  adlandırıldı)_
- **[blog-etkileşim]** Blog DETAY sayfası (`/blog/:slug`) TEK KARTTIR,
  TikTok/Reels tarzı dikey swipe DEĞİL — bir önceki "deck kareleri dikey
  kaydırmayla geçer" kuralının YERİNE geçer (kullanıcı düzeltmesi: "deck
  sadece episode altındaki kısımdan geçişte", sayfanın kendisi deck
  olmayacak). "Deck" davranışı YALNIZ bölüm sayfasının altındaki yatay
  şeritte yaşar (RelatedContent/"Dive Deeper" — Window Carousel deseni,
  `[motion]` RelatedContent kuralları) ve blog sayfasının kendi altındaki
  Dive Deeper şeridinde tekrarlanır. Bir yazıdan başka bir yazıya geçiş bu
  şeritten TIKLAMAYLA yeni sayfaya gidiştir — aynı sayfada dikey
  swipe/scroll-snap ile ilerleme YOK. _(2026-07, Content Drops mimari
  planlama; 2026-07 kullanıcı düzeltmesiyle güncellendi; 2026-08 Blog'a
  yeniden adlandırıldı)_
- **[blog-spoiler]** Her blog yazısı taşıdığı en ileri spoiler noktasını
  bildirir (`spoilerThrough: { seasonNumber, episodeNumber }`); okunan
  bölümün ötesindeki içerik blur + TIKLA-AÇ ile gizlenir (hover DEĞİL —
  `[topluluk-spoiler]` kuralının birebir uygulaması). İlgili yazıları
  geçmişe filtrelemek yerine bu gate kullanılır. _(2026-07, Content Drops
  mimari planlama; 2026-08 Blog'a yeniden adlandırıldı)_
- **[blog-blok-pozisyon]** Blog gövdesi (`BlogPost` `.story__bodyWrap`)
  12-sütunlu editöryel grid DEĞİL, SERBEST x/y canvas'tır (Figma/Canva
  tarzı, admin editöründen sürükle-bırakla konumlanır). Her blok
  `x`/`y`/`width` yüzde (0-100), `height` opsiyonel yüzde (null =
  içeriğe göre otomatik yükseklik — metin bloklarının varsayılanı; set
  edilirse sabit kutu, görsellerde kullanışlı). Z-sırası için ayrı alan
  YOK — dizi sırası (orderIndex) aynı zamanda üst-üste binme sırasıdır.
  Önceki `col`/`row` (CSS grid shorthand) alanlarının YERİNE geçti.
  _(2026-08, Blog editör paneli — kullanıcı düzeltmesi: "row col yeterli
  gelmedi kendimiz ayarlayabiliyor olalım bağımsız olsun")_
- **[blog-blok-pozisyon]** Canvas'ın toplam yüksekliği yazar tarafından
  ayarlanır (blog seviyesinde `canvasHeight`, piksel — genişlik referansı
  sabit 1360px, `.story`'nin mevcut max-width'i). Mobilde TÜM canvas
  (tipografi dahil) bu sabit orana göre orantılı küçülür — bu yüzden
  canvas İÇİNDEKİ tipografi (`story__heading/quote/body`) `theme.css`'in
  sabit `--text-*` token'ları YERİNE `cqw` (container query width)
  birimiyle tanımlanır: bu TEK bölüme özel, kullanıcı onaylı bir token
  istisnasıdır — sitenin geri kalanı token sistemini aynen kullanmaya
  devam eder. Editör (authoring) canvas'ı KENDİSİ 1360px sabit genişlikte
  render edilir (cqw ölçekleme YOK, sürükleme matematiği basit pixel
  hesabı) — cqw ölçekleme SADECE yayınlanan `BlogPost` sayfasının
  görüntülenmesinde devreye girer. _(2026-08, Blog editör paneli —
  kullanıcı onayı)_
- **[blog-blok-etkileşim]** Sürükleme için ayrı bir tutamaç YOK — bloğun
  HERHANGİ bir yerine (metin dahil) bas-sürükle taşır; hareket eşiği
  (~4px) tıklama/imleç-konumlama ile sürüklemeyi ayırt eder. Boyutlandırma
  4 kenar + 4 köşeden (8 yön) yapılabilir, tek köşe tutamacı YETERSİZ
  bulundu. Sürüklerken diğer bloklara/canvas merkezine göre ince hizalama
  çizgileri belirir (yumuşak mıknatıslama, ASLA kilit — dışına çıkılabilir);
  bir bloğun alanına girilince o blokta kırmızı kesikli çerçeve UYARISI
  verilir ama otomatik itme/reflow YAPILMAZ (kullanıcı: "asla Microsoft
  Word gibi kısıtlı olmasın, öneri tarzı"). Tüm taslak (meta + bloklar)
  için TEK merkezi undo/redo sistemi (`useHistory`, Ctrl+Z/Ctrl+Shift+Z) —
  component bazlı ayrı undo YOK; bir sürükleme/boyutlandırma gesture'ı
  veya bir metin düzenleme oturumu (blur'a kadar) TEK undo adımıdır.
  _(2026-08, Blog editör paneli — kullanıcı düzeltmesi)_
- **[blog-blok-etkileşim]** Her blok için animasyon (`FADE_UP`/
  `FADE_LEFT`/`FADE_RIGHT`/`PINNED`/`NONE`) ve font (`Montserrat`/
  `Game of Thrones`/`Fraunces` — bilerek SINIRLI liste, marka bütünlüğü
  için açık font seçici YOK) editördeki dişli (⚙) panelinden seçilir;
  aynı alanlar yayınlanan `BlogPost` sayfasında GSAP giriş animasyonunu
  ve tipografiyi belirler. PINNED, serbest canvas'ta ScrollTrigger
  `pin:true` + `pinSpacing:false` ile (viewport'a göre değil, kendi
  dikey aralığında) uygulanır — sabit ~400px pin süresi, henüz yazar
  tarafından ayarlanamaz. _(2026-08, Blog editör paneli — kullanıcı
  isteği)_
- **[blog-blok-pozisyon]** Eski bloglar (backend'de x/y/width/height/
  canvasHeight geçişinden ÖNCE kaydedilmiş, `canvasHeight` alanı null)
  yayınlanan `BlogPost` sayfasında SERBEST KONUMLAMAYA ZORLANMAZ —
  tahmini bir y hesabı denendi ve kullanıcı tarafından reddedildi
  ("imagelerin üstüne çakışıyorlar", gerçek içerik yüksekliği tahminle
  tutmuyordu). Bunun yerine `isLegacyLayout` bayrağıyla NORMAL AKIŞTA
  (üst üste, gerçek içerik boyuna göre otomatik, `position:static`)
  render edilir — çakışma yapısal olarak imkânsız, lazy-load olan
  görseller yüklendikçe akış kendiliğinden düzelir. Backend'de backfill
  migration YOK, sadece yeni sütunlar nullable eklenir; bir admin o
  blogu editörde açıp kaydettiğinde gerçek (tahmini, admin sürükleyerek
  düzeltebilir) x/y/width/height kalıcı yazılır — "tembel migration".
  Editör tarafı (BlogEditor.data.js) hâlâ tahmini serbest konumla
  başlıyor çünkü orada admin çakışmayı görüp sürükleyerek düzeltebilir;
  bu güvenlik ağı SADECE okuyucunun göreceği yayın sayfasında geçerli.
  _(2026-08, Blog editör paneli — kullanıcı düzeltmesi: "eski görüntüleri
  gibi değil imagelerin üstüne çakışıyorlar")_
- **[blog-editor-ui]** Blok ekleme araç çubuğu (AddBlockBar) canvas'ın
  ALTINDA değil, sol kenara SABİT (fixed, yatay buton dizili) bir panelde
  durur — scroll'dan bağımsız her zaman erişilebilir (kullanıcı raporu:
  "component araçlarımız en aşağıda ve sürekli yukarıya ekleme
  yapıyorlar"). Canvas'ın kendi zemini (`--card-bg`) sayfanın zemininden
  (`--bg`) BİLEREK farklı — ikisi aynı olduğunda canvas sınırı görünmüyordu.
  Canvas genişliği artık akışkan (100%, 1360px'e kadar) — sabit 1360px +
  yatay scroll/sürükleme YOK ("tam ekran gibi görünsün"); bu yüzden
  `container-type: inline-size` canvas'ın kendisine de eklendi (cqw
  tipografi editörde de doğru ölçekleniyor, önceden context'siz 0'a
  düşüyordu). Her bloğun overlay'inde sola-yasla/ortala/sağa-yasla
  kısayolları var — serbest sürüklemenin insan gözüyle kaçırabileceği
  hassas hizalamayı tek tıkla garanti eder. Sürükleme/boyutlandırma
  sırasında imleç `document.body`'ye yazılır (grabbing / yön-bazlı resize
  cursor'ı) — küçük tutamaçtan hızlı çıkılsa bile imleç doğru kalır
  (kullanıcı: "taşıdığım ya da boyutlandırdığım belli olsun"). Ayarlar
  (⚙) paneli artık panel dışına tıklayınca kapanıyor (önceden sadece
  dişliye tekrar basınca kapanıyordu). _(2026-08, Blog editör paneli —
  kullanıcı düzeltmeleri, tek oturumda toplu)_
- **[blog-blok-font]** `'Game of Thrones'` @font-face'ine `unicode-range`
  eklendi (sadece harfler: temel Latin + Latin-1/Extended-A, Türkçe
  karakterler dahil) — bu dekoratif fontun rakam/noktalama glyph'leri
  BOZUK çıkıyordu (kullanıcı raporu: "? işareti gibi öğeler bozuk"),
  aralık dışına düşen her karakter artık temiz şekilde Cinzel/serif'e
  düşüyor. Ayrıca editördeki canvas'ta `--font-got` değişkeni HİÇ
  tanımlı değildi (serbest-canvas pivotunda `.story` sarmalayıcısı
  kaybolmuştu) — başlıklar sessizce düz Montserrat render ediyordu, bu
  raporla fark edilip düzeltildi. _(2026-08, Blog editör paneli)_

### İçerik Kartları / Window Carousel

- **[yüzey]** İçerik kartları (bölüm sayfası "You Might Also Like" şeridi)
  KESKİN köşelidir — `border-radius` ve çerçeve YOK. `[yüzey]`'in "belirgin
  radius" genellemesinin İSTİSNASI: radius denendi, kullanıcı "kartlar kötü
  görünüyor, kare olsun" diyerek reddetti. _(2026-07, RelatedContent)_
- **[motion]** İçerik kartı şeridinin animasyonu Window Carousel'dir
  (uyarlama: scroll-driven-animations.style "Window Carousel" =
  `/demos/parallax-carousel/`, Apache-2.0 — hero dönüşümüyle aynı kaynak).
  Kart şeritte ilerlerken GÖRSEL kendi çerçevesi içinde `object-position`
  ile kayar; kart/kutu hareket etmez. Keyframe'ler demoyla birebir
  (`100% 0` → `0 0`), timeline `view(x)`, `@supports (animation-timeline:
  view())` guard'ı içinde. _(2026-07, RelatedContent)_
- **[motion]** Bu şeritte kırpma `overflow: clip` ile yapılır, ASLA
  `hidden` ile — `hidden` elemanı scroll container yapar ve `view(x)`
  timeline'ı carousel yerine kartın kendi (hiç kaymayan) kutusuna bağlanıp
  animasyonu tamamen öldürür. Demonun kaynağında da bu uyarı var:
  "Use clip, not hidden!". _(2026-07, RelatedContent)_
- **[etkileşim]** Şerit SÜRÜKLENEBİLİR olmalı (pointer ile kavra-çek,
  demonun `walk = (x - startX) * 3` mantığı birebir); sürükleme boyunca
  `scroll-snap` kapatılır. Sebep: masaüstünde parallax'ı keşfetmenin yolu
  sürüklemedir, salt ok butonlarıyla efekt fark edilmiyor.
  _(2026-07, RelatedContent)_
- **[layout]** Şeritte TAM 5 kart görünür, 6.'sı kenardan sızar; geri kalanı
  kaydırdıkça gelir. Kaydırma payı kartı büyütmekle DEĞİL öğe sayısıyla
  sağlanır — kartlar scrollport'u ancak dolduruyorsa (ör. 6 kart, 291px pay)
  tek ok tıklaması şeridi sona götürür ve kullanıcı "hiç kaymıyor" der;
  scroll-driven animasyon da devreye girmez. Ölçü: 9 öğe → ~1000px pay.
  _(2026-07, RelatedContent)_
- **[yüzey]** İçerik kartında başlık için GRİ ZEMİN BANDI kullanılmaz
  (denendi, "çirkin duruyor" diye reddedildi) — kart tamamen görselden
  oluşur, başlık altında kendi zemini olmadan doğrudan bölüm zemininde ve
  SOLA hizalı durur. Kart oranı `1 / 1.4` (demonun slide oranı).
  _(2026-07, RelatedContent)_
- **[tipografi]** Bu şeridin bölüm başlığı ince uppercase sans DEĞİL, sayfanın
  GoT display fontudur (`--font-got`), normal-case ve `--text-h2`
  puntosunda — EpisodeBrief/EpisodeStory başlıklarıyla aynı tipografik aile.
  Metin "You Might Also Like" değil **"Dive Deeper"**. _(2026-07, RelatedContent)_
- **[layout]** Yatay şeritte sayfa gutter'ı scroller'ın `padding-inline`'ı
  DEĞİL track'in padding'i + scroller'ın `scroll-padding-inline`'ı ile
  verilir. Scroller'ın kendi padding'i olduğunda `scroll-snap-align: start`
  kartı padding'in önüne kilitliyor ve ilk kart başlıkla hizasını kaybedip
  ekran kenarına yapışıyor. _(2026-07, RelatedContent)_

### Karakterler (Characters) Sayfası — Bilgi Mimarisi

Aşağıdaki kararlar Characters sayfası mimari planlamasında kullanıcı
tarafından onaylandı (referans: `docs/references/behance/got/mod_11.png`
+ kullanıcı ekran görüntüsü, Behance galeri #77914079/modül 457077763).
Özellik HENÜZ uygulanmadı — Community/Blog ile aynı gerekçeyle önceden
kilitlendi.

- **[karakter-yapı]** Karakterler sayfası HANELERDEN BAĞIMSIZDIR — hane
  filtresi/gruplaması bu sayfada YOK. Haneler (Houses/Westeros) ayrı bir
  bölüm olarak ele alınacak, kullanıcı onu ayrıca işleyecek.
  _(2026-08, Characters mimari planlama)_
- **[karakter-detay]** Karakter detay sayfasında SADECE Bio var —
  referanstaki `Bio / Histories / Wallpapers` tab üçlüsünden Histories
  ve Wallpapers YOK, tab mekaniği kurulmaz. _(2026-08, Characters mimari
  planlama)_
- **[karakter-motion]** Referanstaki coverflow (5 dikey portre, ortada
  büyük/aktif) literal olarak kurulmaz — bunun yerine grid üzerinde
  SADECE motion/etkileşim (hover/reveal) kullanılır, ayrı bir coverflow
  bileşeni/mekaniği YOK. _(2026-08, Characters mimari planlama)_
- **[karakter-detay]** Karakter detay sayfası TEK şablondur, kullanıcının
  verdiği iki ekran görüntüsüne (Cersei Lannister + Jon Snow) BİREBİR
  sadık — karakterden karaktere şablon FARKLILAŞTIRILMAZ. İki referans
  görsel/metin yönü ayna simetriktir (Cersei: görsel sol+alıntı üstte /
  Jon Snow: görsel sağ+alıntı altta) — bu, mevcut EDİTÖRYEL ANALİZ
  sol↔sağ dönüşüm imzasının (EpisodeStory kuralı) karakter sayfasına
  uygulanmış hâlidir: yön karakterden karaktere ALTERNATE eder, ama
  şablonun kendisi (tab sırası, hane arması+ad konumu, bio blok, alt
  navigasyon) her karakterde AYNI kalır. _(2026-08, kullanıcı ekran
  görüntüleri)_
- **[karakter-görsel]** Karakter görseli OYUNCU PORTRESİ DEĞİL, dizi
  içi (in-universe) karakter still/promo görselidir — kostümlü, sahne
  içi resmi HBO görseli. Önceki araştırmanın önerdiği Wikimedia oyuncu
  red-carpet portreleri KULLANILMAZ. Kullanıcı kararı: "cast umurumda
  değil, dizideki karakterler önemli." _(2026-08, kullanıcı düzeltmesi)_
- **[karakter-veri]** Karakter verisi backend'de kullanıcı tarafından
  oluşturulacak gerçek bir entity olacak — frontend-only mock veri
  (araştırma agent'ının topladığı kadro listesi) kullanılmayacak; backend
  hazır olana kadar implementasyon BEKLEMEDE. _(2026-08, Characters
  mimari planlama)_

### Highlights (eski adıyla TabExhibit) — Hero/Intro Sonrası Bölüm

Aşağıdaki kararlar Highlights redesign'ının brainstorming oturumunda
kullanıcı tarafından onaylandı. Özellik HENÜZ uygulanmadı — Community/
Blog/Characters ile aynı gerekçeyle (uygulama başladığında yeniden
tartışılmaması için) önceden kilitlendi.

- **[highlights-yapı]** `TabExhibit` → `Highlights` olarak yeniden
  adlandırılır (klasör/dosya/route aynı isim deseniyle taşınır); sayfa
  akışındaki konumu (Hero→SkipIntro→Intro→ScrollStepper→Highlights→
  Footer) DEĞİŞMEZ — Hero/Intro'nun kaldırılıp kaldırılmayacağı ayrı ve
  henüz kararsız bir konudur. _(2026-08, Highlights brainstorming)_
- **[highlights-layout]** Highlights yatay Apple "get the highlights"
  modelindedir: üstte geniş bir stage (kart carousel), altında yatay
  pill-nav satırı — mevcut dikey (sol nav/sağ stage) TabExhibit
  iskeletinin YERİNE geçer. _(2026-08, Highlights brainstorming)_
- **[highlights-etkileşim]** Stage sürüklenebilir bir carousel'dir —
  ama mekanizma GSAP Draggable/InertiaPlugin DEĞİL, NATIVE scroll-snap
  (`overflow-x:auto` + `scroll-snap-type:x mandatory`) + RelatedContent'teki
  kanıtlanmış pointer-drag deseni (mouse click-drag için, `[data-dragging]`
  ile snap geçici kapanır). GSAP Draggable DENENDİ ve kullanıcı tarafından
  reddedildi: hem "çok katı ve farklı" hissetti (referanstaki gerçek
  davranış zaten native OS scroll'u, custom fizik değil) hem de
  `type:'scrollLeft'` modu (ScrollProxy) flex/gap düzenini bozdu, hem de
  trackpad'de HİÇ çalışmadı (wheel event'i dinlemiyor). Pill tıklamak
  SADECE carousel'i o karta kaydırır (native `scrollIntoView`), sayfa
  navigasyonu YAPMAZ; her kartın kendi üzerinde ayrı bir Explore CTA'sı
  gerçek route'a gider. Önceki "tab = Link, hover = crossfade" TabExhibit
  davranışının YERİNE geçer. _(2026-08, Highlights brainstorming;
  2026-08 kullanıcı düzeltmesiyle GSAP Draggable'dan native scroll'a
  çevrildi — "touchpad ile kaydıramıyorum" + "motion çok katı ve farklı")_
- **[highlights-layout]** TÜM kartlar normal/tam parlaklıkta durur —
  aktif/peek arasında opaklık veya scale farkı YOK (önceki "peek kart
  dim + scale-down" denemesi kullanıcı tarafından reddedildi: "cardların
  hepsi normal renkte görünsün, sadece seçili card aydınlık olmasın").
  Ayırt edici tek şey METİN overlay'idir (etiket/başlık/açıklama/CTA) —
  o da SADECE aktif kartta görünür, diğerlerinde tamamen gizlenir.
  Referans: kullanıcının kendi `ipad-pro-highlights` component'i
  (`D:\...\React\Claude Project\src\components\common\Highlight`) —
  kartın kendisi hiç dim olmuyor, sadece caption fade/slide ile
  girip çıkıyor. _(2026-08, Highlights — kullanıcı düzeltmesi)_
- **[highlights-görsel]** Kart görseli FULL-BLEED'dir (4/3 oran, kartın
  tamamını kaplar) ve BÜYÜKTÜR (`clamp(420px, 72vw, 900px)`) — önceki
  "kareye yakın + küçük + ayrı foot bandı" denemesinin YERİNE geçti
  (kullanıcı: "cardlar çok küçük olmuş biraz daha büyült"). Metin
  overlay'i (etiket pill → kalın başlık → açık gri açıklama → CTA)
  görselin ALT kısmında sabit bir okunabilirlik scrim'i (`linear-gradient
  to top`, her kartta HER ZAMAN açık) üstünde durur — referans:
  kullanıcının attığı dribbble blog-card ekran görüntüsü (tag pill +
  başlık + açıklama, görselin üstünde, ayrı bir zemin bandı DEĞİL).
  _(2026-08, Highlights — kullanıcı referansları)_
- **[highlights-veri]** Kart başlığı/açıklaması İÇİN ŞİMDİLİK mock veri
  KULLANILIR (`Highlights.data.js` içinde CMS etiketine göre sabit
  editöryel metin haritası) — önceki "açıklama alanı yok, sahte veri
  doldurulmaz" kuralının kullanıcı tarafından AÇIKÇA ezilen istisnası
  ("üste başlık altında şuanlık alakalı bir açıklama mock veri olsun").
  CMS'te gerçek alan yoksa mock KIRILMAZ fallback'e düşer (başlık =
  etiketin kendisi, açıklama boş). Backend'e gerçek alan istemek ayrı
  bir karardır, henüz istenmedi. _(2026-08, Highlights — kullanıcı
  düzeltmesi, [veri] genel kuralının Highlights'a özel istisnası)_
- **[highlights-cta]** CTA metni **"Explore ›"**dir (önceki düz
  "Explore" metninin YERİNE geçti). Glassmorphism pill kalır:
  `backdrop-filter: blur()` + yarı-saydam açık katman
  (`rgba(255,255,255,~0.6-0.7)`). Genel "birincil CTA brand-gradient
  dolgulu pill" kuralının Highlights kartlarına özel İSTİSNASIDIR —
  kural sitenin geri kalanında değişmedi. Kartın kendi etiketi
  (Characters/Westeros/vb.) artık AYRI bir glass pill olarak CTA'nın
  ÜSTÜNDE, başlığın önünde durur (dribbble referansındaki kategori
  rozeti) — eski alt pill-nav'ın etiket metniyle aynı bilgi, artık
  kartın içinde. İkinci bir buton ("Join for free" tarzı) YOK, kartta
  tek CTA vardır. _(2026-08, Highlights brainstorming + kullanıcı
  düzeltmesi)_
- **[highlights-cta]** Overlay masaüstünde SATIR (row) düzenidir: sol
  blok etiket+başlık+açıklamayı taşır, "Explore ›" CTA'sı SAĞ kenara
  ayrık durur — üst üste yığılmış tek sütun DEĞİL (kullanıcı kararı:
  "explore yazısı sağda olsun image'in"). ≤900px'te tekrar dikey
  sütuna döner (CTA metnin altında) — dar kartta satır düzeni
  sıkışıyordu. _(2026-08, Highlights — kullanıcı düzeltmesi)_
- **[highlights-nav]** Carousel'in alt kontrolü METİN pill listesi
  DEĞİL, NOKTA (dot) göstergesidir — referans: `ipad-pro-highlights`
  kontrolleri (küçük daire, aktifi `--space-2xl` genişliğinde beyaz
  pil'e uzar). Eski "Seasons — Episodes / Characters / Westeros / ..."
  metin tekrarı KALKTI (kullanıcı: "en aşağıdaki tekrar season blog
  yazıları kalksın") — aynı bilgi artık kartın kendi etiket pill'inde.
  OTOMATİK GEÇİŞ YOK (kullanıcı kararı, "süreli olmayacak") — referanstaki
  autoplay + dot-ilerleme-dolumu (dotFill) buraya taşınmadı, dot'lar
  sadece tıklamayla değişir. Aktif dot'un genişlik/renk değişimi
  `transition` İLE yumuşak akar (`--duration-fast`) — ilk halinde bu
  eksikti ve kullanıcı "animasyonu bozuk" diye bildirdi (anlık zıplıyordu).
  _(2026-08, Highlights — kullanıcı kararı + kullanıcı düzeltmesi)_
- **[highlights-motion]** Metin overlay'inin giriş/çıkışı SAĞDAN/SOLDAN
  kayan bir geçiştir (kullanıcı: "yazıların çıkış animasyonları da
  sağdan ve soldan olacak") — referanstaki `CAPTION_ENTER` deseniyle
  birebir: kart kendi yönünden (soldan/sağdan, index çift/tek'e göre
  dönüşümlü atanır) fade+x (56px, JS sabiti) ile girer, aktiflik
  değişince AYNI yönde akarak çıkar (enter→hold→exit, yön tersine
  dönmez). Süre 0.32s (power2.out/in) — ilk denemede 0.5s "çok yavaş"
  bulundu, hızlandırıldı. UYGULANDI (`Highlights.jsx`, CAPTION_OFFSET/
  CAPTION_DURATION sabitleri). _(2026-08, Highlights — kullanıcı kararı
  + hız düzeltmesi)_

## Beklemede

- `prefers-reduced-motion` desteği kararlaştırılmadı — kullanıcı
  "gerektiğinde bakarız" dedi; konu açıldığında seçenekleriyle sorulacak.
- **[topluluk-kişiselleştirme]** Kişiselleştirme/öneri algoritması
  (affinity skorlama: takip+oy+gönderi+ziyaret sinyalleri, `recommendation/`
  orkestrasyon modülü — `production/`'ın ikinci örneği) SONRA konusu,
  MVP'de yok. `user/` modülüne (takip/profil verisi) bağımlı, o kurulmadan
  başlanamaz. Cold-start (sinyalsiz kullanıcı) formülü otomatik olarak
  "ilgili içerik" kademeli-geri-düşüşünün 3. kademesine (recency+global
  popularity) düşer — ayrı bir cold-start mantığı yazılmayacak.
  Agentic (LLM-agent) yaklaşım SEÇİCİ olarak değerlendirilebilir:
  moderasyon/dijest-özet/onboarding/topluluk-arama gibi akıl-yürütme
  gerektiren yan görevlerde uygun; per-request FEED SIRALAMASI agent'a
  YAPTIRILMAZ (maliyet/gecikme/determinizm) — çekirdek skorlama formülde
  kalır. _(2026-07, Community mimari planlama)_
