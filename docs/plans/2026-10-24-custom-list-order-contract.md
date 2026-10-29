# Özel liste öğe sırası — backend kontratı (öneri)

Durum: FE tarafı hazır (`ListDetail` "Sırala" modu), backend ucu YOK. Bu not
backend'e yazılacak işin tek sayfalık tarifidir. FE, uç yokken 404/405 alırsa
sırayı yalnız oturumda tutar ve kullanıcıya "Sıra kaydedilemedi, yalnız bu
oturumda geçerli." der (`account.listDetail.orderSaveError`).

## Sorun

`GET /api/me/lists/{id}` öğeleri ekleme sırasıyla döndürüyor; öğe sırası için
bir alan ve değiştirme ucu yok (bkz. `2026-08-31-custom-list-detail-design.md`,
Karar #3). Sürükle-bırak sıralama sayfa yenilenince kayboluyor.

## İstenen

1. **Alan:** liste–öğe ilişkisine (SavedItem, `targetListId` ile bir listeye
   bağlı satır) `position` (int, 0'dan başlar, liste içinde benzersiz).
2. **Uç:** `PATCH /api/me/lists/{id}/items/order`
   - Gövde: `{ "savedItemIds": [11, 7, 9] }` — listedeki TÜM öğelerin YENİ sırası.
   - Doğrulama: id'ler tam olarak o listenin öğeleri olmalı (eksik/fazla/başka
     listenin id'si → 400). Yalnız listenin sahibi (401/403/404 mevcut kuralla).
   - Başarı: 204 (gövde yok) ya da güncel liste detayı.
3. **Okuma:** `GET /api/me/lists/{id}` öğeleri `position` artan sırada döndürsün
   (eşitlikte id).
4. **Ekleme:** `POST /api/me/saved-items` ile `targetListId` verilen öğe listenin
   SONUNA eklensin (`position = max + 1`).
5. **Silme:** `DELETE /api/me/saved-items/{id}` sonrası sıra boşluğu kapansın
   (ya da `position` boşluklu kalabilir; yalnız göreli sıra önemli).
6. **Mevcut veri:** var olan öğeler için `position`, eklenme sırasına (id) göre
   backfill edilsin.

## FE sözleşmesi (bugün)

- `reorderListItems(listId, savedItemIds)` → `shared/api/account.js`.
- Kaydet (✓) bu ucu çağırır; hata/404'te sıra oturumda kalır ve uyarı gösterilir.
- Başarıdan sonra FE listeyi yeniden çekmez (zaten yeni sırada).
