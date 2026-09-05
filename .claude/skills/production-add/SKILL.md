---
name: production-add
description: >-
  Yeni bir yapım (dizi/film) sayfasını uçtan uca ekleme prosedürü: research →
  seed verisi → backend'e yazma → sayfa iskeleti → motion → görsel doğrulama.
  Kullanıcı "X yapımını ekle", "yeni dizi/film sayfası aç" dediğinde kullan.
  Token tasarrufu için mümkün olan her adım otomatik akar; sadece kalite
  riski taşıyan 4 noktada (görsel seçimi, seed veri özeni, Hero tasarım
  varyasyonları, son görsel karşılaştırma) durup onay ister. Bu duraklar
  ATLANMAZ.
---

# Yeni Yapım Ekleme Prosedürü

## Ön koşul

- Yapımın adı/türü (dizi/film) ve backend'de series/production kaydının
  olup olmadığı netleşmiş olmalı (yoksa önce Admin/PageBuilder'dan kayıt).
- `learned-rules` okunmuş olmalı.

## Adımlar

### 1. Meta veri — önce API, sonra gerekirse research

- Önce mevcut `TMDB_API_KEY` (`.env.local`) ile TMDb'den temel meta veri
  çek: başlık, tür, sezon/bölüm listesi, tarih, poster/still URL'leri.
  Bu adım ucuz ve deterministik, onay gerektirmez.
- TMDb'nin yetersiz kaldığı alanlar için (cast detayı, lore/fandom
  içeriği, sinopsis girdisi) `web-researcher` agent'ını SADECE eksik
  alanlar için çalıştır — TMDb'nin zaten verdiğini tekrar aratma.

### 2. DURAK — Görsel onayı

Bulunan görsel adaylarını (URL + kaynak + çözünürlük notu) listele.
Kullanıcı beğenmezse reddeder → sadece o görsel için yeniden arama
yapılır, tüm adım tekrarlanmaz.

### 3. Seed veri taslağı (`scripts/data/<yapım>.json`)

- **Her metin alanı (synopsis, tagline, açıklama) kaynaktan BİREBİR
  KOPYA OLAMAZ** — TMDb/kaynak metni özgün, detaylı, canlı bir dile
  dönüştürülür ([[synopsis-tmdb-kopyalama-yasak]] — tekrarlayan bir
  ihlal noktası, burada özellikle kontrol edilir).
- Bu kontrolü taslağı kullanıcıya sunmadan ÖNCE kendi yap; kopya/kuru
  kalan metni tekrar yaz, sonra sun.

### 4. DURAK — Veri onayı

data.json'un özetini (sezon/bölüm başlıkları + synopsis'ler) göster.
Kullanıcı özensiz/eksik bulursa düzelt → tekrar sun. Bu onay
gelmeden 5'e geçilmez.

### 5. Seed script → backend POST

Var olan desen (`seed-house-of-the-dragon-seasons.mjs` /
`seed-severance-season-story.mjs`): idempotent, `scripts/output/*-seed-
report.json`'dan resume edilebilir. Yeni script yazarken bu deseni
kopyala-parametrize et, sıfırdan yazma. Backend'e yazma [[db-cloudinary-
yazma-onayi]] kuralına tabi — durak 4'teki onay bunu kapsamaz, POST
adımı ayrıca teyit ister.

### 6. Görsel upload script

`fetch-season-posters` / `fetch-episode-stills` → `upload-*-posters`
deseni; Cloudinary yazımı da [[db-cloudinary-yazma-onayi]] kapsamında.

### 7. Sayfa iskeleti — `component-dev`

`src/pages/series/<Name>/` altında Hero, SeasonDetail, SeasonRoute,
EpisodePage. Mevcut bir seri (HouseOfTheDragon/Severance) referans
implementasyon olarak okunur.

### 8. DURAK — Tasarım varyasyonu (component başına ayrı)

Her component kendi varyasyon listesini çıkarır:
- Varyasyon noktası varsa (ör. Hero'da logo konumu, synopsis hizalama,
  vurgu rengi) somut seçenekleri statik render/screenshot ile sunar,
  kullanıcı seçer.
- Varyasyon noktası yoksa hiçbir şey sormaz, mevcut şablonu birebir
  kullanır ve bunu tek satırla belirtir ("bu component'te serbest alan
  yok, mevcut şablon kullanıldı").

### 9. `motion-expert`

GSAP/Lenis animasyonu — mevcut tek-Lenis düzenini kullanır, yeni motion
altyapısı kurmaz.

### 10. DURAK — `visual-verify`

Screenshot ↔ referans karşılaştırma, maks 2-3 revizyon turu
(CLAUDE.md Karpathy ilkeleri).

## Katı kurallar

- Sadece bu prosedürün kapsadığı dosyalara dokun; paylaşılan component'i
  değiştirmeden önce onu kullanan yerleri listele ([[Kapsam Kuralları]]).
- Yeni npm paketi eklenmez.
- 4 duraktan hiçbiri atlanmaz — otomasyonun amacı adımları hızlandırmak,
  kalite kontrolünü ortadan kaldırmak değil.
