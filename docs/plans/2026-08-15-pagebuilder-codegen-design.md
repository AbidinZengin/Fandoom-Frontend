  # PageBuilder — Breakpoint-bazlı Layout (Faz 1.5) + Kod Üretimi (Faz 2)

  ## Context

  Faz 1 (PageBuilder'ın backend'e bağlanması — `2026-08-15-pagebuilder-...` plan
  dosyasına bkz., `C:\Users\dell\.claude\plans\swift-bubbling-russell.md`)
  tamamlandı: tuval tabanlı editör, block'ların 9 backend entity tipinden
  herhangi birine ID ile bağlanması, canlı WYSIWYG önizleme, sürükle-bırak
  palet.

  Bu doküman iki bağlı fazı kapsar:

  - **Faz 1.5 — Breakpoint-bazlı layout:** Gerçek mobil responsive üretim için
    ön koşul. Şu an `layout` (x/y/w/h) block'ta TEK bir düz değer — breakpoint
    değiştirince sadece STİL (renk/efekt) değişiyor, tuval hep sabit 1360px
    kalıyor, pozisyon hiç değişmiyor. Kod üretimi bu haliyle mobilde anlamlı
    bir `@media` çıktısı üretemezdi.
  - **Faz 2 — Kodu Üret (codegen):** PageBuilder'ın asıl kullanım şekli
    netleşti — boş bir tuvalde sıfırdan SAYFA tasarlamak değil, **var olan bir
    sayfanın içine, o sayfayla görsel uyumunu görerek yeni bir COMPONENT**
    tasarlamak (ör. `src/pages/series/GameOfThrones/Intro/` gibi sayfaya özel
    bir alt component). Üretim TEK YÖNLÜ — üretilen dosya normal proje kodu
    olur, PageBuilder bir daha o component'le ilgilenmez (round-trip yok, elle
    yapılan değişiklikler asla ezilmez).

  Her iki faz da kullanıcıyla diyalogla (brainstorming) netleşti, aşağıdaki
  kararlar zaten teyitli — implementasyon aşamasında yeniden sorgulanmamalı.

  ## Faz 1.5 — Breakpoint-bazlı Layout

  **Şema değişikliği** (`src/shared/builder/schema.js`): `layout` düz bir
  `{x,y,w,h}` objesi olmaktan çıkıp `styles`'ın izlediği AYNI kademeli
  matrise geçer:

  ```js
  layout: {
    base: { x, y, w, h },
    md: { x, y, w, h } | null,
    lg: { x, y, w, h } | null,
  }
  ```

  `md`/`lg` dokunulmamışsa `null` kalır ve `base`'in aynı yüzdelerini miras
  alır (`resolveEffectiveStyle`'ın zaten yaptığı kademeli çözümlemeyle AYNI
  desen — yeni bir kavram icat edilmiyor). Çoğu block için bu otomatik
  orantısal ölçekleme yeterlidir (x:%50 w:%30 olan bir block dar tuvalde de
  aynı oranda durur). Sadece dizilimi GERÇEKTEN değiştirmen gereken block'larda
  (ör. yan yana iki kart mobilde alt alta insin) o breakpoint'e geçip elle
  yeniden konumlandırırsın — o zaman `md`/`lg` kendi değerini alır.

  **Tuval genişliği:** TopBar'daki 3 cihaz butonu (Desktop/Tablet/Mobile)
  varsayılan px değerleriyle gelir (1360/768/390) ama serbestçe düzenlenebilir
  bir sayı girişidir — sabit preset'e kilitli değil. Breakpoint değiştirince
  tuval GERÇEKTEN o genişlikte render olur (şu an sadece stil hedefi
  değişiyor, tuval hep 1360 kalıyor — bu düzelir). **Kullanıcı kararı: bu
  genişlik değerleri taslağa (`*.blocks.json`) YAZILMAZ, sadece oturum içi
  TopBar state'i olarak kalır** (kapatıp açınca varsayılana döner — basit
  başlangıç, gerekirse sonra kalıcı hâle getirilir).

  **Etkilenen dosyalar (implementasyon aşamasında):**
  - `schema.js` — `createEmptyBlock`'un `layout` varsayılanı yeni matrise geçer.
  - `store.js` — normalize state şekli değişmez (hâlâ `{[id]: Block}`), sadece
    `Block.layout`'un iç şekli değişir.
  - `Canvas.jsx` — `pixelEdgesOf`, `startDrag`, `startResize`, `startMarquee`,
    `handleCanvasPointerDown` ŞU AN `block.layout.x/y/w/h`'a DOĞRUDAN erişiyor
    — hepsi `resolveEffectiveStyle`'a benzer bir `resolveEffectiveLayout(block,
    breakpoint)` çözümleyicisi üzerinden okur/yazar hâle gelir. Tuval genişliği
    artık `breakpoint`'e göre değişken (`canvasWidths[breakpoint]` — TopBar
    state'i, prop olarak Canvas'a geçer), `ARTBOARD_W` sabiti kalkar.
  - `ContextPanel.jsx` — X/Y/W/H input'ları zaten `breakpoint`'i biliyor,
    `onPatchLayout`'un hedef bucket'ı `styles` ile aynı desende değişir.
  - `TopBar.jsx` — cihaz butonlarının yanına/altına düzenlenebilir genişlik
    input'u.

  ## Faz 2 — Kodu Üret (Component Modu)

  ### Genel akış

  PageBuilder'ı açtığında iki alan:

  1. **Hedef sayfa** — var olan sayfa listesinden seç. Yeni salt-okunur
    design-server ucu (`GET /pages`) `src/pages/**/*.jsx`'i tarayıp
    `series/GameOfThrones/Intro` gibi yolları listeler.
  2. **Referans route** (opsiyonel) — ör. `/series/game-of-thrones`. Girilirse
    yeni bir uç (`POST /capture`) mevcut
    `.claude/skills/visual-verify/scripts/capture-page.mjs`'i child process
    olarak çalıştırır (Playwright mantığı TEKRAR YAZILMAZ, var olan script
    aynen kullanılır), sonuç PNG'yi tuvalin arka planına düşük opaklıkla
    yerleştirir — component'i gerçek sayfanın üstüne bakarak, doğru
    konum/renk/boyut hissiyle tasarlarsın. Statik görüntü, "Yenile" ile
    tekrar çekilebilir. Dev sunucusu kapalıysa `/capture` anlamlı hata verir
    ama üretim referanssız da devam edebilir.

  Tasarım bitince "Kodu Üret":

  3. Component adı sorulur (PascalCase, ör. "IntroBanner").
  4. Hedef: `src/pages/<seçilen-yol>/<Ad>/<Ad>.jsx + .module.css`. Yeni
    design-server ucu (`POST /generate`) klasör ZATEN VARSA **409** döner
    (üzerine yazmaz) — kullanıcı farklı isim dener. Path guard sadece
    `src/pages/**/<Ad>/<Ad>.{jsx,module.css}` desenine izin verir (mevcut
    `/blocks` ucundaki path-traversal engelleme mantığının genişletilmişi).
  5. Üretilen component **route DEĞİL** — parent sayfaya import edip
    kullanmak elle/Claude ile sonradan yapılır (App.jsx veya parent .jsx
    OTOMATİK düzenlenmez, kapsam net kalır — var olan hiçbir dosyaya
    dokunulmaz).
  6. Taslak (`*.blocks.json`) dokunulmadan kalır — round-trip yok, "yeniden
    üret" akışı yok.

  **Tam sayfa/route üretim modu bu fazın kapsamı DIŞINDA** — kullanıcının
  gerçek kullanımı component-bazlı, ayrıca istenirse ileride eklenir.

  ### JSX/CSS üretimi

  Her block sırayla bir CSS class alır (`.block1`, `.block2`, ...). Layout
  artık breakpoint-bazlı olduğu için pozisyon/boyut gerçek `@media` kurallarına
  çevrilir (`base` → düz kural, `md`/`lg` → `@media`). Stil matrisi
  (renk/efekt) + `customCss` aynı mantıkla, `:hover` dahil, eklenir.
  Component tipine göre JSX: TEXT → metin/binding taşıyan `<p>`, IMAGE →
  `<img>`, RECTANGLE/DIAMOND/CIRCLE → saf `<div>` (clip-path/border-radius
  CSS'te). Metin/URL değerleri JSX ifadesi (`{...}`) olarak güvenli
  kaçışlanarak gömülür.

  `animation` alanı kod üretiminde YOK SAYILIR — GSAP kurulumu bilinçli olarak
  elle/Claude ile sonradan eklenir (round-trip'in olmama nedeniyle tutarlı:
  üretilen kod andan itibaren normal proje kodu).

  ### Binding → canlı fetch dönüşümü

  Sayfadaki tüm block'lar taranır, distinct `(entityType, entityId)` çiftleri
  toplanır; her biri için TEK bir `useEffect` + `useState` üretilir — **aynı**
  `src/shared/api/*.js` fonksiyonları çağrılır (`fetchProductionById`,
  `fetchBlogById`, `fetchEpisodeDetail`, `fetchCharacterById`,
  `fetchLoreCategory/Location/Group/Event` — hiçbiri yeniden yazılmaz, olduğu
  gibi import edilir). Veri HER ZAMAN canlı — üretim anındaki değer JSX'e
  GÖMÜLMEZ (donmuş snapshot değil).

  İç içe block-list binding'leri (`blocks.8.imageUrl` — bkz. Faz 1'in
  "İçerik Blokları" özelliği) optional-chain ifadesine çevrilir:
  `series3?.blocks?.[8]?.imageUrl`. Tüm gerekli entity'ler yüklenene kadar
  basit bir guard (`if (!allLoaded) return null;` — `ProductionDetail.jsx`'teki
  `if (!production) return null;` deseninin aynısı, yeni bir loading-UI
  kavramı icat edilmez).

  ### design-server.mjs genişletmesi

  Üç yeni uç (mevcut `/blocks` ucunun yanına, aynı local-only/127.0.0.1
  felsefesiyle):

  - `GET /pages` — `src/pages/**/*.jsx` tarar, sayfa yollarını listeler.
  - `POST /capture` — route alır, `capture-page.mjs`'i child process çalıştırır,
    PNG'yi (base64 veya statik dosya yolu olarak) döner.
  - `POST /generate` — `{ targetPageDir, name, jsx, css }` alır; hedef klasör
    VARSA 409; yoksa `mkdir` + atomic write (mevcut `/blocks` ucundaki
    `.tmp` + `rename` deseninin aynısı) + 201.

  ## Doğrulama (implementasyon bitince)

  - `npm run lint` temiz.
  - Faz 1.5: bir block'u mobile breakpoint'te farklı konumlandırıp desktop'a
    dönünce ESKİ konumun korunduğunu, tuval genişliğinin breakpoint'e göre
    gerçekten değiştiğini doğrula.
  - Faz 2: var olan bir sayfayı hedef seçip, referans route ile screenshot
    çek, bir component üret; üretilen `.jsx`/`.module.css`'i gerçekten bir
    sayfaya elle import edip tarayıcıda görüntüle — binding'li alanların
    gerçek backend verisiyle dolduğunu, breakpoint küçültünce `@media`
    kurallarının devreye girdiğini doğrula.
  - Var olan bir klasör adıyla tekrar üretmeyi dene → 409 + net hata mesajı
    bekleniyor, hiçbir dosya değişmemeli.
