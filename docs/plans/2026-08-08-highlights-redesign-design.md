# Highlights (eski adıyla TabExhibit) — Redesign

**Durum:** Motion dahil uygulandı (drag fiziği + metin giriş/çıkışı).
İki revizyon geçirdi ("v2" kart anatomisi/nav, "v3" drag mekanizması +
CTA konumu) — GÜNCEL doğru kaynak her zaman learned-rules "Highlights"
bölümüdür, bu dosya sadece tarihsel iz.
**v3 notu (kullanıcı düzeltmesi):** Aşağıdaki "Etkileşim / drag fiziği"
bölümü GSAP Draggable + InertiaPlugin öngörüyordu — bu DENENDİ ve
reddedildi ("motion çok katı ve farklı", "touchpad ile kaydıramıyorum").
Yerine NATIVE scroll-snap + RelatedContent'teki pointer-drag deseni
geçti (bkz. learned-rules `[highlights-etkileşim]`). Ayrıca CTA artık
overlay'de metnin SAĞINDA (satır düzeni), önceki "sol sütun altında"
yerleşiminin YERİNE geçti (`[highlights-cta]`).
**Konum:** Sayfa akışında değişmiyor — Hero → SkipIntro → Intro →
ScrollStepper → **Highlights** → Footer. Hero/Intro'nun kaldırılması
ayrı ve henüz kararsız bir konu; bu iş ondan bağımsız yürüyor.
**İsim değişikliği:** `TabExhibit/` klasörü → `Highlights/` (jsx/css/data
dosya adları ve içindeki class/fonksiyon isimleri de taşınır).

## Konsept

Apple'ın iPhone/iPad ürün sayfalarındaki "get the highlights" carousel'i
esinlenerek: üstte geniş, sürüklenebilir bir kart carousel'i (stage),
altında yatay pill-nav satırı. Mevcut TabExhibit'in dikey (sol nav / sağ
sabit stage, hover-crossfade) iskeletinin tamamen yerine geçer.

```
┌──────────────────────────────────────────┐
│           küçük kicker + başlık            │
├──────────────────────────────────────────┤
│  ┌───────────────┐  ┌──────────────┐      │
│  │                │  │(peek, %45    │      │
│  │  aktif kart     │  │ opak, %92    │ ... │
│  │  (kareye yakın) │  │ scale)       │      │
│  │  [Explore glass]│  │              │      │
│  └───────────────┘  └──────────────┘      │
├──────────────────────────────────────────┤
│   ○ Characters  ● Houses  ○ Episodes ...   │  ← yatay pill-nav
└──────────────────────────────────────────┘
```

## Kart anatomisi

- **Görsel:** `item.image`, kareye yakın oran (mevcut stage'in 16/10
  oranının yerine), `object-fit: cover`.
- **Başlık:** `item.label`, görselin altında (overlay değil, ayrı bant).
- **Açıklama:** YOK — CMS modelinde (`EXHIBIT_ITEM_LABEL`) ayrı bir
  açıklama alanı yok, sahte metinle doldurulmuyor (learned-rules
  `[veri]` kuralı). Backend'e ayrı alan istenirse bu ayrı bir karar.
