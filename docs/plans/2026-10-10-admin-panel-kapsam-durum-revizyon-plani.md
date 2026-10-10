# Admin Paneli: Tam Kapsam, Yayın Durumu ve Düzenleme Taslağı (Revizyon) Planı

**Durum:** Plan onaylandı (2026-10-10), uygulama başlamadı.
**İlişkili belge:** `2026-10-10-admin-panel-design.md` (kabuk + canlı önizleme
tasarımı; önizleme bu planda ŞİMDİLİK KAPSAM DIŞI).

## Amaç

Admin paneli blogları, dizi/film içeriklerini, sezon/bölümleri, karakterleri
ve diğer içerikleri backend uçlarıyla yönetebilmeli; **yayın/taslak** ayrımı
ve yayındaki kayıtlar için **düzenleme taslağı (revizyon)** olmalı.

## Kararlar (kullanıcı onaylı)

1. **Yayın durumu modeli:** Yalnız ana içerik durum taşır; çocuklar ebeveynini
   izler. Dizi/Film yeni `publishStatus` alır. Sezon, bölüm, karakter, cast,
   trivia, lore ebeveynin durumunu miras alır. **Blog bağımsızdır**, kendi
   mevcut `DRAFT/PUBLISHED` durumunu korur ve bir yapıma bağlı değildir.
2. **Revizyon yalnız YAYINDAKİ kayıtlar için** gerekir; taslak durumundaki
   kayıt doğrudan düzenlenir.
3. **Taslak kaydı elle** ("Taslağı kaydet" butonu). Tarayıcıdaki yerel otomatik
   yedek güvenlik ağı olarak kalır; sunucuya otomatik kayıt YOK.
4. **Alt içerik yerleşimi:** Ebeveynin içinde sekmeler (Dizi sayfasında
   `Genel | Sezonlar | Karakterler | Trivia | Lore`).
5. **Canlı önizleme şimdilik yok** (kullanıcı kararı).

## Mevcut durum (backend `fandoom-backend` + kontrat 2026-08-10'dan okundu)

Kural: tüm GET'ler PUBLIC, yazma EDITOR+ (CMS yazma ve `/users` ADMIN).

| Varlık | Yazma uçları | Yayın durumu |
|---|---|---|
| Blog | `POST/PUT /blogs` | Var (`DRAFT/PUBLISHED`) |
| Dizi / Film | `POST/PUT/DELETE /series`, `/movies` | Yok |
| Sezon / Bölüm | `PUT /seasons/{id}`, `/episodes/{id}` | Yok |
| Karakter | `POST/PUT /characters` | Yok |
| Kişi / Cast | `/people`, `CastController` | Yok |
| Trivia | `/trivia` | Yok |
| Lore | tam CRUD | Yok |
| CMS sayfa blokları | `/cms/**` (ADMIN) | Yok |
| Franchise / Genre / Tag | CRUD | Gerekmez |
| Medya | `/media` | Gerekmez |

- `SeriesStatus` (ONGOING/ENDED/CANCELLED) ve `MovieStatus` yaşam döngüsü
  durumudur, yayın durumu DEĞİLDİR. Yapımlar kaydedildiği anda herkese açıktır.
- GET'ler PUBLIC olduğu için taslak, ancak public uçlar süzerse gizlenir.

## Backend sözleşmesi (yeni)

### Yayın durumu (Dizi/Film)
- Yeni sütun `publishStatus` (`DRAFT`/`PUBLISHED`). Migration: mevcut kayıtlar
  `PUBLISHED` (canlı içerik gizlenmez); panelden açılan yeni kayıt `DRAFT`.
- `PATCH /api/series/{id}/status`, `PATCH /api/movies/{id}/status` (EDITOR+),
  anında etkili, revizyon değildir.
- Public uçlar (liste, slug, id, `/productions`, çocuk uçlar) yalnız
  `PUBLISHED` ebeveyn içeriğini döndürür.
- Taslakları görmek için AYRI admin uçları (EDITOR+), ör. `GET /api/admin/series`
  (`?status=`). Public GET'e taslak sızdırılmaz.
- Blog: özet yanıtına `status` eklenir; admin listesi taslakları da döndürür
  (şu an public `GET /api/blogs` ile çalışıyor).

