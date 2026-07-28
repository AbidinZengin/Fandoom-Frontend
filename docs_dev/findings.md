# Findings — Topluluk/Forum mimarisi araştırması

## Phase 0 — Genel forum/community mimarisi (proje-bağımsız)

### Temel hiyerarşi (Discourse/phpBB/vBulletin ortak deseni)
Kategori (Category/Board) → [Alt-kategori] → Konu (Thread/Topic) → Gönderi (Post/Reply).
Tag = yatay/çapraz sınıflandırma (n-n). Kural: kategori = "nerede yaşıyor" (az sayıda,
yapısal, izin/moderasyon sınırı), tag = "ne hakkında" (serbest, çok sayıda, filtrelenebilir).
Kaynak: Discourse Meta "Categories vs. tags".

### Blog, forum'un içinde mi ayrı mı
Fandom.com 2021'de ayrı "Forum" modülünü kaldırıp tek "Discussions" sistemine
birleştirdi; "News" o akış içinde kısıtlı-yazma bir post tipi/kategori. WordPress+bbPress
de forumu blog'a "custom post type" olarak gömer, ayrı DB değil.
Sonuç: Blog/Duyuru = ayrı modül DEĞİL, kısıtlı-yazma (editör-only) bir tip/kategori.
Kaynak: community.fandom.com/wiki/Help:Discussions, Help:Forum

### "Teoriler" gibi özel içerik türü — 3 model
1. Reddit flair modeli — post tablosunda `type`/`flair` alanı (en hafif)
2. Discourse kategori+tag hibriti — kendi kategorisi + tag alt-sınıflama
3. StackExchange "question type" — tipe bağlı zorunlu alanlar (en karmaşık)
Fandoom için önerilen: (2) hibrit — Teoriler kendi tipi/kategorisi, tag ile detaylandırma.

### Temel veri modeli (Flarum şeması + genel ER modelleri)
- User 1—n Post, 1—n Thread (başlatan)
- Category 1—n Thread; Category 1—n Category (self-ref, alt-kategori)
- Thread 1—n Post
- Tag n—n Thread (junction: discussion_tag)
- Vote/Reaction: User n—n Post/Thread (junction, yön/tip alanıyla)
- Report/Flag: User 1—n, status (pending/reviewed/dismissed)
- Notification: User 1—n, olay bazlı
- Role/Group n—n User, Role 1—n Permission (grup bazlı izin, bireysel istisna değil)
Kaynak: Flarum DB şeması (drawsql.app/templates/flarum), docs.flarum.org/extend/models

### Moderasyon
Admin → Moderator (kategori/global) → User, grup bazlı izin (phpBB deseni).
Flagging → moderatör kuyruğu → durum makinesi.
Post-moderasyon (riskli/spekülatif kategoriler, ör. Teoriler) vs Pre-moderation
(yeni/güvensiz kullanıcının ilk N gönderisi) — Discourse "trust level" bunu otomatikleştirir.

### Araç/teknoloji manzarası
| Araç | Teknoloji | Not |
|---|---|---|
| Discourse | Rails+Ember+Postgres+Redis | En olgun, API güçlü, headless kullanılabilir |
| Flarum | Laravel+MySQL | En hafif, "her şey extension" |
| NodeBB | Node.js+Redis/Mongo | Gerçek zamanlı çekirdekte |
| phpBB | LAMP | Ücretsiz, eski mimari |
| Vanilla Forums | kapalı kaynak | Artık sadece SaaS |
| Disqus | SaaS widget | Sadece blog yorumu |

Spring Boot+React'te yaygın pattern: Spring Security+JWT (auth), Spring WebSocket+
STOMP+SockJS (gerçek zamanlı, production'da RabbitMQ broker), Postgres FTS→
Elasticsearch (ölçek büyüyünce).

### MVP vs sonra
MVP: Auth+RBAC, konu/yorum CRUD, basit upvote (UNIQUE constraint), Postgres FTS,
rate limiting, markdown editör, temel bildirim.
Sonra: WebSocket canlı güncelleme, Elasticsearch/Algolia, AI moderasyon,
rozet/gamification, WYSIWYG editör, CAPTCHA.

### Sosyal kanıt / etkileşim araştırması (erken faz, GoT-sayfası-içi widget denemesi sırasında)
- IMDb 2017'de canlı message board'ları tamamen kapattı (moderasyon riski) —
  büyük prestij siteleri UGC'yi çıplak göstermekten kaçınıyor, editöryel küratörlük tercih ediyor.
- Fandom.com'un kendi ürünü DiscussionsRailModule: makaleye etiketli postlardan
  3 tanesini önizler, "tümünü gör" ile tam thread'e gider.
- Düşük/sahte sayısal sosyal kanıt (yorum sayısı vb.) güven kırabilir — literatür
  net değil ama "az veri = güvensizlik" riski var (NN/g, arXiv 2025 ranking-effect çalışması).
- Az veriyle inandırıcı görünme teknikleri: avatar stack ("+N kişi"), relatif zaman
  damgası, Fandom'un SpoilerBlur/SpoilerTags deseni (fandom'a özgü, jenerik forumda yok).
