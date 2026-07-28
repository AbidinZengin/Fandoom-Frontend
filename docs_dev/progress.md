# Progress — Topluluk mimarisi planlama oturumu

## 2026-07-23

- Konuşma "GoT sayfasının eksik Community bölümünü bitirelim" ile başladı (Phase A,
  önceki değerlendirmede seçilen yön).
- Kod keşfi yapıldı: GameOfThrones.jsx, Intro/ScrollStepper/TabExhibit component'leri,
  shared/data/content.js (theories/news/blogPosts), shared/api/cms.js, client.js,
  vite.config.js. Kritik bulgu: CMS içeriği gerçek ayrı Spring Boot backend'e
  proxy'leniyor (localhost:8080) — bu repodan yeni CMS alanı açılamaz.
- İlk mimari öneri (Community = yapım sayfası içine gömülü, theories mock'una
  bağlı) kullanıcı tarafından REDDEDİLDİ: "shared data diye bir şey olmayacak,
  sen anlamadın... mevcut projemi boşver, bana bir forum sitesinin gereksinimlerini
  araştır, projemden bağımsız". Yön tamamen değişti: proje koduna dokunmadan,
  genel bir forum/community mimarisi taslağı çıkarma çalışmasına geçildi.
- 2 paralel araştırma ajanı (Phase 0): forum temel yapı taşları + veri modeli,
  araç/mekanizma manzarası. Sonuçlar findings.md'ye işlendi.
- Jenerik mimari Fandoom'a uyarlandı (Phase 1) — ilk taslak: Community, Production
  altında yaşayan gömülü bir bölüm, Yapım×Tip matrisi. Kullanıcı bunu da düzeltti:
  "topluluk yapımın altında yaşamasın, topluluk kısmının alt başlığında yapımların
  başlıklarıyla ayrılmış kısımlar olsun" → hiyerarşi ters çevrildi (Phase 2a, KARARLI).
- Kullanıcı ayrıca "yapımdan kastımız ne" diye sordu — netleştirildi: production =
  productions.js'teki dizi/film kaydı.
- İkinci seviye ayrım için iki alternatif sunuldu: tekil-yapım vs evren/franchise
  (Phase 2b, AÇIK — kullanıcıya soruldu). "diğerinin mimarisi nasıl" sorusuyla
  evren/franchise modeli detaylandırıldı (Westeros = GoT+HotD, trade-off tablosu).
- Kullanıcı `ai-maestro/planning` skill'ini kurdu (npx claude-code-templates) ve
  bu yapıyla devam etme talimatı verdi → docs_dev/ altında 3-dosya deseni kuruldu
  (bu dosyalar).

- Kullanıcı "sana araştırma yap derken bunu kastetmiştim, hangisini önerirsin" dedi
  → Phase 2b için ayrı bir araştırma ajanı gönderildi (Reddit/Fandom.com/Steam/
  GameFAQs/Discord karşılaştırması + ghost-town/critical-mass UX literatürü).
  Sonuç: Model B (evren/franchise) önerildi — Fandom.com'un GoT+HotD'yi tek
  "Wiki of Westeros"ta birleştirmesi en güçlü emsal; yeni platformda kritik kütle
  riski tekil-başlık dağılımını dezavantajlı kılıyor. Kullanıcı onayı bekleniyor.

- Kullanıcı Model B onayı yerine üçüncü bir yol seçti: evren kararını bekletip
  şemayı parametrik kurma ("Yol 2"). Evren, Yapım'a bağlı opsiyonel bir katman
  oldu — tekil-mi-evren-mi sorusu artık şemayı bozmadan sonradan cevaplanabilir.
  Bu, Phase 2b'yi çözdü ve 2c'yi düşük-riskli editöryel veri girişine indirgedi.
- 2d netleşti: Teoriler/Tartışmalar/Haberler (tip alanı) yeterli, ek bölüm istenmedi.
- Phase 3 (nihai veri modeli) tamamlandı: Evren, Yapım (referans, değişmez),
  Konu, Gönderi, Kullanıcı (referans, dışarıdan), Oy (basit upvote), Etiket,
  Şikayet (MVP moderasyon) — task_plan.md'ye işlendi.

## Sonraki adım
Phase 4 (kasıtlı ertelenmiş): frontend'e uygulama + açık kalan iki soru —
URL/SEO'da yapım adının görünürlüğü, ve mevcut content.js mock'larının
(theories/news/blogPosts) akıbeti. Kullanıcı başlatmadan bu phase açılmayacak.
