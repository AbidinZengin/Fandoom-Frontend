# GoT Dizi Sayfası — Intro "Dragon Journey" Tasarım Planı

_Tarih: 2026-07-17 · Durum: tasarım onayı sürecinde · Kapsam: Game of Thrones intro bölümü (signature)_

Kaynak eskiz: `Adsız-2026-06-29-1126` (Excalidraw/SVG/PNG).

---

## 1. Bağlam ve sayfa akışı

Dizi sayfaları **hibrit** mimaride kurulur: tema-değişkenli ortak iskelet
(ikinci dizide `SeriesPage` desenine terfi eder) + diziye özel signature
bölümler (sayfa-altında kendi klasöründe kalır, terfi ETMEZ).

GoT sayfa akışı (anlatı hunisi):

| # | Bölüm | Rol | Durum |
|---|-------|-----|-------|
| 1 | Hero | Sinematik kanca | ✅ var |
| 2 | **Intro — Dragon Journey** | *Diziyi tanıt* (signature) | 🆕 bu doküman |
| 3 | Characters | Kim — kadro carousel'i | ✅ var |
| 4 | Houses | Hangi dünya (signature, pinned ray) | ⏳ sonraki |
| 5 | Community | Katıl — teoriler + tartışmalar | ⏳ sonraki |
| — | Footer | — | ✅ var |

Bu doküman yalnızca **2. bölümü** (Intro) tanımlar.

---

## 2. Bölüm anatomisi (eskizden)

Uzun, dikey istiflenmiş **bant**lardan oluşur; her bant ~1 viewport boyu.
Eskiz 2 bant taslağıydı; onaylı yapı zenginleştirildi:

- **Bant 0 — Açılış / Stat Hook:** dizi başlığı + hook istatistikleri
  (sezon/bölüm/yıl/Emmy). Ejderha rotası burada başlar (kırmızı = önde uçar).
- **Waypoint 1–4 — Hikâye beat'leri:** her biri IMAGE ATMOSPHERE + TITLE +
  body; `side` alternatiflenerek zig-zag editoryal ritim (image sol/sağ
  yer değiştirir). Mavi segment = ejderha öğe **arkasından**, kırmızı =
  **önünden** geçer.
- **Trailer-hook interstitial'ları:** waypoint'ler arasında kısa, tam-ekran
  vurucu replik (parallax geçişinde belirir) — film trailer ritmi.
- **Kapanış bandı:** Characters'a devir cümlesi + nefes.

**Tekrar eden birim (waypoint):**
`{ side: 'left' | 'right', image, title, body, trailerHook }` — `side` her
bantta alternatiflenerek zig-zag üretir; `trailerHook` waypoint'ten sonraki
interstitial repliği.

---

## 3. Görsel yerleşim spec

- **Bant yüksekliği:** ~100svh (mobil `svh`, adres çubuğu zıplaması yok).
- **Waypoint grid:** iki kolon — biri IMAGE ATMOSPHERE (büyük mood görsel),
  biri metin kolonu (TITLE + 3-4 satır body). `side`'a göre kolon sırası.
- **Metin kolonu:** TITLE (display, `--text-*` skalası) + paragraf(lar).
- **Tokenlar:** font-size / spacing / radius / duration **hardcode YOK** —
  `src/styles/theme.css` skalaları (`--space-*`, `--radius-*`, `--text-*`,
  `--duration-*`). Skalaya uymayan değer gerekirse teslim özetinde bildirilir.
- **Tema:** `production.theme` (bg/accent/fg) devrede; GoT sıcak amber/kızıl
  paleti Hero ile sürekli.
- **Mobil:** kolonlar tek sütuna iner (image üstte, metin altta); zig-zag
  yerine düz dikey okuma.

---

## 4. Dragon route + derinlik dokuması (SIGNATURE — çekirdek)

Ejderha, bölüm boyunca inen **tek bir SVG path** üzerinde ilerler; konumu
scroll ilerlemesine bağlıdır. Rota öğeleri görsel keser:

- **Kırmızı segmentler = önde** (ejderha öğelerin üstünde).
- **Mavi segmentler = arkada** (ejderha öğelerin ardında).

**Teknik yaklaşım — statik üç katman (dinamik z-toggle GEREKMEZ):**
Eskizde her öğe ejderhayla tek ilişki kurar (aynı öğe hem ön hem arka
değil). Bu yüzden:

