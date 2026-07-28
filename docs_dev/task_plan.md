# Referans Notu: Fandoom "Topluluk" (Community) — ileride başlanınca bakılacak

**Bu dosya bir iş listesi/uygulama sırası DEĞİL.** Community özelliğine
gerçekten başlandığında (henüz başlanmadı) göz önünde bulundurulacak
kararların ve gerekçelerinin dökümüdür. Zorunlu faz sırası, "sıradaki adım"
dayatması yok — Community ne zaman ve hangi sırayla yapılacaksa o an
karar verilir. Şu an aktif bir taahhüt değildir.

Proje bağlamı: React+Vite frontend (bu repo), backend ayrı bir Spring Boot
deposu (bu repoda değil). CMS içeriği (Hero/Intro/ScrollStepper/TabExhibit)
gerçek backend'e proxy'leniyor — yeni CMS alanı bu repodan açılamaz. Bu
yüzden Community, tasarlanırsa, kendi bağımsız veri modeline dayanmalı.

**Not (2026-07-23):** Bu dosyadaki kararlar bir ara `.claude/skills/
learned-rules/SKILL.md`'de önceden kilitli bir Community mimarisiyle
çelişmişti; kullanıcı learned-rules'ın kazanmasına karar verdi (proje
kuralı: çelişkide learned-rules her şeyi ezer). Aşağıdaki veri modeli o
düzeltmeye göre güncel. **learned-rules'ın kendi içinde de [[topluluk-yapı]]
(evren=organizasyon seviyesi) ile [[topluluk-organizasyon]] (evren=tag,
klasör değil) arasında çözülmemiş bir çelişki var** — Community'ye
gerçekten başlanmadan önce bu ikisi netleştirilmeli.

## Araştırılmış veri modeli (referans — bağlayıcı değil)

| Kavram | Taşıdığı bilgi | Bağlı olduğu |
|---|---|---|
| **Category** | `surface` [`NEWS`\|`BLOG`\|`DISCUSSION`\|`THEORY`\|`FAN_ART`], `defaultSort`, `writePermission` [`OPEN`\|`EDITOR_ONLY`] | Discussion: 5-9 kategori (tek seviye) + tag; Theory/Fan Art: flat + küratörlü tag listesi; News/Blog: `writePermission: EDITOR_ONLY` |
| **Evren** *(opsiyonel, ORGANİZASYON DEĞİL — filtre girişi)* | ad, slug | — |
| **Yapım** | *(mevcut productions.js, DEĞİŞMEZ)* | isteğe bağlı Evren referansı, Community'nin KENDİ tablosunda (şema dokunulmazlığı) |
| **Konu (Thread)** | başlık, gövde/excerpt, tarih, `isPremium` | bir Category (→ surface), bir Kullanıcı (açan), 0-n Etiket, 0-1 `productionSlug` (çapraz-kesen tag, KLASÖR DEĞİL), Fan Art ise 1-n görsel |
| **Gönderi (Post)** | içerik, tarih, `parentPostId` (nullable — Discussion/Theory nested 3 seviye; Fan Art hep flat/null) | bir Konu, bir Kullanıcı (yazan) |
| **Kullanıcı** | *(Community'nin sahibi değil — auth nereden geliyorsa oradan referans)* | — |
| **Oy** | var/yok (basit upvote, yön alanı YOK) | bir Kullanıcı + bir Konu ya da Gönderi |
| **Etiket** | ad | n-n Konu ile (yapım/evren etiketi bunun özel bir türü) |
| **Şikayet (Report)** *(MVP moderasyon)* | durum [bekliyor/incelendi/reddedildi] | bir Konu/Gönderi + şikayet eden Kullanıcı |

## Kararların gerekçeleri (referans)

| Karar | Gerekçe |
|----------|-----------|
| Community CMS'e değil kendi bağımsız veri modeline dayanır | CMS gerçek ayrı backend'e proxy'leniyor, bu repodan yeni alan açılamaz |
| Topluluk (/community) bağımsız üst-seviye alan, yapım sayfası içine GÖMÜLMEZ | Kullanıcı kararı — ilk "yapımın altında yaşasın" önerisi reddedildi |
| Moderasyon MVP'de sadece "Şikayet (Report)" — ayrı rol sistemi yok | Basitlik — moderatör rolü gerçek kullanım verisi birikince eklenecek |
| Oy mekanizması MVP'de basit yukarı-oy (yön yok, upvote-only) | findings.md'deki üç modelden en hafifi |
| Birincil organizasyon ekseni YÜZEY'dir (Category.surface); Yapım/Evren organizasyon seviyesi değil, çapraz-kesen TAG | learned-rules'ta kilitli — hiçbir yüzey yapıma/evrene göre klasörlenmez, tek global liste + tag + iki giriş noktası |
| `content.js` (theories/news/blogPosts) → tek `threads` dizisi DEĞİL; `Category.surface` alanıyla ayrışan model | learned-rules: News, Blog'dan ayrı bir surface'tır |

## Çözülmemiş sorular (Community'ye başlanınca netleşecek)

1. learned-rules içi çelişki: evren organizasyon seviyesi mi, yoksa salt tag mi.
2. İç URL/navigasyonda yapım adının görünürlüğü.
3. Evren ataması (editöryel veri): GoT+HotD → Westeros aday; diğerleri evrensiz.

## Bu oturumdan çıkan dersler

| Durum | Ders |
|-------|------|
| Community, yapım sayfasının İÇİNE gömülü component olarak tasarlanmaya başlandı, kullanıcı düzeltti | "Topluluk sayfası bağımsız olsun" — proje-bağımsız düşünülmesi gerektiğinde erken koda/projeye bağlanmamak gerekiyor |
| Bu oturum `learned-rules`'ta önceden kilitli bir Community mimarisinden habersiz sıfırdan araştırma yaptı, çelişen bir model üretti | Yeni bir mimari oturumuna başlamadan ÖNCE learned-rules'ta o alanla ilgili önceden kilitli karar olup olmadığı kontrol edilmeli |
| Plan dosyası "Phase" checklist + "sıradaki adım" diliyle yazılınca kullanıcıyı gereksiz katı bir sıraya soktu, henüz bilinmeyen kararları (MVP kapsamı gibi) plana dahil etmeye itti | Planlama dosyaları bağlayıcı iş listesi değil, referans notu olarak tutulmalı; MVP/sıra kararı iş fiilen başlarken verilir |