- Sahte "trending" rozeti / sahte aktivite göstergesi ETİK RİSK olarak işaretlendi.

## Phase 1-2 — Fandoom'a uyarlama (kullanıcı diyaloğuyla evrilen kararlar)

### Reddedilen ilk model: Yapım-altı gömülü
İlk öneri: Community = Production altında yaşayan bir bölüm (GoT sayfası içine
gömülü "Community" section'ı, matris: Yapım × Tip). Kullanıcı reddetti:
"topluluk yapımın altında yaşamasın, topluluk kısmının alt başlığında yapımların
başlıklarıyla ayrılmış kısımlar olsun" → üst-alt ilişkisi TERS çevrildi.

### Kabul edilen model: Topluluk bağımsız, içinde yapıma göre ayrım
```
TOPLULUK (/community, bağımsız üst-seviye)
  ├─ Game of Thrones → Teoriler / Tartışmalar / Haberler
  ├─ Severance → ...
  └─ ...
```
Yapım sayfasına (GoT dizi sayfası) gömülü bölüm YOK — en fazla topluluğa köprü link.

### Açık dallanma: tekil-yapım vs evren/franchise
İkinci soru olarak kullanıcıya soruldu (henüz cevaplanmadı):
- (A) Tekil yapım başlığı bazlı — GoT, Severance, From ayrı ayrı bölümler.
- (B) Evren/franchise bazlı — Westeros (GoT+House of the Dragon birleşik),
  tek başına yapımlar 1-üyeli evren sayılır.
Trade-off analizi yapıldı: (B) çapraz-evren içeriği (ör. HotD'nin Targaryen teorisi
GoT'u da ilgilendirir) doğal çözer, küçük yapımların topluluğunun ince/boş kalma
riskini azaltır; ama yeni bir Franchise entity + editöryel "hangi yapım hangi
evrene ait" kararı gerektirir. (A) basit ama çapraz-evren içerik parçalanır.
Not: (B), (A)'nın üst-kümesi sayılabilir — baştan "evren" katmanı (çoğu yapım
1-üyeli) kurulursa ileride göç gerekmez.

### Mevcut yapım envanteri (productions.js'ten, GoT/HotD dışında evren ilişkisi yok)
Game of Thrones, House of the Dragon (→ olası "Westeros" evren adayı),
Severance, From, Stranger Things, The Bear — geri kalanı şu an bağımsız.

## Phase 2b — Tekil-yapım vs Evren/Franchise UX araştırması

Somut platform gözlemleri:
- **Fandom.com (en net sinyal):** Wiki of Westeros (gameofthrones.fandom.com) GoT+HotD'yi
  TEK wiki'de barındırıyor, ayrı "HotD Wiki" yok. MCU wiki de tüm film/dizileri tek çatıda
  toplar. Fandom'un varsayılan/baskın mimarisi EVREN-BAZLI birleşik.
- **Reddit:** r/StarWars (4.6M) evrenin ana kapısı, tekil-dizi subreddit'leri (r/andor,
  r/ahsoka) çok daha küçük kalıyor — asıl trafik ana evren subreddit'inde. Ama
  r/HouseOfTheDragon zamanla r/gameofthrones'tan ORGANİK olarak ayrıştı (kendi kritik
  kütlesini kazandıktan SONRA) — yani ayrışma sonradan düşük-risk bir adım, baştan
  parçalayıp sonra birleştirmek (migration) çok daha zor.
- **Steam:** Her oyun teknik olarak ayrı hub'a sahip AMA Ubisoft bunun yetersizliğini
  görüp Animus Hub'ı (Assassin's Creed serisi için birleşik) kurdu — parçalanmanın
  sorun yarattığının dolaylı kanıtı.
- **GameFAQs:** tekil-oyun bazlı board'lar, ama bunlar sosyal topluluk değil
  referans-arşiv/walkthrough mantığı — farklı bir kullanım amacı, doğrudan emsal değil.

UX prensibi (heuristik):
- Tekil-başlık iyi çalışır: yapım tek başına devasa kitleye ulaşmışsa VEYA arama/SEO
  girişi doğrudan yapım adına bağlıysa.
- Evren-bazlı birleşme iyi çalışır: platform henüz kritik kütleye ulaşmamışsa
  (ghost-town riski — literatürde ~20-50 aktif üye eşiği), yapımlar arası lore/karakter
  geçişkenliği yüksekse.

**Sonuç/tavsiye:** Fandoom yeni bir platform (kritik kütle yok) → Model B (evren-bazlı)
önerildi. Ayrışma ileride organik olarak (bir yapım gerçekten büyürse) düşük riskle
yapılabilir; tersi zor. Karşıt sinyal: SEO/arama girişi yapım adına bağlı — iç
navigasyonda yapım adı görünür tutularak (alt-filtre/URL) telafi edilebilir.

Kaynaklar: gameofthrones.fandom.com/wiki/Wiki_of_Westeros,
marvelcinematicuniverse.fandom.com, Ubisoft Animus Hub (gamedeveloper.com),
"An empirical study of critical mass and online community survival" (ACM DL),
theadminzone.com "Ghost Town Effect".