```
z2  ÖN katman    → önden-geçilen öğeler (front-pass) + ön parallax
z1  EJDERHA      → tek sprite, MotionPath üzerinde
z0  ARKA katman  → arkadan-geçilen öğeler (behind-pass) + arka parallax
```

Her waypoint öğesi kurulumda ön/arka katmandan birine atanır; weave
illüzyonu rotanın öğeleri kesmesinden doğar. **Not:** ileride bir öğenin
hem önünden hem arkasından geçmesi istenirse, o öğe için scroll-anına bağlı
z-toggle (ScrollTrigger `onToggle`) eklenir — şu an kapsamda değil (YAGNI).

**Path tasarım ilkeleri (kullanıcı yönü):**
- **Asimetrik serpantin** — düzenli/simetrik S değil; organik, dengesiz
  sağa-sola salınım.
- **Derinlik yöne bağlı** — öğeye *geldiği taraftan arkadan*, *gittiği yöne
  doğru önden* geçer (her salınımda arka→ön dokuması).
- **Okunabilirlik önce** — path içerik/metin bloklarının üstünden geçip
  okumayı engellemez; içeriğin etrafından ve boşluklarından dolanır.
- **Path görünmez** — yalnız hareketli öğe görünür, çizgi render edilmez.
- **Hareketli öğe = geçici daire** — ejderha ikonu asset gelene dek
  `<circle>`/yuvarlak placeholder ile temsil edilir.
- **Path build çıktısıdır** — nihai `pathD` statik layout kurulunca gerçek
  öğe konumlarına göre çizilir; eskiz yalnız niyet/şekil referansı.

---

## 5. Motion planı (motion-expert aşamasında uygulanır)

Mevcut tek-Lenis + GSAP düzeni kullanılır; yeni motion altyapısı kurulmaz.

- **Ejderha:** `MotionPathPlugin` (gsap ile gelir, ücretsiz) + `autoRotate`
  → burnu yön değiştikçe döner. İlerleme `ScrollTrigger` **scrub** ile
  path'e bağlanır.
- **Parallax katmanlar:** aynı scroll ilerlemesine bağlı farklı hızlarda
  `yPercent`/translate (arka yavaş, ön hızlı).
- **Waypoint reveal:** her bant kendi `ScrollTrigger`'ı — ejderha yaklaşınca
  TITLE + body fade+rise ile belirir (Characters annotation dilini yankılar).
- **Seçiciler:** module class'ları hash'li → hedefler **ref** ile seçilir.
- **Cleanup:** `gsap.context()` + `ctx.revert()`; `clearProps` yalnız
  animate edilen prop'lara scope'lu (learned-rules).
- **Pacing riski:** Houses (pinned ray) ile arka arkaya iki ağır scroll
  bölümü olmasın diye — Intro **scrub-yoğun**, Houses **pin** ile ayrışır.

**reduced-motion (`prefers-reduced-motion: reduce`):** parallax ve path
animasyonu kapanır; sahne statik, tüm waypoint metinleri açık ve doğru
okuma sırasında; ejderha tek sabit dekoratif konumda (`aria-hidden`).

---

## 6. Veri şekli

Diziye özel → `src/pages/series/GameOfThrones/GameOfThrones.data.js`
(shared sözleşmeye dokunmadan; backend gelince yalnız bu katman değişir).

```js
export const dragonJourney = {
  pathD: 'M ...',              // rota (eskizden çıkarılacak SVG path)
  opening: {
    eyebrow: 'A LEGENDARY SAGA',
    title: 'Game of Thrones',
    lead: "The saga that redefined television. Based on George R.R. Martin's A Song of Ice and Fire.",
    stats: [
      { value: '8', label: 'Seasons' },
      { value: '73', label: 'Episodes' },
      { value: '2011–2019', label: 'On Air' },
      { value: '59', label: 'Emmy Awards' },   // web-researcher teyit edecek
      { value: 'HBO', label: 'Network' },
    ],
  },
  waypoints: [
    {
      side: 'right', image: '/got/intro/world.webp',
      title: 'A Land of Seven Kingdoms',
      body: 'From the frozen wilds beyond the Wall to the sun-scorched south, Westeros is a continent of rival realms bound under a single crown — for now.',
      trailerHook: 'Winter is coming.',
    },
    {
      side: 'left', image: '/got/intro/throne.webp',
      title: 'The Game of Thrones',
      body: 'Great houses scheme, marry, and wage war for a throne forged of a thousand swords. Every alliance has a price, and every crown draws blood.',
      trailerHook: 'The night is dark and full of terrors.',
    },
    {
      side: 'right', image: '/got/intro/longnight.webp',
      title: 'The Dead Are Coming',
      body: 'While the realm bleeds over a chair of swords, an ancient enemy wakes in the North. Beyond the Wall, the Long Night gathers its army.',
      trailerHook: 'Fire cannot kill a dragon.',
    },
    {
      side: 'left', image: '/got/intro/fireblood.webp',
      title: 'Fire and Blood',
      body: 'Across the Narrow Sea, the last Targaryen rises with three dragons and a claim older than the realm itself. Fire returns to a world of ice.',
      trailerHook: null,   // son waypoint → kapanışa devir
    },
  ],
  openingHook: 'When you play the game of thrones, you win or you die.', // Bant 0 sonrası
  closing: 'The throne is empty. These are the players who would claim it.',
};
```

