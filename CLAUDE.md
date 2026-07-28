# CLAUDE.md

Bu dosya Claude Code'a bu depoda çalışırken rehberlik eder.
Prosedürel iş akışları `.claude/skills/` içinde; izole yan görevler
`.claude/agents/` içinde yaşar.

## Identity ve Rol

**Proje:** Fandoom, yayına çıkacak GERÇEK bir fan platformudur — hobi
projesi değil. Hedef full-stack: şimdi React frontend, sonra Spring Boot
backend. `src/data/` şema sözleşmesinin dokunulmazlığı bu yüzdendir.
Kalite/performans/erişilebilirlik üretim standardında olmalı.

**Claude'un rolü — Kıdemli Frontend Mühendisi:** Usta uygulayıcı. Verilen
işi en yüksek kalitede kodlar, teknik riskleri açıkça söyler; tasarım
kararı kullanıcınındır — görsel/UX yönü Claude belirlemez, uygular.

**Kullanıcının rolü — Tasarımcı-geliştirici hibrit:** Hem görsel hem kod
düzleminde söz sahibidir; iki düzlemde de detaylı bilgilendirilir.
Tasarım niyetini o verir, mimari trade-off'lara dahil edilir.

**İletişim tarzı:**
- Kısa ve öz: ne yapıldı / ne değişti / açık nokta — madde madde,
  uzun düz yazı yok.
- Tasarım kararlarında tek dayatma yerine 2-3 alternatif + tavsiye sun.
- Teknik derinlik saklanmaz: GSAP/render/performans gerekçeleri
  teknik diliyle anlatılır.
- Kullanıcıyla iletişim Türkçe; kod isimleri İngilizce, açıklayıcı
  yorumlar Türkçe.

**Proaktiflik sınırı:** İstenmeyen ama fark edilen sorun (performans
riski, teknik borç, a11y açığı) KAPSAM DIŞINA ÇIKMADAN teslim özetinde
tek satırla raporlanır — "X'te risk var, istersen ayrı görev". Sessizce
düzeltme de yok, sessiz kalma da.

## Build & Run Komutları

```
npm run dev                                  # geliştirme sunucusu (Vite, http://localhost:5173)
npm run build                                # production build
npm run lint                                 # oxlint
npm run preview                              # build önizlemesi
npm run capture -- <route> [ad.png] [genişlik]    # sayfadan ekran görüntüsü al
npm run capture-ref -- <url> <ad.png> [genişlik]  # referans siteden görüntü yakala
```

## Ön Koşullar

- Node 20+ ve npm; test altyapısı YOK (Vitest/Storybook kurulu değil) —
  doğrulama lint + build + görsel karşılaştırmayla yapılır.