- **CTA:** Tek buton, "Explore" — `item.labelLinkUrl`'e gerçek `<Link>`.
  Glassmorphism pill: `backdrop-filter: blur()` + yarı-saydam açık
  katman (`rgba(255,255,255,~0.6-0.7)`) + arkadan sızan görselin kendi
  rengi/dokusu bulanık sızıyor gibi görünür (görsel üstünde durduğu
  için arka plan zaten kartın kendi fotoğrafı — ekstra bir renk katmanı
  eklemeye gerek yok, blur'un altından kartın görseli sızacak).
  Genel "birincil CTA brand-gradient dolgulu pill" kuralının bu bölüme
  özel istisnası (learned-rules'a işlendi). İkinci buton yok.
- **Peek komşu kart:** ~%45 opaklık + ~0.92 scale, tıklanamaz — sadece
  "daha var" sinyali.

## Etkileşim / drag fiziği

- **Mekanizma:** `gsap/Draggable` + `gsap/InertiaPlugin` (gsap 3.15,
  ikisi de ücretsiz paketle geliyor — yeni npm paketi gerekmiyor).
  Track `type: 'x'`, `bounds` ilk karttan son karta kadar sınırlı
  (sonsuz loop yok — Apple'ın kendi carousel'i de sınırlı).
- **Snap:** `Draggable`'ın `snap` fonksiyonu bırakılan x'i en yakın
  kart merkezine yuvarlar; `InertiaPlugin` ile atma (throw) hızına göre
  1-2 kart ileri gidebilir, sonra snap düzeltir.
- **Pill senkronu:** Pill artık `<Link>` değil `<button>` — tıklamak/
  hover'lamak sadece `gsap.to(track, { x: targetX, duration: 0.6,
  ease: 'power3.out' })` ile o karta kaydırır ve React `active` state'i
  günceller (pill'in dolgun/beyaz gösterge stili, mevcut
  `exhibit__tab-line` mantığının yatay hâli). Drag bittiğinde de aynı
  state güncellenir (tek kaynak: aktif index).
- **Klavye:** Stage'e focus verilince ok tuşları (←/→) bir önceki/
  sonraki karta snap eder (a11y — mevcut dokunmatik/hover kurallarıyla
  tutarlı ek).
- **Dokunmatik:** Draggable dokunmatikte native çalışır; dikey sayfa
  scroll'u ile çakışmaz (Draggable x-eksenine kilitli, y pointer
  hareketi tarayıcıya bırakılır — `RelatedContent`'teki sürüklenebilir
  şerit deseniyle aynı aile).
- **Reduced motion:** Sürükleme fonksiyonel kalır, ama düzeltme/snap
  animasyonları `duration: 0` olur (anlık) — crossfade'lerin reduced-
  motion davranışıyla tutarlı.

## Motion imzası (giriş)

Mevcut TabExhibit'in `data-title` / `data-reveal` deseni korunur:
başlık **imza-dalga** ile tek blok önden girer (`x:140, y:56,
duration:0.9, power3.out`), stage + pill-nav ~0.15s arkasından
kademeli reveal ile takip eder (`once:true`, `start:'top 72%'`).
Draggable kurulumu bu reveal'dan SONRA (`onComplete` ya da ayrı
`useLayoutEffect`) yapılır ki giriş animasyonu sırasında transform
çakışması olmasın.

## Responsive

- **≤900px:** Kart genişliği viewport'un çoğunu kaplar, peek payı
  daha dar (~%8-10) ama kalır. Pill-nav satırı `overflow-x: auto` ile
  yatay kaydırılabilir (tab sayısı arttıkça sarmaz).
- **Dokunmatik:** `@media (hover: none)` — pill hover-preview yok zaten
  (artık hover carousel'i kaydırmıyor, sadece tıklama/drag kaydırıyor),
  ek bir kural gerekmiyor.

## Veri / kapsam notları

- `TabExhibit.data.js` → `Highlights.data.js`: `fetchExhibitContent`
  fonksiyon adı ve CMS alan eşlemesi (`EXHIBIT_ITEM_IMAGE/LABEL`)
  AYNI kalır — sadece dosya/klasör taşınır, backend sözleşmesi
  değişmiyor.
- Westeros linkinin override'ı (`TabExhibit.data.js:20-21`) taşınır,
  davranış değişmez.
- Açık backend isteği (opsiyonel, kullanıcı onayı gerekir): kart
  açıklaması için CMS'e yeni bir `EXHIBIT_ITEM_DESCRIPTION` alanı.
  Şimdilik eklenmiyor.

## v2 revizyonu (kullanıcı geri bildirimi, statik iskelet sonrası)

İlk statik iskelet onaya sunulunca kullanıcı kart anatomisini ve alt
navigasyonu değiştirdi — referans olarak kendi `ipad-pro-highlights`
component'ini (`D:\...\React\Claude Project\src\components\common\
Highlight`) ve bir dribbble blog-card ekran görüntüsünü verdi. Detaylı
kurallar learned-rules'a işlendi (`[highlights-layout]`,
`[highlights-görsel]`, `[highlights-veri]`, `[highlights-cta]`,
`[highlights-nav]`, `[highlights-motion]`); özet:

- **Kart artık FULL-BLEED ve BÜYÜK** (`clamp(420px, 72vw, 900px)`,
  4/3 oran) — "kareye yakın + küçük + ayrı foot bandı" YERİNE geçti.
- **Peek dim/scale KALKTI** — tüm kartlar normal parlaklıkta; sadece
  METİN overlay'i aktif kartta görünür, diğerlerinde tamamen gizli.
- **Mock başlık + açıklama** (`Highlights.data.js` → `MOCK_COPY`) —
  CMS alanı gelene kadar geçici, kullanıcı onaylı istisna.
- **Kart içi etiket pill'i eklendi** (glass, görselin üstünde, başlığın
  önünde) — eski alt pill-nav'ın etiket metni artık burada.
- **CTA metni "Explore ›"** oldu (düz "Explore" değil).
- **Alt kontrol artık DOT-nav** (nokta göstergesi, ipad-pro-highlights
  kontrolleriyle birebir) — metin pill listesi kalktı, otomatik geçiş
  YOK (referanstaki autoplay/dot-fill bilerek alınmadı).
- **Metin giriş/çıkışı sağdan/soldan kayan bir geçiş olacak**
  (referanstaki `CAPTION_ENTER` deseni) — henüz UYGULANMADI, bu
  motion-expert aşamasının işi (drag fiziğiyle birlikte).

Yukarıdaki "Kart anatomisi" ve "## Konsept" bölümlerindeki kareye-yakın/
peek-dim/pill-nav ayrıntıları bu revizyonla GEÇERSİZ — güncel hâli için
learned-rules'a bakılmalı.

## Uygulama sırası

1. `component-dev` — klasör taşıma (`TabExhibit/` → `Highlights/`),
   JSX iskeleti (kart grid + pill-nav DOM'u, glass CTA stili), motion
   YOK, route bağlantısı (`GameOfThrones.jsx` import güncellemesi).
   → statik hâliyle "yön doğru mu?" onayı.
2. `motion-expert` — Draggable/InertiaPlugin kurulumu, snap, pill
   senkronu, klavye desteği, imza-dalga giriş reveal'i.
3. `visual-verify` — screenshot ↔ bu spec karşılaştırması.
