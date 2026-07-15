---
description: Fandoom'a yeni bir yapım (dizi/film) uçtan uca ekler — veri araştırma, içerik yazımı, gerekiyorsa UI, marka kontrolü ve QA'yı sırayla çalıştırır.
---

Kullanıcının verdiği yapım adı: $ARGUMENTS

Aşağıdaki adımları **sırayla** (paralel değil — her adım bir öncekinin
çıktısına bağımlı) Agent tool ile çalıştır. Her adımdan sonra sonucu kısaca
kullanıcıya özetle, bir sonraki adıma geç.

1. **`fandoom-data-researcher`** subagent'ını çağır: $ARGUMENTS için
   `src/data/productions.js` şemasına uygun bir taslak (id, slug, title, type,
   genre, synopsis, posterGradient, theme) üretmesini iste.

2. **`fandoom-content-writer`** subagent'ını çağır: adım 1'den çıkan slug'ı
   vererek 1 teori + 1 haber + 1 blog yazısı taslağı üretmesini iste
   (`src/data/content.js` şemasına uygun).

3. Kullanıcıya adım 1-2'nin taslaklarını göster ve onay iste. Onaylanırsa
   sen (ana asistan) taslakları `productions.js` ve `content.js`'e
   `Edit` ile ekle (bu adımı subagent'a devretme — dosya birleştirme küçük
   ve doğrudan yapılabilir bir iş).

4. Yeni bir UI/bölüm gerekiyorsa (kullanıcı belirtti veya mevcut sayfa
   yapısı yeni yapımı göstermiyor) **`fandoom-frontend-developer`**
   subagent'ını çağır.

5. **`fandoom-brand-visual`** subagent'ını çağır: adım 3-4'te değişen/eklenen
   dosyaların marka/görsel tutarlılığını denetlemesini iste.

6. **`fandoom-qa-reviewer`** subagent'ını çağır: son kontrol (lint + veri
   şeması bütünlüğü + component/CSS eşleşmesi) için.

7. Tüm bulguları tek bir özet halinde kullanıcıya sun. **Dosyaları
   commit'leme** — kullanıcı onay vermeden git commit atma.

Eğer $ARGUMENTS boşsa, kullanıcıya hangi yapımı eklemek istediğini sor.
