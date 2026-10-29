# Video API Contract

Backend'e verilecek sözleşme. Kaynak: `src/pages/Movies/TheLighthouse/VideoSection/VideoSection.data.js` (şu an MOCK).

FE'nin kullandığı alanlar: `id`, `youtubeId`, `title`, `channelName`, `channelUrl`. Kapak görseli `youtubeId`'den FE'de türetilir, yani backend'de depolanacak görsel yok (Cloudinary gerekmez). Sıra, dizideki sıradır.

## Entity: `Video`

| Alan | Tip | Zorunlu | Not |
|---|---|---|---|
| `id` | long | otomatik | Mock'taki `lighthouse-trailer` gibi string slug değil, sayısal id olabilir. FE sadece `key` olarak kullanıyor. |
| `productionId` | long | evet | Hangi film/dizi. Series sayfaları da aynı bileşeni kullanıyor, bu yüzden film'e özel tablo olmasın. |
| `youtubeId` | string(11) | evet | Regex `^[A-Za-z0-9_-]{11}$`. `(productionId, youtubeId)` benzersiz. |
| `title` | string(255) | evet | YouTube başlığı olduğu gibi, çevrilmez. |
| `channelName` | string(120) | evet | |
| `channelUrl` | string(500) | evet | Sadece `https://` kabul edilsin, dışarı `rel="noopener"` ile açılıyor. |
| `sortOrder` | int | evet | Küçük olan önce. Varsayılan: sona ekle. |
| `createdAt` / `updatedAt` | timestamp | otomatik | |

`kind` (TRAILER, INTERVIEW vb.) gibi bir alanı FE şu an kullanmıyor, eklenmesin. İhtiyaç olunca eklenir.

## Endpoint'ler

| Metot | Yol | Yetki | Açıklama |
|---|---|---|---|
| `GET` | `/api/productions/{slug}/videos` | public | `sortOrder` artan sıralı dizi döner. |
| `POST` | `/api/productions/{slug}/videos` | EDITOR+ | Tek video ekler. |
| `PUT` | `/api/videos/{id}` | EDITOR+ | `title`, `channelName`, `channelUrl`, `sortOrder` günceller. `youtubeId` değişmesin; değişecekse sil ve yeniden ekle. |
| `DELETE` | `/api/videos/{id}` | EDITOR+ | Hard delete yeterli, bağlı medya yok. |

> Yol önekini (`/api/productions/{slug}` mı, `/api/movies/{slug}` mi) mevcut backend düzenine göre netleştirin; FE tarafından doğrulanmadı.

## Response örneği

```json
[
  {
    "id": 1,
    "youtubeId": "Hyag7lR8CPA",
    "title": "The Lighthouse | Official Trailer HD | A24",
    "channelName": "A24",
    "channelUrl": "https://www.youtube.com/@A24",
    "sortOrder": 0
  }
]
```

`productionId` response'ta zorunlu değil (URL'den biliniyor), FE okumuyor.

## Request (POST)

```json
{
  "youtubeId": "Hyag7lR8CPA",
  "title": "The Lighthouse | Official Trailer HD | A24",
  "channelName": "A24",
  "channelUrl": "https://www.youtube.com/@A24",
  "sortOrder": 0
}
```

## Hata durumları

- `400`: geçersiz `youtubeId` / `channelUrl` formatı.
- `404`: production bulunamadı.
- `409`: aynı production'da aynı `youtubeId` zaten var.
- Hiç video yoksa `200` ve `[]` dönsün (FE bölümü gizleyecek).

## Opsiyonel kolaylık

Admin'in sadece YouTube linkini yapıştırıp `title` / `channelName` / `channelUrl` alanlarını YouTube oEmbed'den doldurması mümkün. Mock'taki veri zaten oEmbed'den alınmıştı. Bunu backend yaparsa admin formu çok sadeleşir.

## Seed (The Lighthouse, mevcut mock)

| sortOrder | youtubeId | title | channelName | channelUrl |
|---|---|---|---|---|
| 0 | `Hyag7lR8CPA` | The Lighthouse \| Official Trailer HD \| A24 | A24 | https://www.youtube.com/@A24 |
| 1 | `O9ukjPF3YdA` | Robert Pattinson & Willem Dafoe talk The Lighthouse \| Film4 Interview Special | Film4 | https://www.youtube.com/@Film4YouTube |
| 2 | `8fV8KFWXWWU` | Making The Lighthouse: Robert Pattinson, Willem Dafoe and Robert Eggers \| On Acting | BAFTA Guru | https://www.youtube.com/@baftaguru |
| 3 | `xutnBvTmDq4` | The Lighthouse Analysis: Horror in Folklore | The Film Essay | https://www.youtube.com/@thefilmessay9832 |

## FE tarafı (backend hazır olunca)

`VideoSection.data.js` içindeki `getVideos()` API çağrısına dönüşür. `VideoSection.jsx` şu an `getVideos()`'i senkron çağırıyor; asenkron olunca yüklenme ve boş durumu için küçük bir değişiklik gerekir. Ayrı küçük görev.
