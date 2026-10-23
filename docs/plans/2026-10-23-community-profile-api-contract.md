# Community Profil + Kullanıcı Takibi API Contract

Backend'e verilecek sözleşme. Amaç: gerçek kullanıcıların herkese açık profilini görüntülemek ve kullanıcıları takip etmek.

## Mevcut durum (değişmeyecek)

- `GET /api/users/{username}/profile` (public) → `UserProfileResponse{username, bio, avatarUrl, bannerUrl, accentColor, spoilerProtectionEnabled, stats{commentCount, theoryCount, likeCount, readBlogCount, memberSince}}`
- `GET /api/me/profile`, `PATCH /api/me/profile` (AUTH)
- Takip sistemi (`/api/me/follows/{itemType}/{itemId}`) yalnızca `MOVIE | SERIES | BLOG` destekliyor. **Kullanıcı takibi yok.**
- `ThreadSummaryResponse` ve `CommentResponse` içinde `authorId` ve `author` var, ama thread/yorum listelerini yazara göre filtreleme yok.

## Kritik tasarım kararı: USER'ı `SavedItemType`'a EKLEME

`SavedItemType` enum'u UserSavedItem / Like / Follow / Bookmark arasında paylaşılıyor. `USER` eklenirse kullanıcı Watchlist'e, Bookmark'a, Like'a girebilir hale gelir (anlamsız ve doğrulama yükü). Bunun yerine **ayrı bir kullanıcı-takip kaynağı** önerilir (aşağıda). Aynı idempotent desen (Like/Follow) korunur.

> Alternatif: enum'a ekleyip `UserFollowService`'te yalnız follow için kabul etmek. Çalışır ama enum'u kirletir. Backend tercihine bırakıldı; FE sözleşmesi aşağıdaki yollara göre yazılacak.

## 1. Yeni: Kullanıcı takibi

| Metot | Yol | Yetki | Açıklama |
|---|---|---|---|
| `POST` | `/api/me/following/{username}` | AUTH | Takip et. Idempotent. |
| `DELETE` | `/api/me/following/{username}` | AUTH | Takibi bırak. Idempotent. |
| `GET` | `/api/me/following/{username}` | AUTH | Takip durumu. |
| `GET` | `/api/users/{username}/followers` | public | Takipçiler, Pageable. |
| `GET` | `/api/users/{username}/following` | public | Takip ettikleri, Pageable. |

`POST` / `DELETE` / `GET` (durum) yanıtı:

```json
{ "following": true, "followerCount": 42 }
```

Kurallar:
- `userId` JWT'den çözülür, body/path'ten alınmaz.
- Kendini takip etmek → `400`.
- Var olmayan username → `404`.
- Takipçi / takip edilen sıralaması: en yeni takip önce.

Liste yanıtı (`PageResponse<UserSummaryResponse>`):

```json
{
  "content": [
    {
      "username": "arya",
      "avatarUrl": "https://...",
      "bio": "Kısa biyografi",
      "accentColor": "#7C5CFF",
      "following": false
    }
  ],
  "page": 0, "size": 20, "totalElements": 1, "totalPages": 1
}
```

- `following`: isteği yapan oturumdaki kullanıcının bu satırı takip edip etmediği. Oturumsuz istekte her zaman `false`. Böylece listeden doğrudan "Takip Et" butonu çizilir.
- `bio` listede en fazla ilk 160 karakter dönebilir (isteğe bağlı kısaltma).

## 2. Değişiklik: Profil yanıtına sayaç ve izleyici durumu

`GET /api/users/{username}/profile` yanıtına **alan ekleme** (mevcut alanlar aynen kalır):

| Alan | Tip | Not |
|---|---|---|
| `followerCount` | int | |
| `followingCount` | int | |
| `following` | boolean | İstek JWT'li ise izleyicinin bu kullanıcıyı takip edip etmediği, değilse `false`. |
| `isSelf` | boolean | İstek JWT'li ve username izleyiciye aitse `true`. FE "Düzenle" / "Takip Et" ayrımı için kullanır. |

Bu endpoint public kalır; token varsa opsiyonel olarak okunur (yoksa `following=false`, `isSelf=false`).

`GET /api/me/profile` yanıtında da `followerCount` ve `followingCount` bulunsun.

## 3. Değişiklik: Yazara göre filtre

Profil sayfasındaki sekmeler için mevcut listelere `author` sorgu parametresi eklensin.

| Metot | Yol | Yeni parametre | Not |
|---|---|---|---|
| `GET` | `/api/community/threads` | `author={username}` | Mevcut `surface`, sort, Pageable ile birlikte çalışır. Yalnız PUBLISHED. |
| `GET` | `/api/community/feed` | `author={username}` | Aynı. |
| `GET` | `/api/users/{username}/comments` | — | **Yeni.** Kullanıcının yorumları, Pageable, en yeni önce. |

