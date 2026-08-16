# Fandoom Çok Dilli (TR/EN) Mimari — Backend Gereksinim Dokümanı

> Bu doküman kullanıcı tarafından **backend tarafına iletilmek üzere** yazıldı.
> Tüm mimari kararlar onaylandı, çeviri matrisi kapandı.

## Context

Fandoom yayına çıkacak gerçek bir fan platformu. Proje büyümeden önce
çok dillilik (TR/EN) kararının verilmesi gerekiyor.

Geri dönüşü pahalı olan şey içeriğin kendisi değil, **şema + URL yapısı**.
İçerik çevirisi sonsuza dek ertelenebilir; kolon yapısı ve URL stratejisi
yayına çıktıktan sonra değiştirilirse SEO bir kez yanar. Bu yüzden karar
şimdi alınıyor, içerik doldurma işi sonraya bırakılabiliyor.

## Onaylanan Mimari Kararlar

### K1 — Dil ilişkisi: TAM AYNA
Her çevrilebilir alan iki dilde de dolu olmak zorunda. İki dil dolmadan
`PUBLISHED` olunamaz.

- Dile göre **ayrı yayın durumu gerekmez** — tek `status` alanı yeterli.
- "Ayrı kayıt + translationGroupId" modeli bu yüzden **elendi**.
- Fallback zinciri mimari zorunluluk değil; yalnızca TMDB'den gelen eksik
  veriler için savunma katmanı olarak kalır.

### K2 — Dil ufku: KALICI OLARAK SADECE TR + EN
Üçüncü dil planı yok → **kolon ikizleme** seçildi, translation side-table
elendi (N dil esnekliğinin bu projede karşılığı yok, bedeli join maliyeti).

- Her çevrilebilir alan aynı satırda iki kolon: `title_tr` / `title_en`.
- Tam ayna kuralı `NOT NULL` ile **DB seviyesinde** zorlanabilir.
- Okumalarda join yok; mevcut repository yapısı korunur.
- Kabul edilen bedel: 3. dil gelirse çok sayıda tabloda migration.

### K3 — URL: HER İKİ DİL DE ÖN EKLİ, SLUG ORTAK
```
/tr/blog/red-wedding        → Türkçe
/en/blog/red-wedding        → İngilizce
/tr/series/game-of-thrones
/en/series/game-of-thrones
/                           → yönlendirme → /tr veya /en
```
- **Slug çevrilmez** — tek `slug` kolonu, İngilizce kalır. `slug_tr`/`slug_en`
  YOK. Backend'de slug ile ilgili hiçbir şey değişmez.
- hreflang çifti simetrik kurulur, iki sürüm de indekslenir.
- Mevcut ön eksiz linkler (`/blog/...`) `/tr/...`'ye 301 ile yönlendirilir.

### K4 — Kapsam: ÖZEL İSİMLER VE TAG'LER HARİÇ HER GÖRÜNÜR METİN
Çizgi şurada: **özel isim mi, yoksa okunacak/anlaşılacak metin mi?**

- Çevrilir: anlatı metinleri, başlıklar, tür (genre) etiketleri, a11y metinleri.
- Çevrilmez: karakter/mekan/topluluk/olay/kişi isimleri, tag'lar, slug'lar,
  teknik alanlar.
- **Tag'lar tamamen İngilizce kalır** — `tag` tablosuna hiç dokunulmaz.

## Alan-Alan Çeviri Matrisi

Aşağıdaki alanlar `_tr` / `_en` çiftine dönüşecek. Listelenmeyen her alan
**olduğu gibi kalır**.

### Çevrilecek

| Entity | Alan | Gerekçe |
|---|---|---|
| `Blog` | `title`, `kicker`, `axis`, `imageAlt` | Editöryel başlık + anlatı + a11y |
| `BlogBlock` | `text`, `imageAlt` | Ana anlatı gövdesi |
| `Episode` | `title`, `synopsis`, `storyKicker`, `storyTitle`, `storyThesis` | Bölüm adı + editöryel analiz katmanı |
| `EpisodeBlock` | `sceneKicker`, `content`, `mediaAlt` | Sahne anlatısı |
| `Series` | `title`, `synopsis` | TMDB TR başlığı + özet |
| `Movie` | `title`, `synopsis` | TMDB TR başlığı + özet |
| `Season` | `title` | "Sezon 3" / "Season 3" |
| `Genre` | `name` | Arayüzde filtre etiketi, TMDB iki dilde veriyor |
| `Character` | `description`, `quote` | Karakter anlatısı (`name` çevrilmez) |
| `Person` | `bio` | Biyografi anlatısı (`name` çevrilmez) |
| `Location` | `description` | Lore anlatısı (`name` çevrilmez) |
| `Event` | `description` | Lore anlatısı (`name` çevrilmez) |
| `Franchise` | `description` | Tanıtım anlatısı (`name` çevrilmez) |
| `HomeBlock` | `contentValue`, `altText` | CMS arayüz metni (yalnız `contentType = TEXT`) |

