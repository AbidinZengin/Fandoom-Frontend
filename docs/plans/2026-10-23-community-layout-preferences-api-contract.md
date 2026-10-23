# Community Layout Tercihleri API Contract

Backend'e verilecek sözleşme. Amaç: kullanıcının Community sayfasındaki 3 kolonlu düzenini (sol/sağ kolon genişliği, kapalı/açık/ray durumu) hesabına kaydetmek, böylece cihaz değiştirince aynı düzen gelsin.

## Arka plan

Community sayfası Spotify gibi sürüklenebilir 3 kolona geçiyor: sol kolon (kişisel/kütüphane), ortadaki akış, sağ kolon (keşif). Kullanıcı kolonları sürükleyerek boyutlandırır, kapatıp açar, sol kolonu yalnız ikonların kaldığı dar bir **ray** moduna alabilir.

FE tercihleri önce tarayıcıda (`localStorage`) tutar, ilk boyama oradan gelir. Oturum açıksa sunucudaki kopyayla eşitler. **Oturumsuz kullanıcı için backend'e hiçbir istek atılmaz.**

## Mevcut durum (değişmeyecek)

- `GET /api/me/profile`, `PATCH /api/me/profile` (AUTH). Profil yanıtındaki `spoilerProtectionEnabled` gibi tercih alanlarına bu sözleşme dokunmaz.
- Kullanıcıya bağlı genel bir tercih/ayar deposu yok.

## 1. Yeni: Layout tercihi

| Metot | Yol | Yetki | Açıklama |
|---|---|---|---|
| `GET` | `/api/me/preferences/community-layout` | AUTH | Kayıtlı tercihi döner. Kayıt yoksa `204 No Content` (gövde yok). |
| `PUT` | `/api/me/preferences/community-layout` | AUTH | Tercihi **tam olarak** yazar (upsert, idempotent). |

`userId` JWT'den çözülür, path ve body'den alınmaz.

### Yanıt ve istek şekli

`GET` (kayıt varsa) ve `PUT` aynı yanıt şeklini döner:

```json
{
  "leftWidth": 260,
  "rightWidth": 280,
  "leftMode": "full",
  "rightMode": "full",
  "updatedAt": "2026-10-23T22:41:07.123Z"
}
```

`PUT` isteği (`updatedAt` gönderilmez, sunucu üretir):

```json
{ "leftWidth": 260, "rightWidth": 280, "leftMode": "rail", "rightMode": "hidden" }
```

### Alanlar ve doğrulama

| Alan | Tip | Kural | Varsayılan |
|---|---|---|---|
| `leftWidth` | int (px) | `200`-`420`. `leftMode = rail` iken de **son açık genişlik** saklanır (kolon tekrar açılınca o genişliğe döner). | `260` |
| `rightWidth` | int (px) | `240`-`420` | `280` |
| `leftMode` | enum | `full` \| `rail` \| `hidden` | `full` |
| `rightMode` | enum | `full` \| `hidden` | `full` |

- Tüm alanlar **zorunludur** (PUT tam yazar, kısmi güncelleme yok). Eksik alan `400`.
- Aralık dışı sayı ya da bilinmeyen enum değeri → `400` + `fieldErrors` (mevcut hata biçimiyle aynı: `{ message, fieldErrors: { leftWidth: "..." } }`).
- Bilinmeyen ek alanlar sessizce yok sayılır, saklanmaz.
- Ray genişliği (72px) FE sabitidir, backend'e yazılmaz ve doğrulanmaz.

### Yanıt kodları

| Durum | Kod |
|---|---|
| Başarılı `GET` (kayıt var) | `200` |
| Başarılı `GET` (kayıt yok) | `204` |
| Başarılı `PUT` | `200` + yazılan kayıt |
| Oturumsuz | `401` |
| Doğrulama hatası | `400` + `fieldErrors` |

## 2. Çakışma kuralı: son yazan kazanır

- `updatedAt` her `PUT`'ta **sunucu saatiyle** yazılır (istemci saatine güvenilmez).
- FE, aldığı son `updatedAt`'i yerelde saklar. Açılışta sunucu kaydı yerelden yeniyse sunucudakini uygular, yerel değişiklik eşitlenmemişse (çevrimdışı) onu `PUT` ile gönderir.
- İki cihaz aynı anda yazarsa sonuncunun `PUT`'u geçerli kalır. Sürüm/ETag kontrolü **istenmiyor** (tercih verisi, kaybı önemsiz).

## 3. Depolama önerisi

Başka tercihler de gelebileceği için genel bir tablo önerilir:

```
user_preference(
  id,
  user_id      -> users.id  (ON DELETE CASCADE),
  pref_key     varchar(64)  not null,
  value_json   json/text    not null,
  updated_at   timestamp    not null,
  unique (user_id, pref_key)
)
```

- `pref_key` serbest metin olmamalı. **İzinli anahtarlar enum/allowlist ile** tutulsun, şimdilik tek değer: `community-layout`. Aksi halde herhangi bir anahtara keyfi veri yazılabilir.
- Yol `/api/me/preferences/{key}` genel deseni izler; yeni tercih gelince yeni anahtar + kendi doğrulaması eklenir. Bu sözleşme yalnız `community-layout`'u tanımlar.
- `value_json` boyutu küçük (birkaç yüz bayt). Yine de **1 KB üstü gövde `400`** ile reddedilsin.
- Flyway migration: yeni tablo, yalnız ekleme. Mevcut tablolara dokunmaz.

## 4. Performans ve yazma sıklığı

- FE `PUT`'u sürükleme sırasında DEĞİL, yalnızca **bırakma anında** ve en erken 1 sn debounce ile atar. Yani kullanıcı başına dakikada en fazla birkaç istek beklenir.
- Yine de bu uca **kullanıcı başına hız sınırı** (örn. dakikada 30) konulması önerilir.
- `GET` yalnız Community sayfası açılışında bir kez çağrılır.

## 5. Güvenlik notları

- Kullanıcı yalnız **kendi** tercihini okur/yazar (`/me/...`), başka kullanıcıya erişim yok.
- Değerler yalnızca doğrulanmış sayı ve enum'dur, HTML/serbest metin saklanmaz.

## Özet: backend'den istenenler

| # | İş | Tür | Öncelik |
|---|---|---|---|
| 1 | `user_preference` tablosu (Flyway migration) | Yeni | Yüksek |
| 2 | `GET /api/me/preferences/community-layout` (200 / 204) | Yeni | Yüksek |
| 3 | `PUT /api/me/preferences/community-layout` (tam yazma, doğrulama, `updatedAt`) | Yeni | Yüksek |
| 4 | İzinli anahtar listesi + 1 KB gövde sınırı | Güvenlik | Yüksek |
| 5 | Uç başına hız sınırı | Koruma | Orta |

## FE durumu

- Henüz yazılmadı. FE tarafı bu sözleşmeden bağımsız çalışır: tarayıcı kaydı (`localStorage`) ilk aşamada tek başına yeterlidir, hesapla eşitleme bu uçlar hazır olunca devreye girer.
- FE'de eklenecek fonksiyonlar (`shared/api/account.js`): `getMyLayoutPrefs` (204'te `null`), `putMyLayoutPrefs`.
- Backend canlıya çıkmadan FE eşitleme kodu kapalı tutulur (uç 404 verirse sessizce yerel kayda düşer).