`GET /api/users/{username}/comments` yanıtı `PageResponse<UserCommentResponse>`:

```json
{
  "id": 10,
  "body": "Yorum metni",
  "spoilerFlagged": false,
  "createdAt": "2026-10-20T12:00:00Z",
  "threadSlug": "kuzeyin-sirri",
  "threadTitle": "Kuzeyin sırrı",
  "surface": "THEORY"
}
```

`threadSlug` / `threadTitle` / `surface`, yorumun hangi içeriğe yazıldığını FE'nin link olarak gösterebilmesi için gerekli. Blog yorumlarında bu alanlar `null` olabilir; o durumda ek olarak `subjectType` ve `subjectId` dönsün.

Soft delete edilmiş içerik ve yorumlar listede **görünmez**.

## 3b. Yeni: Kullanıcının herkese açık listeleri

Profildeki Playlists sekmesi için. Bugün FE yalnızca kendi listelerini (`GET /api/me/lists`) çekebiliyor.

| Metot | Yol | Yetki | Açıklama |
|---|---|---|---|
| `GET` | `/api/users/{username}/lists` | public | Yalnız `isPublic=true` ve `listType=CUSTOM` listeler. |

Yanıt `List<UserListSummaryResponse>` (mevcut `/api/me/lists` şekliyle aynı: `id, title, coverImageUrl, listType, itemCount, isPublic, isPinned`). Sistem listeleri (WATCHLIST/READLIST/WATCHED) ve gizli listeler **asla** dönmez. Pinli listeler önce gelsin. Liste detayı için mevcut `GET /api/me/lists/{id}` yalnız sahibine açık; başkasının herkese açık listesinin detayı (`GET /api/users/{username}/lists/{id}`) bu sözleşmenin dışında, ayrı karar.

## 4. Gizlilik

Bu sözleşme tüm profilleri herkese açık varsayıyor. Ayrıca:

- Silinmiş / askıya alınmış kullanıcı → `404`.
- İleride gizli profil gerekirse `UserProfile.isPrivate` eklenir. **Şimdi eklenmesin**, kullanıcıdan karar bekleniyor.

## 5. Hata biçimi

Mevcut `ApiErrorResponse` aynen: `timestamp, status, error, message, path, fieldErrors`.

| Durum | Kod |
|---|---|
| Oturumsuz takip denemesi | `401` |
| Kendini takip | `400` |
| Kullanıcı yok | `404` |
| Geçersiz `author` parametresi (boş string) | `400` |

## 6. Performans notu

`followerCount` / `followingCount`, `UserFollow` tablosundan her istekte `COUNT` yerine denormalize sayaç (ya da indeksli count) ile üretilsin. Profil sayfası ve listeler sık çağrılacak. `(followerId, followedUserId)` benzersiz indeks şart.

## 7. Username kuralları (FE'nin dayandığı varsayımlar)

Profil adresi `/community/u/{username}` olarak kuruldu; FE `username`'i `encodeURIComponent` ile URL'e koyar.

- `username` benzersiz olmalı.
- `GET /api/users/{username}/profile` aramasında büyük/küçük harf duyarsız eşleşme önerilir (`Abidin` ve `abidin` aynı profile gitsin). Yanıttaki `username` her zaman kayıtlı yazımıyla dönsün.
- Thread ve yorum yanıtlarındaki `author` alanı bu `username` ile birebir aynı olmalı (FE profil linkini `author`'dan üretiyor). `author` boşsa FE link vermez.

## Özet: backend'den istenenler

| # | İş | Tür | Öncelik |
|---|---|---|---|
| 1 | `POST/DELETE/GET /api/me/following/{username}` | Yeni | Yüksek |
| 2 | `GET /api/users/{username}/followers` ve `/following` | Yeni | Yüksek |
| 3 | Profil yanıtına `followerCount`, `followingCount`, `following`, `isSelf` | Alan ekleme | Yüksek |
| 4 | Thread / feed listelerine `author` filtresi | Parametre | Orta |
| 5 | `GET /api/users/{username}/comments` | Yeni | Orta |
| 6 | `GET /api/users/{username}/lists` (yalnız herkese açık CUSTOM) | Yeni | Orta |

## FE durumu

- Public profil sayfası hazır: `/community/u/:username` (mevcut `GET /api/users/{username}/profile` ile gerçek veri gösteriyor). Thread yazarlarının adı ve avatarı bu sayfaya link veriyor.
- Backend'den gelmesi beklenen kısımlar için FE tarafında şu an gizli/boş duran yerler: Takip Et butonu, takipçi/takip sayaçları, Comments sekmesi, başkasının Playlists sekmesi.
- Bu sözleşme tamamlanınca FE tarafında eklenecek fonksiyonlar (`shared/api/account.js`): `followUser`, `unfollowUser`, `getFollowers`, `getFollowing`, `getUserComments`, `getUserLists`.