### Çevrilmeyecek (açıkça)

| Alan grubu | Örnek | Gerekçe |
|---|---|---|
| Tüm `slug` alanları | `blog.slug`, `character.slug`, `genre.slug` | K3 — ortak, İngilizce |
| `Tag` tablosunun tamamı | `name`, `slug`, `description` | K4 — tag'lar İngilizce |
| Özel isimler | `Character.name`, `Location.name`, `Group.name`, `Person.name`, `Franchise.name`, `Event.name` | Fandom bu isimleri İngilizce kullanır |
| `originalTitle` | `Series.originalTitle`, `Movie.originalTitle` | Zaten "orijinal" başlık — tanımı gereği tek dil |
| Teknik/medya alanları | `imageUrl`, `posterUrl`, `trailerUrl`, `mediaRatio`, `col`, `row`, `imdbId`, `contentRating`, `originCountry`, `originalLanguage` | Dilden bağımsız |
| Yapısal anahtarlar | `EpisodeBlock.sceneKey`, `customFields` | Kod anahtarı, içerik değil |
| Kimlik/güvenlik | `User.*`, `RevokedToken.*` | İçerik değil |

**Bilinçli kabul edilen iki tutarsızlık** (kullanıcı seçenekleri görerek seçti):
1. Başlıklar çevriliyor ama slug İngilizce kalıyor →
   `/tr/series/game-of-thrones` adresinde sayfa başlığı "Taht Oyunları".
2. Genre çevriliyor ama tag'lar İngilizce kalıyor → filtre panelinde
   "Dram" ile "spoiler-free" yan yana görünebilir.

## Şema Deseni

Her çevrilecek alan için tek desen:

```sql
-- Örnek: blog tablosu
ALTER TABLE blog RENAME COLUMN title TO title_tr;
ALTER TABLE blog ADD COLUMN title_en VARCHAR(...) NULL;
-- ... içerik doldurulduktan SONRA:
ALTER TABLE blog ALTER COLUMN title_en SET NOT NULL;
```

Entity tarafı:
```java
@Column(name = "title_tr", nullable = false)
private String titleTr;

@Column(name = "title_en", nullable = false)
private String titleEn;
```

## Migration Stratejisi (kritik — tek adımda yapılamaz)

Mevcut veri tamamen Türkçe olduğu için üç aşamalı ilerlemek zorunlu:

1. **Aşama 1 — Yeniden adlandır + nullable ekle**
   Mevcut kolonlar `_tr` olur (veri zaten TR, kayıp yok), `_en` kolonları
   `NULL` olarak eklenir. Bu aşamada tam ayna kuralı ZORLANMAZ.
2. **Aşama 2 — İçerik doldurma**
   EN karşılıkları girilir. TMDB kaynaklı alanlar (`title`, `synopsis`,
   `Genre.name`) TMDB'nin `language=en-US` / `tr-TR` çağrılarıyla otomatik
   doldurulabilir; editöryel alanlar elle/destekli yazılır.
3. **Aşama 3 — NOT NULL kısıtı + publish doğrulaması**
   `_en` kolonlarına `NOT NULL` eklenir, publish akışına iki-dil kontrolü
   konur.

Depoda `contentblock_migration.sql` ve `lore_migration.sql` örnekleri
mevcut — aynı desen izlenebilir.

## API Kontratı — FE'yi Neredeyse Hiç Değiştirmeyen Yaklaşım

**Bu, dokümanın en önemli maddesi.** Entity iki dil tutar ama **public API
DTO'su tek dil döner**:

