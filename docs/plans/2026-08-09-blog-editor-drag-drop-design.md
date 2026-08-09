# Blog Editör Paneli — Sürükle-Bırak Blok Editörü

**Durum:** Tasarım onaylandı, uygulama başlamadı. Backend bağımlılıkları
(bkz. "Backend bağımlılıkları") tamamlandı — frontend implementasyonu
artık hiçbir eksik/geçici varsayıma dayanmadan baştan sona başlayabilir.

## Amaç

İçerik üretimini hızlandırmak için mevcut blog `blocks[]` modelini
(HEADING/QUOTE/IMAGE/PARAGRAPH, `orderIndex`, opsiyonel `col`/`row` grid
override) düzenleyebilen, sürükle-bırak ile yeniden sıralanabilen bir
admin paneli. Figma/Canva tarzı serbest (x/y) canvas DEĞİL — backend
kontratı zaten sıralı liste + opsiyonel grid override şeklinde, bu
tasarım onu birebir kullanır (yeni backend alanı gerekmiyor).

## Kapsam dışı (v1)

- Serbest x/y canvas konumlandırma
- Yeni blok tipleri (spoiler kutusu, video vb.) — sadece mevcut 4 tip
- Draft/blog listesi sayfası — v1'de blog'a doğrudan id ile
  (`/admin/blogs/:id`) gidiliyor, liste UI'ı ayrı bir sonraki iş
- Kısmi/patch update — backend `PUT` zaten replace-all, buna uyulur
- Alan-bazlı (`blocks[2].text` gibi) validasyon hatası yerleştirme —
  ilk sürümde genel banner yeterli

## Backend bağımlılıkları (tamamlandı — 2026-08-09)

1. **`GET /api/blogs/{id}` rol koruması** ✅ — `SecurityConfig`'e genel
   `permitAll`'dan önce eşleşen `GET /api/blogs/{id:[0-9]+}` →
   `hasAnyRole("EDITOR","MODERATOR","ADMIN")` kuralı eklendi. Draft
   içerik artık token'sız/rolsüz istekte 401/403 döner (liste,
   `/hub`, `/slug/{slug}`, `/related` public kalmaya devam ediyor).
