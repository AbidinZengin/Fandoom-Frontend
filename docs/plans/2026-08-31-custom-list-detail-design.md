# Özel Liste Detay Sayfası — Tasarım Prompt'u (2026-08-31)

## Referanslar
- Kullanıcı ekran görüntüsü 1: normal görünüm — hero background (liste kapak görseli),
  title + sağında iki ikon buton, sağ üst köşede edit (≡) ikonu, description, altında
  4x2 grid içerik kartları.
- Kullanıcı ekran görüntüsü 2: edit/sıralama görünümü — ilk iki kartta "01"/"02" sıra
  rozeti (drag-reorder state).
- Görsellerdeki sol beyaz şerit mockup aracının kendi paneli, tasarımın parçası
  DEĞİL — yok sayıldı.

## Kapsam
`CustomListsSection` (`src/pages/Account/DashboardView/CustomListsSection/`)
kartına tıklanınca açılan, o listedeki yapımların/blogların sıralı halini gösteren
YENİ bir detay sayfası. Şu an kart tıklaması tanımsız — sadece "Düzenle"
(ListEditorModal) ve "Sil" butonları var. Route + sayfa sıfırdan eklenecek.

## Route & Dosya Yapısı
- `App.jsx`: yeni route `account/lists/:id` (`LangGate` altında, `Account`'un
  kardeşi — BlogPost gibi bağımsız tam-ekran sayfa; referans görsellerde
  dashboard sidebar'ı YOK, hero tam ekran).
- `src/pages/Account/ListDetail/ListDetail.jsx + .module.css + .data.js`
  (colocation deseni).
- `CustomListsSection.jsx`'teki `<li>`'ye `Link to={`/${lang}/account/lists/${list.id}`}`
  eklenir; mevcut Düzenle/Sil butonlarının click'i `stopPropagation` ile korunur.

## Veri Kaynağı (zaten var, yeniden kurulmayacak)
`Account.data.js` → `getMyListDetail(id, { page, size })` + `enrichRawItems()`
tam olarak gereken şekli veriyor: liste meta (`title`, `description`,
`coverImageUrl`, `isPublic`, `itemCount`) + sıralı item array'i
(`itemType`, `title`, `poster/imageUrl`, `progressPercentage`, `savedItemId`).
`ListDetail.data.js` bunu sarmalar, yeniden yazmaz.

## Sayfa Anatomisi (yukarıdan aşağı)

**1. Hero header**
- Full-bleed background: `list.coverImageUrl`.
- Üst→alt gradient overlay: transparent → `--bg`.
- Dominant/baskın renk çıkarımı: image'dan canvas ile ortalama renk hesaplanır
  (projede emsali YOK, sıfırdan yazılacak yeni util) — bu renk gradient'in üst
  tonunu besler ve scroll hedefidir.
- Scroll davranışı (Spotify "now playing" deseni): Lenis scroll ilerledikçe
  (~ilk 400-600px) background-image opaklığı 1→0, altındaki solid
  dominant-color katmanı 0→1. GSAP ScrollTrigger scrub — `motion-expert`
  aşamasında.
- Üst bar: geri butonu (sol), edit ikonu (sağ üst — referans ≡/hamburger,
  projede karşılığı yok → ContentActions'daki inline-SVG deseniyle tutarlı
  yeni bir kalem/pencil ikonu önerilir).

**2. Title satırı**
- Title solda (`--text-h1`/`h2`).
- Sağında Heart (beğen) + Bookmark (kaydet) — `ContentActions`'ın buton
  stilini BİREBİR kullan (44px daire, `rgba(0,0,0,.35)`, aktifken `--accent`).
  Referans görseldeki "star" yerine mevcut `Bookmark` SVG'si — marka/ikon
  tutarlılığı için yeni ikon icat edilmez.
- Faz 1: statik/tıklanabilir UI, optimistic yerel state. Backend bağlanması
  ayrı adım (bkz. Kararlar #1).

**3. Description**
- `list.description`, tam metin (kart görünümündeki 2-satır clamp burada yok).

**4. İçerik listesi**
- `TopBlogsRow` desenine yakın kart anatomisi: `card__cover` + `card__caption`
  (alt gradient overlay, başlık+meta). Referans görselde 4 kolonlu grid.
- Her kart `enrichRawItems()` çıktısından biri; normal modda tıklama →
  production/blog detay route'u (mevcut `ResultCard`/`TopBlogsRow` linkleriyle
  aynı desen).

**5. Edit modu (sıralama + silme + ekleme, tek mod)**
- Edit ikonuna basınca: kartlarda sıra rozeti (01, 02…) + drag handle + kart
  üzerinde silme aksiyonu belirir, tık-ile-git devre dışı kalır. Ayrıca
  listeye yeni içerik eklemek için bir giriş noktası (ör. kart grid'inin
  sonuna eklenen "+ Ekle" kartı, `ListEditorModal`'daki candidate havuzunu
  kullanan bir alt-panel/popover) gösterilir.
- Sürükleme: **GSAP Draggable** (gsap `^3.15.0` zaten bağımlılık, Draggable
  dahil ve ücretsiz — CLAUDE.md'nin "yeni npm paketi yasak" kuralına uyumlu,
  ek paket gerekmez).
- Silme/ekleme: mevcut `addToList`/`removeFromList` (`src/shared/api/account.js`)
  çağrıları bu moda taşınır — `ListEditorModal`'ın candidate-checkbox
  mantığı burada tekrar kullanılabilir (kopyalanmaz, ortak bir alt-component'e
  çıkarılabilir — implementasyon aşamasında değerlendirilir).
- `ListEditorModal` SADECE metadata (title/description/coverImageUrl/isPublic)
  düzenlemesi için kalır; kart üzerindeki "Düzenle" butonundan erişimi aynen
  sürer.
- Edit ikonu bu moddayken "Kaydet"e dönüşür (aynı konumda).
- Kaydet → yeni sıra + eklenen/çıkarılan item'lar API'ye persist edilir, mod
  kapanır, kartlar tekrar tıklanabilir olur.

## Kararlar (2026-08-31 kullanıcı onayı ile netleşti)

**1. Heart+Bookmark** — EKLENECEK, gerçek özellik. Faz sırası: önce görsel
(statik UI, `ContentActions` stiliyle) oluşsun, işlevsel bağlama (backend/state)
sonraki adımda gelir. Backend kapsamı (liste-seviyesi beğeni/kaydetme
endpoint'i) implementasyon aşamasında netleştirilecek — bu tur sadece UI
iskeleti kurulur, buton tıklanabilir ama önce optimistic yerel state ile
çalışır.

**2. Edit ikonu davranışı** — sağ üstteki edit ikonu **sıralama + silme +
ekleme** modunu birlikte açar (tek mod, tek ikon). Yani mevcut
`ListEditorModal`'ın içerik ekle/çıkar sorumluluğu bu sayfanın edit moduna
taşınıyor/entegre oluyor — ayrı modal açmıyor. `ListEditorModal` başlık/
açıklama/kapak görseli (metadata) düzenlemesi için ayrı kalır (kart üzerindeki
"Düzenle" butonundan erişim devam eder); bu sayfanın edit modu SADECE
item-seviyesi aksiyonlara (sırala/sil/ekle) odaklanır.

**3. Sıra + ekleme/silme persist API'si** — EKLENECEK. Backend'de yeni
endpoint(ler) gerekiyor (ör. `PATCH /me/lists/:id/items/reorder`,
mevcut `addToList`/`removeFromList` sıralama moduna taşınacak). Bu backend
işi — ayrı onay + backend görevi gerekir (bkz. `db-cloudinary-yazma-onayi`
prensibi), FE tek başına tamamlayamaz.

**4. Route yeri** — bağımsız tam-ekran sayfa, `CustomListsSection`
dashboard'undaki bir listeye tıklanınca açılır. Kullanıcı onayladı.

## Stil/Token
- Renk: `--bg`, `--card-bg`, `--border`, `--accent` (ContentActions'la tutarlı).
- Radius: `--radius-lg` (hero köşeleri varsa), `--radius-md` (item kartları).
- Spacing: `--space-lg/xl/2xl`.
- Tipografi: `--text-h1`/`h2`, `--tracking-label`.
- Skalaya uymayan ölçü çıkarsa (ör. hero min-height) teslimde bildirilir,
  sessizce icat edilmez.

## Standart İş Akışı
Spec onaylanınca normal pipeline: `visual-verify` (referans zaten elde) →
`component-dev` (statik iskelet, motion yok) → `motion-expert` (scroll-driven
renk geçişi + GSAP Draggable sıralama) → `visual-verify` (screenshot ↔
referans karşılaştırma).

## Uygulama Durumu (2026-08-31 — ilk tur teslim edildi)

Kurulanlar:
- Route: `account/lists/:id` → `src/pages/Account/ListDetail/ListDetail.jsx`
- Veri: `Account.data.js` → `getCustomListDetail(id)` (meta + sıralı items)
- Hero: kapak görselinden canvas ile baskın renk çıkarımı
  (`dominantColor.js`) + iki `position:fixed` katman (radyal accent wash +
  lineer `--bg` fade) — Spotify efekti ScrollTrigger'sız, salt CSS
  fixed-layer tekniğiyle (referans Figma Make prototipinden doğrulandı).
- Heart/Bookmark: Faz 1 (dekoratif, backend'siz optimistic local state),
  Account sayfasının monokrom istisnasına uyar (`--accent` DEĞİL `--fg`).
- Edit modu: TEK ikon → sıralama + silme + ekleme birlikte açılır.
  - **Silme/ekleme GERÇEK persist** — mevcut `addToList`/`removeFromList`
    (`AddItemsPanel.jsx`) kullanılıyor.
  - **Sıralama SADECE bu oturumda kalıcı** — backend'de item sırası için
    alan/endpoint yok (Karar #3), reorder local state'te kalır. Sayfa
    yenilenince veya ekle/çıkar sonrası refetch'te orijinal sıraya döner.
    Kalıcı sıra için backend'e `position` alanı + reorder endpoint'i ayrı
    görev olarak eklenmeli.
  - Sürükleme: native HTML5 drag events (kütüphane yok) + **GSAP Flip**
    (Draggable değil — grid reorder için Flip daha basit/doğru araç,
    gsap zaten bağımlılık, Flip dahil/ücretsiz). Drop anında
    `Flip.getState` → state güncelle → `Flip.from` ile TÜM kartlar smooth
    kayar (kullanıcının "keskin olmasın" isteği).
- `CustomListsSection` kartı artık `account/lists/:id`'e link.

Doğrulama: `npm run lint` ve `npm run build` temiz. Görsel doğrulama
**tamamlanmadı** — sayfa gerçek backend'e bağlı (`getMyLists`/
`getMyListDetail`), test için giriş yapılmış bir oturum gerekiyor; bu ortamda
kimlik bilgisi yok ve backend'e yeni test verisi yazmak (kayıt olma) ayrı
onay gerektirir (bkz. CLAUDE.md "DB/Cloudinary yazma onayı"). Dev sunucusu
`http://localhost:5174` üzerinde açık bırakıldı — giriş yapıp en az bir
CUSTOM liste ile `/tr/account/lists/:id` üzerinde hero/drag-drop/renk
geçişini test etmeniz gerekiyor.

Kapsam dışı bırakılanlar (spec'te yoktu, referans prototipte vardı):
Film/Dizi filtre çipleri (TÜMÜ/Filmler/Diziler) — istenirse ayrı küçük ek.
