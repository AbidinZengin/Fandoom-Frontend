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
- **[motion]** Scroll-scrub sahnelerinde ana görsel ekranı dolduracak
  kadar büyük olmalı (~90-100vw, küçük ortalanmış kutu değil) ve scrub
  boyunca yumuşak bir scale büyümesi eşlik etmeli. _(2026-07, aktarım)_
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
- **[motion]** Hero metinleri scroll'a BAĞLI söner ve yukarı dönünce geri
  gelir (ScrollTrigger `scrub: true`, `start:'top top'`, `end:'+=50%'`,
  `opacity 0` + `y -24`, `ease:'none'`). Hedef içerik SARMALAYICISIDIR;
  giriş animasyonu children'ın opacity'siyle oynadığı için iki katman
  çakışmaz. _(2026-07, EpisodePage)_
- **[motion]** Hero altındaki bloğun yazıları da scroll'a bağlı gelir/gider
  ama tepe noktası TAM MERKEZDİR: ScrollTrigger `start:'top bottom'` →
  `end:'bottom top'`, scrub'lı timeline iki eşit tween (0→1, 1→0) — orta
  nokta blok merkezinin viewport merkeziyle çakıştığı andır, merkezi geçer
  geçmez sönme başlar. İmza-dalga KALDIRILMAZ, scrub onun ÜSTÜNE eklenir:
  dalga tekil elemanların, scrub onların sarmalayıcısının opacity'siyle
  oynar (çarpışırlar, ezişmezler). _(2026-07, EpisodeBrief — kullanıcı
  düzeltmesi: "dalga kalkmasın sadece aşağı yukarı eklensin")_
- **[yüzey]** Puan ayrı yıldızlı slot olarak GÖSTERİLMEZ — doğrudan IMDb
  rozetinin değeri olarak durur. Marka logosu kare tuvalli PNG ise (logo
  yalnız orta bantta, üst/alt şeffaf) yükseklik/genişlik vermek logoyu
  küçültür ya da kutuyu şişirir: kutu logonun kendi oranına sabitlenip
  `object-fit: cover` ile boş bant kırpılır (IMDb: 68x34).
  _(2026-07, EpisodeBrief)_
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
- **[metin]** Arayüz metinleri İngilizcedir (buton, başlık, açıklama —
  tümü). _(2026-07, tercih anketi)_
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
- **[yüzey]** Storytelling/atmosfer bölümlerinde görsel kart çerçevesine
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