### Revizyon (tek genel modül)
`content_revision`: `entityType`, `entityId`, `payload` (JSON, varlığın mevcut
`PUT` isteğiyle AYNI gövde), `baseUpdatedAt`, `status` (`OPEN`/`PUBLISHED`/
`DISCARDED`), `createdBy`, `updatedAt`. Bir kayıt için aynı anda en fazla bir
açık taslak.

| Uç (EDITOR+) | İş |
|---|---|
| `GET /api/revisions/{type}/{id}` | Açık taslak |
| `PUT /api/revisions/{type}/{id}` | Taslağı kaydet (doğrular, uygulamaz) |
| `POST /api/revisions/{type}/{id}/publish` | Mevcut `service.update` ile tek işlemde uygular; canlı `updatedAt` ≠ `baseUpdatedAt` ise `409` |
| `DELETE /api/revisions/{type}/{id}` | Taslağı at |
| `GET /api/revisions?status=OPEN` | Bekleyen taslaklar |

Geri alma (önceki sürüme dön) için yayınlarken eski değer saklanması ayrı,
sonraki adımdır (Faz E).

## Frontend mimarisi

Şema tabanlı genel CRUD motoru, `src/admin/entities/`:

- **Kayıt defteri:** her varlık için tek tanım (`api`, gruplu `alanlar`,
  `ebeveyn`, `ozellikler: { hasStatus, hasRevision }`, `ozelEditor` slotu).
  Mevcut `ENTITY_SCHEMAS` (PageBuilder) ile BAĞLANTISI YOK, panelin kendi
  tanımları ayrı durur.
- **Genel bileşenler:** `EntityList`, `EntityForm` (`fieldErrors` alanın
  altına), `StatusBar` (rozet + Yayınla / Taslağa al), `RevisionBanner`,
  `ChildPanel`.
- **`useEntityEditor(entity, id)`:** yükleme, `original`/`draft` farkı,
  taslağı kaydet, yayınla, at, durum değiştirme, `409` akışı tek yerde.
- **Bayraklar:** `hasStatus`/`hasRevision` varlık başına kapalı başlar; panel
  backend gelmeden düz CRUD olarak çalışır, bayrak açılınca özellikler devreye
  girer.
- **Özel editörler:** blog blok editörü (mevcut `src/admin/Blogs/`) ve bölüm
  blokları (`episodeBlocks`).
- **Rotalar:** `/admin/:varlik`, `/admin/:varlik/new`, `/admin/:varlik/:id`;
  alt içerik ebeveyn sayfasında sekme.
- Her backend'e yazma adımı ayrı kullanıcı onayıyla çalışır.

## Fazlar

**Faz 0: Ön koşullar**
- Blog editörünün blok konumlarını (`x/y/width/height`, `canvasHeight`)
  kaydederken taşımaması (veri kaybı riski) çözülür.
- Backend kontratı güncellenir (2026-08-10 sonrası modüller, sezon/bölüm
  oluşturma uçları doğrulanır).
- `GET /api/blogs?sort=latest` `500` hatası ve admin listesinin taslakları
  görmesi backend'e iletilir.
- Bitiş: yazılı doğrulama notu, riskler kapalı veya kullanıcı onaylı.