- İstek dili `Accept-Language` header'ı ile gelir (öneri) veya `?lang=tr`.
- Servis katmanı, locale'e göre `titleTr` veya `titleEn`'i seçip DTO'nun
  **tek `title` alanına** koyar.
- **Response şekli bugünkiyle birebir aynı kalır.**

Kazanç: frontend'de `src/shared/api/*` altındaki tüm çağrılar, tüm
component'ler, tüm `.data.js` dosyaları **olduğu gibi çalışır**. FE'de
değişen tek yer `src/shared/api/client.js`'e header eklenmesi olur.

**İstisna — admin/editör endpoint'leri:** editör iki dili yan yana görmek
zorunda olduğu için admin uçları her iki dili birden döner ve alır:
```
GET  /api/blogs/{id}        → { titleTr, titleEn, kickerTr, kickerEn, ... }
PUT  /api/blogs/{id}        → aynı şekilde iki dil birden kabul eder
GET  /api/blogs/slug/{slug} → { title, kicker, ... }  (tek dil, public)
```

## Doğrulama Kuralları (backend)

1. `PUBLISHED` durumuna geçişte, o entity'nin **tüm** çevrilebilir alanları
   iki dilde de dolu olmalı; değilse 400 + `fieldErrors` ile hangi alanın
   hangi dilde eksik olduğu bildirilmeli.
2. `DRAFT` durumunda tek dil dolu olabilir (yazım süreci engellenmemeli).
3. `Accept-Language` tanınmayan/eksikse varsayılan `tr`.
4. `BlogBlock` / `EpisodeBlock` gibi alt koleksiyonlarda blok **sayısı ve
   sırası iki dilde ortaktır** — yalnızca metin alanları ikizlenir. Böylece
   canvas konumu (`x/y/width/height`, `col/row`) tek kayıt olarak kalır,
   dil başına ayrı düzen tutulmaz.

## Frontend Tarafı (ayrı iş, backend'i bloklamaz)

- `i18next` + `react-i18next` **zaten `package.json`'da kurulu** ama
  kullanılmıyor — yeni paket eklenmesine gerek yok.
- Arayüz metinleri (buton, boş durum, Navbar) için `src/shared/i18n/{tr,en}.js`
  sözlüğü. Bu, DB içeriğinden tamamen bağımsız katman.
- `src/App.jsx` — mevcut ~25 route tek bir `/:lang` sarmalayıcı altına alınır.
- `src/shared/api/client.js` — tek dokunuş noktası, `Accept-Language` ekler.
- Navbar'a dil anahtarı; `<html lang>` ve `hreflang` etiketleri.

## Bilinen Riskler

- `public/fonts/breaking-bad.otf` Türkçe diakritikleri (ı, ğ, ş, İ)
  muhtemelen içermiyor → TR'ye geçişte glif kırılması. Montserrat'ta sorun
  yok. Kontrol edilmeli.
- TMDB'nin TR `overview` ve başlık alanları sık sık eksik veya makine
  çevirisi — Aşama 2'de elle gözden geçirme gerekebilir.
- Türkçe metinler İngilizce'den ~%15-20 uzun → sabit yükseklikli hero/kart
  tasarımlarında taşma riski. Tam ayna olduğu için her iki dil de aynı
  layout'u paylaşacak.
- Tam ayna kuralı içerik üretim yükünü 2 katına çıkarır; kullanıcı bunu
  bilerek kabul etti.

## Doğrulama (iş bittiğinde nasıl test edilir)

1. `/tr/blog/<slug>` ve `/en/blog/<slug>` aynı görsel düzende, farklı dilde
   içerik göstermeli.
2. `/blog/<slug>` → `/tr/blog/<slug>` 301 yönlendirmesi çalışmalı.
3. EN alanı boş bir blog `PUBLISHED` yapılmaya çalışıldığında 400 dönmeli.
4. Admin editöründe bir blog açıldığında iki dil alanı da dolu gelmeli.
5. `npm run lint` ve `npm run build` temiz olmalı.
6. Dil değiştirince aynı sayfada kalınmalı (sadece ön ek değişmeli).

## Sıradaki Adım

Bu doküman backend tarafına iletilecek. Frontend işi (route sarmalayıcı,
i18n sözlüğü, dil anahtarı, `client.js` header'ı) backend şeması hazır
olmadan da başlatılabilir — ancak sıralama kullanıcının kararı.
