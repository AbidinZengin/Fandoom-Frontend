# Admin Paneli — Çatı, Yapım Yönetimi ve Canlı Önizleme

**Durum:** Tasarım onaylandı (2026-10-10), uygulama başlamadı.

## Amaç

Tüm yapımlara (dizi/film) ve bloglara müdahale edip değişiklik yapabilen,
düzenlerken değişikliğin gerçek public sayfada nasıl durduğunu canlı
gösteren tek bir admin çatısı.

## Karar özeti

1. **Kapsam:** Mevcut admin araçları (Blog editörü, Series Hero, PageBuilder)
   olduğu gibi ortak bir çatı altına taşınır; eksik olan yapım yönetimi
   eklenir. Sıfırdan yeniden yazım YOK (blog editörü / PageBuilder
   yatırımı korunur).
2. **Önizleme:** Gerçek public sayfa, same-origin iframe içinde render
   edilir; taslak veri `postMessage` ile iletilir. İlk faz: yapım **Hero**
   ve **karakter kartı**.

## Mevcut durum (kodda doğrulandı)

- `/admin/login`, `/admin`, `/admin/blogs[/new|/:id]`, `/admin/series-hero[/:seriesId]`,
  `/admin/page-builder` rotaları var (`src/App.jsx`).
- `RequireAuth` yalnızca token kontrolü yapıyor; rol kontrolü yok.
- Yapım için admin arayüzü yok; `productions.js` / `characters.js` /
  `trivia.js` içinde create/update fonksiyonları hazır.
- `src/shared/builder/entitySchemas.js` her entity için alan listesi,
  `fetch/put/post` eşlemesi ve `nonWritableFields` taşıyor.
