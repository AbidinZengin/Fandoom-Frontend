# Backend İhtiyacı: `season.seasonBlocks[]`

> Referans notu — bağlayıcı checklist değil. Backend ekibine iletilecek
> ilk taslak. Frontend tarafı: `src/pages/series/BreakingBad/SeasonDetail/
> SeasonStory/` (5 sezon içeriği zaten hazır, `SeasonStory.data.js`'te
> mock olarak duruyor — şema açılınca taşınacak).

## Neden

`episode.episodeBlocks[]` deseni (bölüm-seviyesi derin analiz) zaten
üretimde — PageBuilder generic builder üzerinden PUT/POST'a bağlı,
TR/EN ikiz alanlarla. Aynı içerik türü **sezon seviyesinde** de var
(Breaking Bad 1-5 arası "derin okuma" sayfaları) ama backend'de
karşılığı yok — şu an frontend'e gömülü mock veri. Hacim büyüdükçe
(daha fazla yapım/sezon eklendikçe) bunun client bundle'a gömülü
kalması ölçeklenmiyor; `episodeBlocks[]` deseninin sezon seviyesine
taşınmasını istiyoruz.

## 0. İsimlendirme — açıkça talep

`episodeBlocks` alanı **olduğu gibi kalsın**, Episode entity'sine
özel. Bunu Season'a taşırken aynı adı paylaştırmıyoruz/yeniden
kullanmıyoruz — sezon içeriği için kendi adını taşıyan, ayrı bir alan
istiyoruz: **`seasonBlocks`**. İki entity iki farklı array field'a
sahip olacak (`episode.episodeBlocks[]`, `season.seasonBlocks[]`),
aynı array'in paylaştırılması/overload edilmesi değil.

## 1. `Season` entity'sine yeni skaler alanlar

`Episode`'daki `storyKicker/storyTitle/storyThesis` karşılığı, ama
**bu sefer üç yönlü** (Episode'da `*En` eksikti, bu bir eksiklikti —
sezon seviyesinde tekrarlamayalım):

| Alan | Not |
|---|---|
| `storyKicker` / `storyKickerTr` / `storyKickerEn` | Kısa etiket — "DEEP READING · SEASON 1" |
| `storyTitle` / `storyTitleTr` / `storyTitleEn` | Başlık |
| `storyDek` / `storyDekTr` / `storyDekEn` | Tek cümlelik alt başlık |

## 2. `season.seasonBlocks[]` — child array

`episodeBlocks[]` ile birebir aynı mekanik (ardışık aynı `sceneKey` =
tek bölüm/section, `orderIndex` sırayla gelir, generic builder
`blockList` deseniyle uyumlu):

| Alan | Tip | Not |
|---|---|---|
| `blockType` | enum | `LEDE_TEXT`, `SECTION_HEADING`, `SECTION_TEXT`, `SECTION_LEAD_TEXT`, `QUOTE`, `VERDICT_TEXT` |
| `sceneKey` | string | Aynı section'a ait bloklar aynı key'i paylaşır |
| `orderIndex` | int | Sıralama |
| `content` / `contentTr` / `contentEn` | text | Blok gövdesi |
| `mediaEpisodeRef` | int (nullable) | **Yeni ihtiyaç, aşağıda** |
| `mediaCaption` / `mediaCaptionTr` / `mediaCaptionEn` | text | Fotoğraf altyazısı |
| `mediaCredit` | text | Sabit değer (ör. "AMC") |

## 3. Yeni alan tipi: `mediaEpisodeRef` (görsel yükleme YOK)

`episodeBlocks[]`'taki `mediaUrl` doğrudan bir Cloudinary yüklemesi
varsayıyor. Sezon sayfalarında bilerek **yeni görsel yüklenmiyor** —
zaten var olan bölüm fotoğrafları (`episode.stillImageUrl`) farklı
bir bağlamda tekrar kullanılıyor (bkz. `SeasonStory.jsx` — sahte
görsel/URL yok prensibi). Bu yüzden `mediaUrl` yerine bir
`mediaEpisodeRef: <episodeNumber>` alanına ihtiyaç var — frontend bu
numarayla o sezonun zaten çekilmiş `episodes[]` listesinden ilgili
`stillImageUrl`'i eşleştiriyor. Bu, Cloudinary'ye yeni bir yazma/
yükleme akışı GEREKTİRMİYOR, sadece bir referans/foreign-key alanı.

## 4. API sözleşmesi

`episodeBlocks[]` deseninin aynısı: `GET /api/seasons/:id` tek
çağrıda `seasonBlocks[]`'ı inline döndürmeli (N+1 sorgu riski
olmasın). PUT/POST, PageBuilder generic builder'ın `blockList`
deseniyle uyumlu olmalı (bkz. `entitySchemas.js` içindeki
`episode.blockList` tanımı — aynı şekli birebir sezon için de
istiyoruz).

## 5. Migrasyon

5 sezonun tam içeriği zaten yazılı ve doğrulanmış durumda
(`docs/content/breaking-bad-s{1..5}-*.md` + `SeasonStory.data.js`).
Şema açılınca taşıma bir veri dönüşümü (mevcut `sections[]`/`lede[]`/
`verdict[]` yapısını yukarıdaki `seasonBlocks[]` şekline map'lemek),
yeniden yazım değil.
