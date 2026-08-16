# PageBuilder — Geri Yazma Geçmişi + Geri Al

## Context

PageBuilder'ın PUT/POST geri yazma özelliği (bkz. entity binding + PUT/POST
planı) canlı backend'e karşı doğrulandı — bağlı bir block'un içeriği
"Backend'e Kaydet" ile gerçek kayda yazılıyor. Kullanıcı, yanlışlıkla
yapılan bir kaydetmeyi (yanlış değer, yanlış alan) fark edip geri
alabileceği bir güvenlik ağı istedi: session boyunca yapılan tüm
"Backend'e Kaydet" işlemlerinin bir listesi + her biri için "Geri Al"
butonu, LeftPanel'in sol ikon şeridinde yeni bir sekme olarak.

## Kararlar (kullanıcı onaylı)

1. **Depolama: sadece bellekte, session-only.** Sayfa yenilenince liste
   kaybolur — ekstra persistans/temizleme karmaşıklığı yok, zaten "az önce
   yanlışlıkla değiştirdim" senaryosunu karşılıyor.
2. **Geri al kapsamı: sadece en son kayıt aktif.** Aynı
   `(entityType, entityId, field)` üçlüsü birden fazla kaydedilmişse, o
   üçlü için SADECE en yeni giriş "Geri Al" edilebilir — daha eski girişler
   pasif/soluk görünür (hangi state'in "şu an" olduğu konusunda kafa
   karışıklığı olmasın).
3. **Geri alma hem backend'i hem canvas'ı senkronlar.** Sadece backend
   kaydı eski değere dönmüyor — block hâlâ canvas'ta ve hâlâ aynı
   (entityType,entityId,field)'a bağlıysa `block.content` da eski değere
   güncellenir.

## Mimari

- **Yeni store: `src/shared/builder/writebackHistoryStore.js`** — ayrı,
  KÜÇÜK bir zustand store (canvas'ın `store.js`'indeki zundo-tracked
  undo/redo sisteminden BİLİNÇLİ BAĞIMSIZ — bu geçmiş "backend'e ne
  yazıldı" kaydı, canvas düzenleme geçmişi değil, ikisi karışmamalı).
  Şekil:
  ```js
  {
    entries: [{
      id, entityType, entityId, field, blockId,
      previousValue, newValue, savedAt, // Date.now()
      status: 'active' | 'stale' | 'reverted',
    }, ...], // en yeni başta (unshift)
    addEntry(entry) {
      // aynı (entityType,entityId,field) için var olan 'active' girişi
      // 'stale' yapar, yenisini 'active' olarak ekler
    },
    markReverted(id) { ... },
  }
  ```
- **`entityWriteback.js` genişletmesi:**
  - `saveBoundField` zaten `resolveBinding(cached, field)` ile "önceki
    değeri" hesaplayabilir (mevcut `cached` zaten elde) — PUT başarılı
    olunca `writebackHistoryStore.addEntry({...})` çağrılır.
  - Yeni `revertWritebackEntry(entry, patchBlockContent)` fonksiyonu:
    `saveBoundField`'la BİREBİR aynı body-filtreleme mantığını
    `previousValue` ile çalıştırır, PUT atar, cache'i günceller,
    `writebackHistoryStore.markReverted(entry.id)` çağırır. `blockId`'si
    hâlâ canvas'ta olan VE hâlâ aynı entity/field'a bağlı bir block'a
    denk geliyorsa, çağırana (`patchBlockContent` callback) block içeriğini
    eski değere yazmasını söyler.
- **`LeftPanel.jsx`:** rail'e 5. ikon (`IconHistory` — yeni, `icons.jsx`'e
  eklenir), `panelTab === 'history'` durumunda `WritebackHistoryPanel`
  render eder.
- **Yeni `WritebackHistoryPanel.jsx`** (LeftPanel altında, CodegenPanel'in
  yanına): `writebackHistoryStore.entries`'i listeler — her satır
  `{Entity label} #{id} · {field}: "{previousValue}" → "{newValue}"` +
  görece zaman (`"2 dk önce"`) + "Geri Al" butonu (`status !== 'active'`
  ise disabled). Tıklanınca `revertWritebackEntry` çağrılır, blok
  bulunursa `updateBlock(blockId, { content: {...} })` ile canvas
  senkronlanır.
- **`PageBuilder.jsx`:** `revertWritebackEntry`'nin `patchBlockContent`
  callback'i buradan geçirilir (`blocks[blockId]` var mı kontrolü +
  `updateBlock` çağrısı) — store zaten `useBuilderStore` olarak burada
  mevcut.

## Doğrulama (2026-08-16, canlı test — TAMAMLANDI)

- Bir block'u LoreCategory #1'e bağla, aynı alanı 2 kez farklı değerle
  kaydet → geçmiş panelinde 2 giriş, sadece EN SON'un "Geri Al"ı aktif,
  öncekinde "Eskimiş" rozeti — ✅ doğrulandı.
- Geri Al'a bas → network'te ters `PUT /lore/categories/1` 200 döndü,
  giriş "Geri alındı" oldu, buton disable'landı — ✅ doğrulandı.
- Gerçek backend değeri GET ile teyit edildi, test verisi ("Houses
  TEST-REVERT") normal bir "Backend'e Kaydet" ile orijinal değere
  ("Houses") geri döndürülüp temizlendi.
- `npm run lint` + `npm run build` temiz.

**Ek bulgu (kapsam dışı ama testi engelliyordu, düzeltildi):**
`FloatingToolbar.jsx`'in `TOOL_ICONS` haritası BUTTON/LOGO/ICON tool
tiplerini içermiyordu (bu oturumdan önce başka bir yerde eklenen 3 yeni
component tipi) — `<Icon />` `undefined` olunca PageBuilder tamamen
çöküyordu ("düzenleyici durumu bozuldu"). `IconButtonTool`/`IconLogoTool`/
`IconStarTool` haritaya eklendi (zaten `icons.jsx`'te ve `LeftPanel.jsx`'te
mevcuttu, sadece FloatingToolbar'a eklenmemişti).
- `npm run lint` + `npm run build` temiz.