**Faz A: Genel CRUD motoru + Dizi/Film (backend'siz)**
- Kayıt defteri, `EntityList`, `EntityForm`, `useEntityEditor`, rail'de
  "Yapımlar".
- Bitiş: lint + build temiz, liste/düzenleme ekran görüntüsü, onayla bir
  gerçek yazma testi.

**Faz B: Yapım içeriği sekmeleri**
- `Genel | Sezonlar | Karakterler | Trivia | Lore`, bölüm blokları özel
  editörü, film için uygun alt küme.
- Bitiş: her sekmede liste + düzenle (+ sil), ekran görüntüleri.

**Faz C: Backend, yayın durumu + revizyon** (`fandoom-backend`, A/B ile paralel)
- `publishStatus` + migration, public süzme, admin uçları, `content_revision`.
- Bitiş: backend testleri yeşil, kontrat güncel; veritabanına yazan adımlar
  ayrı onaylı.

**Faz D: Panelde durum ve revizyon**
- Bayrakları aç: `StatusBar`, `RevisionBanner`, "Bekleyen taslaklar" (Genel),
  çakışma akışı.
- Bitiş: yayındaki kaydı düzenle → taslağı kaydet → yayınla → at akışı uçtan
  uca çalışır.

**Faz E: Blog + kalan modüller**
- Blog revizyonu (durumu bağımsız), CMS blokları (ADMIN), Franchise/Genre/Tag,
  sürüm geçmişi ve geri alma.
- Bitiş: tüm varlıklar panelden yönetilebilir; eski `pages/Admin` araçlarından
  kalan ölü kod listelenir.

**Bağımlılık:** A→B ilerler, C paralel, D hem B'yi hem C'yi bekler, E sonda.
Bir faz sonunda kullanıcı onayı olmadan sonraki faza geçilmez.

## Kapsam dışı (şimdilik)

Canlı önizleme (iframe + taslak köprüsü), sunucuya otomatik taslak kaydı,
çok kullanıcılı eşzamanlı revizyon, i18n çeviri arayüzü, Community moderasyonu.

## Açık noktalar

- Sezon/bölüm için oluşturma (`POST`) uçlarının varlığı doğrulanmadı.
- Kontrat 2026-08-10 tarihli; sonraki modüller ayrıca kontrol edilmeli.
- Blog blok konumlarının (`x/y`) veritabanında dolu olup olmadığı doğrulanmadı.
- Revizyon `409` çakışmasında "yine de yayınla" (`force`) seçeneği sunulup
  sunulmayacağı Faz C'de netleşecek.

## Faz 0 sonuçları (2026-10-10, backend `fandoom-backend` `main` okunarak)

**1. Blok konumu (`x/y`) veri kaybı riski: GERÇEK DEĞİL.** Backend commit
`2ff1123` blogu serbest kanvastan `sceneKey` desenine taşıdı;
`blogblock_seasonblock_migration.sql` `x/y/width/height/canvasHeight`
alanlarının DB'de hiç var olmadığını yazıyor. `BlogBlockRequest` yalnız
`blockType, sceneKey, content(Tr), imageUrl, imageAlt(Tr)` taşıyor, editörün
gönderdiği gövdeyle birebir uyumlu. Frontend'de kalan bayat kod (dokunulmadı,
rapor): `src/shared/blogBlockLayout.js` (hiçbir yerden import edilmiyor) ve
`src/shared/api/blogs.js` içindeki x/y/canvasHeight yorumları.

**2. SORUN: herkese açık `GET /api/blogs` taslakları da döndürüyor.**
`BlogServiceImpl.list` doğrudan `blogRepository.findAll(pageable)` çağırıyor,
durum süzmesi yok; `BlogSummaryResponse` de `status` taşımıyor. Public site bu
uca bağlı: Home `BlogSpotlight` (`size 4`), `Blog.data.js` (`size 20`), blog
ileri/geri navigasyonu `BlogPost.data.js` (`size 100`), `Account.data.js`.
DB'de taslak blog varsa bu yerlerde görünebilir ve slug uç noktası taslak için
404 verir. Çözüm (backend, Faz C ile birlikte): public liste yalnız
`PUBLISHED`, taslakları da gösteren AYRI admin liste ucu (EDITOR+), özet
yanıtına `status`.

**3. `?sort=latest` `500`:** Hata backend'in değil, frontend'in kullanım
hatası. `GET /api/blogs` Spring `Pageable` kullanıyor, `sort` bir ALAN adı
bekler (`sort=id,desc` → 200 doğrulandı). `latest/oldest/trending/recommended`
yalnız `GET /api/blogs/hub`'da geçerli. Küçük backend iyileştirmesi:
`GlobalExceptionHandler` geçersiz sort alanını `400` yerine `500` döndürüyor.
Admin listesi `sort=id,desc` kullanacak şekilde düzeltildi.

**4. Kontrat doğrulaması (kod okundu).**
- Sezon: `GET/POST /api/series/{id}/seasons`, `POST …/batch`,
  `GET/PUT/DELETE /api/seasons/{id}`. Bölüm: `GET/POST /api/seasons/{id}/episodes`,
  `POST …/batch`, `GET/PUT/DELETE /api/episodes/{id}`. **Oluşturma uçları var.**
- Karakter: `GET/POST/PUT/DELETE /api/characters[/{id}]`, yapıma bağlı
  `GET/POST /api/{movies|series}/{id}/characters[/batch]`.
- Cast: `GET/POST /api/{movies|series}/{id}/cast[/batch]`, `DELETE /api/cast/{id}`
  (**güncelleme `PUT` yok**, sil + yeniden ekle).