- Public yapım sayfaları (ör. Pluribus) veriyi KENDİ içinde, sabit slug/id
  ile çekiyor (Hero kendi `fetchProductionById`'ini çağırır); prop ile
  veri almıyorlar. Ayrıca `document.documentElement` üzerindeki `--bg` /
  `--accent` değişkenlerini yazıp cleanup'ta geri alıyorlar.

## SRS

### Fonksiyonel

- **FR-1 Çatı:** Ortak `AdminLayout` (yan menü, breadcrumb, kullanıcı/rol
  göstergesi). Mevcut Blog, Series Hero, PageBuilder iç yapıları
  değişmeden içine taşınır.
- **FR-2 Rol kontrolü:** `RequireAuth` rol bazlı olur; yazma EDITOR+ için.
  Rol `/api/auth/me` ile taze okunur, localStorage'daki rol güvenilmez.
- **FR-3 Yapım yönetimi:** Dizi/film listesi + düzenleme formu; sezon ve
  bölüm düzenleme. İkinci adımda karakter ve trivia CRUD.
- **FR-4 Blog:** Mevcut editöre listeden erişim; DRAFT/PUBLISHED yönetimi
  korunur.
- **FR-5 Canlı önizleme (faz 1):** Formun yanında yapım Hero'su ve karakter
  kartı, yazdıkça güncellenir.
- **FR-6 Kaydetme güvenliği:** Kaydedilmemiş değişiklik uyarısı, hata
  banner'ı, `fieldErrors` gösterimi.

### Fonksiyonel olmayan

- **NFR-1:** `src/shared/api/` ve `src/shared/data/` sözleşmesi değişmez;
  alan ekleme/yeniden adlandırma yok.
- **NFR-2:** Önizleme public component'lerin kendisini kullanır; görünümü
  taklit eden ikinci bir kopya yazılmaz.
- **NFR-3:** Admin kodu public bundle'a sızmaz; admin rotaları lazy-load.
- **NFR-4:** Backend'e yazan her adım ayrı kullanıcı onayıyla çalışır.

### Kapsam dışı (v1)

Tüm 35+ bespoke yapım sayfasının önizlemesi, i18n çeviri arayüzü, medya
kütüphanesi yönetimi, lore modülü, data router'a geçiş.

## Mimari

### A. Önizleme = iframe (gömme değil)

Public sayfa admin DOM'una gömülürse (1) yapım sayfasının `--accent`/`--bg`
yazımı admin temasını bozar, (2) tek global Lenis/ScrollTrigger admin
sayfasını etkiler. Same-origin iframe bunları izole eder.

### B. Taslak enjeksiyonu — tek geçit

Component'lere dokunulmaz.

- Admin, formdaki taslağı debounce'lu (~300 ms) `postMessage` ile iframe'e
  yollar: `{ type, entityType, id, draft }`.
- iframe içinde yeni `src/shared/preview/previewBridge.js`: yalnızca
  `?preview=1` VE `window.parent !== window` iken aktif; yalnızca aynı
  origin'den gelen mesajı kabul eder; taslağı bir store'da tutar.
- `src/shared/api/productions.js` ve `characters.js` içindeki `fetch*`
  fonksiyonları, id eşleşen kayıt için sonucun üstüne taslağı birleştirir.
- Taslak değişince iframe içindeki route remount edilir (key bump); sayfa
  taslakla yeniden çizilir.

### C. Preview modu davranışı

Navbar/Footer gizlenir; giriş sinematiği (`isCinematicArmed`) kapatılır
(aksi halde her taslak değişiminde Hero açılışı baştan oynar).

### D. Çatı ve rotalar

`/admin` altında tek `AdminLayout` (yan menü + `<Outlet/>`); mevcut
rotalar bunun altına taşınır. Yeni sayfalar `src/pages/Admin/Productions/*`
(`ProductionList`, `ProductionEditor`, `PreviewFrame`).

## Formun veri akışı

1. **Yükleme:** `ENTITY_SCHEMAS[type].fetch(id)` → `original` ve `draft`
   kopyaları. Dirty alanlar ikisinin farkından türetilir.
2. **Alan üretimi:** Alanlar `ENTITY_SCHEMAS`'tan gelir; şemada yalnız
   `text | image` tipi olduğu için textarea/gruplama/etiket bilgisi
   `Admin/Productions/` altındaki küçük bir form-yerleşim config'inde
   tutulur. Paylaşılan şemaya dokunulmaz.
3. **Düzenleme:** `onChange` → `draft` → debounce → `postMessage`.
   Faz 1'de yalnız skaler alanlar; dizi alanları (genre, sezon listesi)
   sonraki adım.
4. **Kaydetme:** `entityWriteback.js`'teki `putEntityField` gövde
   filtreleme mantığı (yalnız şemada yazılabilir skaler alanlar, diziler
   hariç) yeniden kullanılır. Fonksiyon şu an export edilmiyor — ortak
   builder dosyasına küçük dokunuş, uygulamadan önce AYRI onay gerekir.
5. **Sonuç:** Başarıda cevap `original` olur, dirty temizlenir. Hatada
   `ApiError.fieldErrors` alanın altına basılır. 401'de client token'ı
   temizler; form taslağı bellekte korunur, login'e yönlendirilir.
6. **Eşzamanlılık:** Last-write-wins (mevcut PageBuilder kararıyla aynı).

## Riskler ve açık noktalar

- **Ortak altyapı değişikliği:** `productions.js`/`characters.js` `fetch*`
  katmanı ve `putEntityField` export'u — CLAUDE.md kapsam kuralı gereği
  uygulamadan önce kullanan yerler listelenip etki bildirilecek, onay
  alınacak.
- **Remount maliyeti:** Her taslak değişimi yeni render döngüsü demek;
  debounce ile makul olması beklenir, uygulamada ölçülecek.
- **Rota geçiş engeli yok:** `BrowserRouter` `useBlocker` desteklemiyor;
  uyarı `beforeunload` + yan menü linklerinde onayla sağlanır.
- **Series/movie PUT canlı doğrulaması** notlarda tamamlanmamış görünüyor;
  ilk yazma öncesi kullanıcı onayıyla teyit edilecek (NFR-4).
- **Navbar:** `App.jsx`'te Navbar `Routes` dışında render ediliyor; admin
  sayfalarında görünüp görünmediği doğrulanmadı — çatı işinde kontrol
  edilecek.
- **Kapsam sınırı:** Önizleme yalnız slug/id'ye bağlı, Hero + karakter
  kartı için; diğer bölümler faz 2+.

## Önerilen uygulama sırası

1. `AdminLayout` + rol bazlı `RequireAuth` + mevcut rotaların taşınması
2. `ProductionList` + `ProductionEditor` (önizlemesiz, skaler alanlar)
3. `previewBridge` + `fetch*` birleştirme + `PreviewFrame` (Hero)
4. Karakter kartı önizlemesi
5. Karakter/trivia CRUD, dizi alanları (genre vb.)

Her adımda: lint + build temiz, görsel değişikliklerde ekran görüntüsü,
commit yalnızca kullanıcı onayıyla.
