# Arama: k6 yük testi notu

**Durum:** Referans notu (2026-10-16). Bağlayıcı checklist değil; k6 işine
başlanınca buradan yola çıkılır. Sözleşme: `docs/plans/2026-10-15-unified-search-design.md`
(FE özeti: arama API sözleşmesi taslağı).

## Neden burası

- Quick search her istekte 6 türü birden tarar (MOVIE, SERIES, CHARACTER,
  PERSON, PORTAL, BLOG). Tek istek = 6 sorgu.
- Eşleşme "içinde geçen" (`%q%`): klasik indeks kullanılamaz, tablo büyüdükçe
  tarama maliyeti doğrusal artar.
- Header'daki kutu her sayfada var; yazarken (300ms debounce) kullanıcı başına
  birkaç istek düşer. Trafiğin en sık çağrılan ucu olmaya aday.
- Yoğunlukta bir tür zamanında dönmezse **sessizce boş** döner, yanıtta bunu
  söyleyen alan yok. Yani bozulma hata olarak değil "eksik sonuç" olarak görünür.

## Uçlar

| Uç | Önbellek | Not |
|---|---|---|
| `GET /api/search/quick?q=` | 1 saate kadar | Tür başına max 5, sonuçsuz grup yanıtta yok |
| `GET /api/search/{movies,series,characters,people,portals,blogs}?q=&page=&size=` | yok | `size` max 50, `PageResponse` |

Hepsi public, token gerekmez. `Accept-Language: tr | en`.

## Senaryo fikirleri

1. **Yazma simülasyonu (quick):** gerçek kullanıcı gibi önek dizisi
   (`du` → `dun` → `dune`), istekler arası ~300ms+. En gerçekçi senaryo.
2. **Önbellek isabeti vs ıskası:** aynı popüler sorgular (sıcak) ile her
   seferinde benzersiz sorgular (soğuk, rastgele 3-6 harf) ayrı koşulsun.
   Soğuk senaryo asıl DB yükünü gösterir.
3. **Full search sayfalama:** tür başına `page` 0..N, `size` 20 ve 50.
   Önbellek yok, her istek DB'ye gider.
4. **Admin araması:** admin listesi de artık `/api/search/{series,movies}`
   kullanıyor; düşük hacim ama aynı uçlar.
5. **Karışık dil:** `Accept-Language` tr/en dağıtılsın (önbellek anahtarı
   dile göre bölünüyorsa isabet oranı düşer, kontrol edilmeli).

## Kenar durumları (fonksiyonel check, yük değil)

- `q` < 2 karakter → `200`, `groups: []`
- `q` = 100 karakter → `200`; 101 karakter → `400`
- `%` ve `_` joker değil, literal aranmalı
- Baş/son boşluk kırpılır, büyük/küçük harf duyarsız

## Ölçülecekler

- `http_req_duration` p95 / p99: quick ve full ayrı tag'lerle
- Hata oranı (`http_req_failed`), özellikle 5xx
- **Sessiz eksik sonuç:** bilinen bir sorgu için (ör. 6 türde de sonucu olan)
  beklenen grup sayısı baseline'ı alınır; yük altında `groups.length` bu
  sayının altına düşerse ayrı bir `Counter`/`Rate` metriğine yazılır. Bu
  olmadan timeout'lar testte görünmez.
- Önbellek isabet oranı (backend metrikleri / log)

## Açık sorular (k6'ya başlarken netleşecek)

- Tür başına zaman aşımı değeri ne? (Eşik belirlemek için gerekli.)
- Önbellek anahtarı `q` + dil mi? Normalize edilmiş `q` mu?
- Hedef: kaç eşzamanlı kullanıcı / saniyede kaç istek? p95 hedefi?
- Test ortamı: lokal mi, staging mi? Seed veri hacmi gerçekçi mi (tarama
  maliyeti satır sayısına bağlı)?
- Rate limit var mı / olacak mı?