- Dizi: `GET/PUT /api/series/{id}/hero-blocks` (dizi hero blokları backend'de
  var). Film: hero-blocks yok.
- Trivia: `GET /api/trivia`, `GET /api/trivia/tags`, `POST`, `PUT/DELETE /{id}`.
- Person: tam CRUD + `batch`.
- Kontrat dosyası (`endpoint_contract.txt`, 2026-08-10) bu uçları kısmen
  içermiyor; Faz C'de güncellenecek.

**Faz 0 kapanış durumu:** Risk 1 kapandı (gerçek değil). Risk 2 ve 3 backend
işi olarak Faz C'ye taşındı. Kontrat açık noktaları kapandı.


## Faz B sonuçları (2026-10-10)

**Yapılan:** Dizi ve film sayfalarında alt varlık sekmeleri, iç içe URL yapısı
(`/admin/series/3/seasons/2/episodes/1`), alt varlıklar için oluştur / düzenle /
sil, bölüm ve sezon blok editörü.

| Üst varlık | Sekmeler |
|---|---|
| Dizi | Genel, Sezonlar (→ Bölümler), Karakterler, Trivia, Lore kategorileri, Lore grupları, Mekanlar, Olaylar |
| Film | Genel, Karakterler, Trivia, Lore kategorileri, Lore grupları, Mekanlar, Olaylar |

- **URL dilbilgisi:** `src/admin/entities/adminPath.js`. Zincirdeki her halka bir
  üstün `children` listesinde olmak zorunda. Alt varlık listesi ayrı sayfa değil,
  ebeveynin sekmesi (`?tab=`).
- **Yönlendirme tuzağı:** `/admin/series/7` public `/:lang/series/:slug`
  rotasıyla (lang=`admin`) eşleşip ana sayfaya yönleniyordu. Admin rotaları bu
  yüzden statik segmentlerle (`series/*`, `movies/*`) tanımlı. Yeni üst-seviye
  varlık eklerken `App.jsx`'e bir satır eklenmeli.
- **Alan tipleri:** text, textarea, number, date, select, image, boolean,
  multiselect, relation (ebeveynin kayıtlarından seçim), json (kaydetmeden
  doğrulanır), blocks.
- **Bloklar:** `type: 'blocks'` alanı gövdeye YALNIZ değiştiyse girer (backend
  null listeyi "mevcut blokları koru", dolu listeyi "yeniden yaz" sayar).
  `id/orderIndex/_key` gönderilmez; tanımda olmayan alanlar (`col`, `row`)
  bloğun içinde aynen taşınır.
- **Trivia:** backend'de tek-kayıt `GET` yok; kayıt ebeveynin listesinden bulunur,
  bulunamazsa "Kayıt bulunamadı". `itemType` küçük harf (`series` / `movie`).

**Bilerek dışarıda bırakılanlar**
- **Dizi/film silme:** kapalı. Sezon, bölüm, karakter vb. hepsini siler; Faz C'nin
  taslak akışı gelince değerlendirilecek.
- **Cast:** backend'de `PUT` yok (yalnız nested `POST` + `DELETE`) ve kişi seçici
  (`/people`) gerekir. Ayrı iş.
- **Genre / producer / director / writer düzenleme:** şimdilik yüklenen değerler
  aynen geri gidiyor; ilişki seçici sonraki adım.
- **Lore katılımcıları ve grup atamaları** (`/lore/events/{id}/participants`,
  `/lore/groups/{id}/assignments`).

**Doğrulama:** Gerçek `GET` verisi + taklit yazma. Bölüm blokları 33/33, sezon
blokları 22/22 yüklendi; yalnız başlık değişince bloklar gövdeye girmedi; blok
değişince 33 blok id'siz gitti. Gerçek backend yazması DENENMEDİ.

**Riskler**
- Karakter/trivia `title/content/description` alanları `Accept-Language`'e göre
  çözülüyor; admin her zaman `en` istiyor. EN alanı boş bir kayıtta çözümleyici
  TR'ye düşerse form EN alanında TR metin gösterir ve kaydetme onu EN'e yazar.
  Örneklenen kayıtlarda (dizi 3, 7, 8) böyle bir durum görülmedi.
- Aynı kaydı iki sekmede düzenleyen son kaydeden kazanır (bilinen karar).