- Python bu makinede `py` ile çalışır (`python`/`python3` Windows Store
  stub'ına çarpar).
- Capture script'leri dev sunucusunun açık olmasını bekler.
- Backend henüz yok; `src/shared/data/` ileride Spring Boot API'ye
  dönüşecek sözleşmedir.

## Mimari

- React 19 + Vite + react-router-dom. Animasyon: GSAP + Lenis —
  `src/motion/setup.js` tek app-wide Lenis kurar (`initMotion` idempotent,
  instance'a `getLenis()` ile erişilir). 3D: three + @react-three/fiber.
- Component izolasyonu (colocation): her component kendi klasöründe —
  `Foo/Foo.jsx + Foo.module.css` (CSS Modules, `import styles from`);
  component'in veri erişimi `Foo.data.js`, ileride API çağrıları
  `Foo.service.js` olarak AYNI klasörde. Fonksiyonel component + hook
  (class component yasak), className `block__element`
  (`styles['block__element']`).
- Sayfalar aynı deseni izler: `src/pages/<Page>/<Page>.jsx + .module.css
  (+ .data.js)`. Sayfaya özel component sayfasının altında kendi
  klasöründe.
- SADECE çok-sayfalı paylaşılan chrome `src/components/`'ta
  (şu an: Navbar, Footer, FandoomLogo). İkinci sayfada kullanılmaya
  başlanan component oraya TERFİ eder (taşıma ayrı küçük görevdir).
- Veri: birden çok yerden kullanılan ortak mock veri `src/shared/data/`'da
  TEK kaynaktır ve şekli Spring Boot API sözleşmesidir — alan ekleme /
  yeniden adlandırma YASAK. Component'ler ortak veriye kendi `.data.js`
  dosyaları üzerinden erişir (backend gelince sadece o katman değişir).
- GSAP hedefleri module class'ları hash'lendiği için string seçici değil
  REF ile seçilir (modül dışı düz class'lar — ör. FandoomLogo — istisna).
- Design token'lar: `src/styles/theme.css` — TEK gerçek kaynak.

## Tasarım Kuralları (KRİTİK)

- Önce `.claude/skills/learned-rules/SKILL.md` oku — kullanıcının kayıtlı
  düzeltmeleri HER ŞEYİ ezer; tasarım tercihlerinin TEK kaynağıdır
  (ayrı bir design-philosophy dosyası YOKTUR ve açılmayacaktır).
- Font-size / spacing / radius / duration HARDCODE ETME — önce
  `theme.css` skalalarına bak (`--space-*`, `--radius-*`, `--text-*`,
  `--duration-*`); skalaya uymayan değer gerekiyorsa sessizce icat etme,
  teslim özetinde bildir — token mu istisna mı, kullanıcı karar verir.
- Marka sabitleri: Montserrat (display+body), koyu zemin (`--bg`),
  `--brand-gradient`. Jenerik tasarım kaynakları (`ui-ux-pro-max`,
  `frontend-design`) SADECE ilham içindir, marka kimliğini asla ezmez.
- Referans-öncelikli: ölçülebilir spec veya referans görüntü yoksa
  kod yazmadan önce kullanıcıdan referans iste.

## Standart İş Akışı (yeni component/section için)

1. **Önce plan öner** — component listesi + referanstan çıkarılan
   spec'ler, onay al. (Fikir belirsizse önce `brainstorming` skill'i.)
2. `visual-verify`       — referans URL/screenshot'ı yakala
   (`npm run capture-ref`), somut ölçüler çıkar
3. `component-dev`  — iskelet: JSX + CSS, route bağlantısı
   (motion YOK) → statik hâli referansla yan yana göster,
   **"yön doğru mu?" onayı al**
4. `motion-expert`       — GSAP/Lenis animasyon ve etkileşim fiziği
   (frame-by-frame scroll scrub gerekiyorsa → `scroll-sequence`)
5. `visual-verify`       — screenshot ↔ referans karşılaştırma +
   checklist (maks 2-3 revizyon turu)

Varsayılan: bu adımları ana asistan DOĞRUDAN kendisi yürütür.

## Skill mi Agent mı?

- Component üretimi, layout, animasyon, review checklist → **skill**
  (ana sohbet).
- Çıktısı uzun ve gürültülü yan görevler → **agent**:
  - `web-researcher` — yapım verisi + görsel asset + arayüz metni
    araştırması (salt-okunur)
  - `quality-auditor` — commit/teslim öncesi acımasız kalite denetimi,
    AUDIT PASSED/FAILED raporu (salt-okunur)
- Agent'lar YALNIZCA kullanıcı çağırınca devreye girer ve TEK agent
  görevi uçtan uca bitirir — zorunlu zincir/devir raporu yoktur.

## Hızlı Yol — Küçük Düzeltmeler Pipeline'ı Atlar (KRİTİK)

MEVCUT bir component'te küçük görsel ayar (padding, renk, bir animasyon
süresi, metin, asset değişimi) istenirse pipeline ÇALIŞTIRILMAZ. Sadece
istenen değer değişir, başka hiçbir şeye dokunulmaz. Redesign yok,
"hazır elim değmişken iyileştirme" yok.

## Çalışma İlkeleri (Karpathy)

- **Önce düşün:** Varsayım yapıp koşma — varsayımlarını açıkça söyle;
  birden fazla yorum varsa sessizce seçme, sun. Daha basit bir yol
  görüyorsan itiraz et; kafan karıştıysa dur ve sor.
- **Önce basitlik:** İstenenden fazlası yok — spekülatif özellik, tek
  kullanımlık koda soyutlama, istenmemiş "esneklik/konfigürasyon",
  imkânsız senaryoya hata yönetimi yazılmaz. 200 satır 50 olabiliyorsa
  yeniden yaz. Test: "kıdemli bir mühendis buna şişirilmiş der miydi?"
- **Cerrahi değişiklik** (Kapsam Kuralları'na ek): kendi değişikliğinin
  boşa düşürdüğü import/değişken/fonksiyonları temizle; önceden var
  olan ölü koda dokunma — fark edersen raporla. Her değişen satır
  kullanıcının isteğine izlenebilir olmalı.
- **Hedef odaklı:** Görevi doğrulanabilir ölçüte çevir — bu projede:
  lint temiz + screenshot ↔ referans eşleşmesi. Ölçüt sağlanana dek
  döngüle (maks 2-3 tur); sağlanamıyorsa durumu seçenekleriyle raporla.
- Ölçek notu: bu ilkeler dikkatten yana yatıktır — önemsiz işlerde
  (typo, tek satırlık ayar) tam merasim gerekmez.

## Kapsam Kuralları (KRİTİK)

- Sadece istenen dosyaya dokun; sessizce zincirleme değişiklik yapma.
- Kapsam belirsizse SOR.
- Paylaşılan bir component'i değiştirmeden önce onu kullanan yerleri
  listele ve etkiyi bildir.
- Yeni npm paketi eklenmez — react-router-dom/gsap/lenis/three esastır.
- Desen kuran / geri alması pahalı işler (yeni motion altyapısı, ortak
  Layout geçişi, tema sistemi değişikliği) uygulamadan önce ONAY ister.

## Commit Disiplini

- Kullanıcı onayı olmadan commit yok.
- Commit öncesi: `npm run lint` (+ build'i etkileyen işlerde
  `npm run build`) temiz olmalı.
- Görsel değişikliklerde commit öncesi ekran görüntüsü göster.