2. **`BlogSummaryResponse.status` alanı** ✅ — record'a `BlogStatus
   status` eklendi. `GET /api/blogs` listesi artık her satırda
   status taşıyor.
3. **Auth akışı** ✅ (zaten netti, backend değişikliği gerekmedi):
   `POST /api/auth/login` → `{ username, role, token }` (JSON body,
   cookie yok). Rol JWT içinde YOK — sadece login ve `GET /api/auth/me`
   response'unda geliyor. Sayfa yenilendiğinde rolü tazelemek için
   `/api/auth/me` çağrılmalı (localStorage'daki eski rol güvenilmez —
   DB'de değişmiş olabilir).

Üçü de kapandı; blok editörü artık "kim girebilir" ve "hangi blog
taslak" sorularında geçici/varsayımsal davranışa dayanmadan
inşa edilebilir.

## Rota yapısı

- `/admin/login` — `POST /api/auth/login`, token+role state'e/
  localStorage'a yazılır
- `/admin/blogs/new` — boş taslak (`status: 'DRAFT'`)
- `/admin/blogs/:id` — mevcut blogu düzenler
- Route koruması: token yoksa `/admin/login`'e yönlendirir; token
  varsa `/api/auth/me`'den taze `role` okunur, `EDITOR`/`MODERATOR`/
  `ADMIN` değilse aynı şekilde engellenir (backend rol kuralı netleşti,
  v1'den itibaren tam kontrol uygulanır)

## Component listesi

**Sayfa:** `src/pages/Admin/BlogEditor/BlogEditor.jsx` (+`.module.css`,
+`.data.js`)

**Page-altı component'ler** (`BlogEditor/` klasöründe):
- `MetaPanel/MetaPanel.jsx` (+`.module.css`) — title, kicker, axis,
  status, format, spoiler, tags
- `BlockList/BlockList.jsx` (+`.module.css`) — dnd-kit `DndContext` +
  `SortableContext`
- `BlockList/BlockItem/BlockItem.jsx` (+`.module.css`) — sürükle
  tutamacı, sil, tip rozeti, "Gelişmiş" col/row alanı
- `BlockList/BlockItem/TextBlockField.jsx` — HEADING/QUOTE/PARAGRAPH
  ortak textarea (max 5000)
- `BlockList/BlockItem/ImageBlockField.jsx` (+`.module.css`) — dosya
  seç → upload → önizleme + alt text
- `AddBlockBar/AddBlockBar.jsx` (+`.module.css`) — 4 tip için ekle
  butonları

**shared/api eklemeleri:**
- `shared/api/blogs.js` → `createBlog`, `updateBlog`
- `shared/api/media.js` (yeni) → `uploadImage`
- `shared/api/auth.js` (yeni) → `login`, `getCurrentUser` (`/api/auth/me`)
- `shared/api/client.js` → `apiClient` her isteğe `Authorization: Bearer
  <token>` header'ı eklemeli (token bir yerden okunmalı — localStorage
  önerilir, cookie seçeneği yok çünkü backend cookie set etmiyor)

**Yeni paket:** `dnd-kit` (`@dnd-kit/core` + `@dnd-kit/sortable`) —
CLAUDE.md'nin "yeni npm paketi eklenmez" kuralına bu iş için istisna
onayı verildi.

## State & veri akışı

`BlogEditor.jsx` tek state objesi tutar, `BlogRequest` şekline yakın
(`title`, `kicker`, `axis`, `status`, `format`, `spoilerThrough*`,
`tags`, `blocks`).

- **Yükleme:** `:id` varsa `GET /api/blogs/{id}` → `BlogEditor.data.js`
  response'u editable state'e çevirir. `:id` yoksa boş taslak
  (`status: 'DRAFT'`).
- **Blok kimliği:** `BlogBlockRequest`'te `id` yok (backend
  `orderIndex`'i array sırasından türetiyor). Her blok state'e
  alınırken client-only `_key` (`crypto.randomUUID()`) kazanır — sadece
  React/dnd-kit key'i için, `toBlogRequest()` payload'a çevirirken
  atılır.
- **Sıralama:** dnd-kit `onDragEnd` → `arrayMove` → `blocks` state'i
  güncellenir. Ayrı `orderIndex` alanı tutulmaz, array sırası =
  orderIndex.
- **Ekleme/silme/düzenleme:** `AddBlockBar` sona ekler; `BlockItem`
  kendi `_key`'ine göre immutable güncelleme/silme yapar.
- **Görsel yükleme:** `ImageBlockField` dosya seçilir seçilmez (Kaydet
  beklemeden) `POST /api/media/images`'a gider — blob preview →
  gerçek `url`. Cloudinary yetim-kalma riski YOK (backend `PUT`/`DELETE`
  sırasında eski blok görsellerini otomatik temizliyor — 2026-08-09
  backend düzeltmesi, FE kontratı değişmedi).
- **Kaydet:** state → `toBlogRequest()` (`_key` atılır) → yeni ise
  `POST /api/blogs` (başarıda dönen id'yle `/admin/blogs/{id}`'e
  navigate), var olan ise `PUT /api/blogs/{id}` (tüm `blocks[]` yeniden
  gönderilir — replace-all kontratı).

## Component etkileşimleri

- **`BlockList`**: `closestCenter` collision, `verticalListSortingStrategy`,
  `items = blocks.map(b => b._key)`. `onReorder(newBlocks)` prop'uyla
  `BlogEditor`'a bildirir.
- **`BlockItem`**: `useSortable(_key)` SADECE sürükle tutamacına bağlı
  (kart geneline değil) — textarea/input'lara tıklamak sürüklemeyi
  tetiklemez. dnd-kit klavye sensörü hazır gelir (a11y bedava). Silme
  inline "emin misin?" onayı ister (undo yok, kayıp geri alınamaz).
  "Gelişmiş" toggle'ı `col`/`row` için iki serbest metin input'u açar
  (placeholder `"1 / 6"`, backend `@Size(max=20)` dışında kısıtlamıyor).
- **`TextBlockField`**: HEADING/QUOTE/PARAGRAPH ortak tek component —
  görsel farklılaşma `BlockItem`'daki tip rozeti/CSS ile, ayrı dosya
  gerekmez.
- **`ImageBlockField`**: gizli file input + görünür buton → anında
  upload → spinner overlay → önizleme + alt text input.
- **`AddBlockBar`**: 4 buton, `blocks` sonuna ilgili tip için boş obje
  ekler.
- **`MetaPanel`**: sürüklemeyle ilgisiz düz controlled form.

## Hata durumları

Projede kurulu bir hata-gösterim deseni yok (taradım — `ApiError`
sadece `client.js`'te fırlatılıyor, hiçbir yerde yakalanmıyor); bu
sayfaya özel minimal bir yaklaşım kuruluyor, yeni paylaşılan component
icat edilmiyor.

- **Yükleme hatası** (`GET /api/blogs/{id}` 403/404/500): `loadError`
  state, kısa mesaj + "Tekrar dene". 403 → "Bu işlem için yetkin yok".
- **Kaydetme hatası**: Kaydet butonu istek sırasında disabled+spinner
  (çift submit engellenir). `fieldErrors` doluysa üstte liste banner'ı
  (alan-bazlı yerleştirme sonraki iş). 403/network → "Kaydedilemedi,
  tekrar dene", buton yeniden aktif olur.
- **Görsel yükleme hatası**: `ImageBlockField` kendi lokal hatasını
  tutar, diğer bloklar/Kaydet etkilenmez.
- **Sayfadan ayrılma koruması**: `isDirty` boolean (herhangi bir
  state güncellemesinde true, kaydet başarılı olunca false) →
  `beforeunload` + route değişiminde onay.
- Concurrent edit / stale-data: kapsam dışı (tek editör kullanıcı).

## Açık noktalar (bilerek ertelenen)

- Draft listesi UI'ı (v1: doğrudan id ile gidiliyor)
- Alan-bazlı validasyon hata yerleştirme