**Anlatı yayı:** Açılış (stat hook) → *"…you win or you die."* → **The World**
→ *"Winter is coming."* → **The Iron Throne** → *"…dark and full of terrors."*
→ **The Long Night** → *"Fire cannot kill a dragon."* → **Fire and Blood**
→ Kapanış → Characters. Rotayı uçan ejderha "Fire and Blood"da doruğa çıkar
(anlatı ejderhayla açılıp ejderhayla mühürlenir).

> ⏳ Açık: `pathD` eskizin rota koordinatlarından türetilecek; görsel
> asset'ler ve fact-check web-researcher raporundan gelecek.

---

## 7. Dosya/component yapısı (Fandoom sözleşmesi)

```
src/pages/series/GameOfThrones/
  Intro/
    Intro.jsx            # bölüm + waypoint map + ejderha katmanı
    Intro.module.css     # bantlar, grid, üç-katman z-stack
  GameOfThrones.data.js  # dragonJourney (yukarıda)
```

- Fonksiyonel component + hook; className `block__element`
  (`styles['intro__...']`).
- `GameOfThrones.jsx` render sırası: `<Hero/> <Intro/> <Characters/> ...`.
- İsim notu: `Intro` slot'u ileride başka dizilerde kendi signature'ıyla
  tekrarlanabilir; ejderha özelinde GoT'a bağlıdır (terfi etmez).

---

## 8. Asset gereksinimleri (açık bağımlılık)

- **Ejderha ikonu** — SVG, tercihen tek renk/silüet (tema accent'ini alsın).
- **IMAGE ATMOSPHERE görselleri** — waypoint başına 1 mood görsel (webp).
- **Parallax katmanları** — gökyüzü/sis, dağ/Westeros silüeti, ön plan.

Asset'ler olmadan iskelet **gri kutu placeholder**'larla kurulur. Kaynak:
kullanıcı sağlar **veya** `web-researcher` agent'ına aratılır (karar bekliyor).

---

## 9. Riskler ve açık noktalar

1. **Depth weave karmaşıklığı** — statik üç katmanla çözülüyor (düşük risk);
   yalnız tek-öğe hem-ön-hem-arka istenirse artar.
2. **Mobil fallback** — pin/path mobilde düz dikey okumaya iner; ejderha
   basitleşir. Motion aşamasında netleşir.
3. **İki ağır scroll bölümü pacing'i** — Intro (scrub) vs Houses (pin) ile
   ayrıştırılır.
4. **Asset bağımlılığı** — teslim asset gelene dek placeholder ile ilerler.
5. **Waypoint içeriği** — kullanıcıdan bekleniyor; iskelet lorem ile kurulur.
6. **Pattern-establishing motion** — scroll parallax + MotionPath yeni bir
   etkileşim deseni; CLAUDE.md gereği uygulamadan önce onay alınır.

---

## 10. Sonraki adımlar (pipeline)

1. **component-dev** — statik iskelet: bantlar + zig-zag grid + üç-katman
   z-stack + gri placeholder'lar, motion YOK → screenshot ile "yön doğru mu?"
   onayı.
2. **Asset + içerik** — ejderha SVG, atmosphere görselleri, waypoint metinleri.
3. **motion-expert** — ScrollTrigger scrub + MotionPath + parallax + reveal;
   reduced-motion + mobil fallback.
4. **visual-verify** — screenshot ↔ eskiz karşılaştırma, maks 2-3 tur.

_Not: Bu doküman commit edilmez (proje kuralı); implementasyon kullanıcı
onayıyla başlar._
