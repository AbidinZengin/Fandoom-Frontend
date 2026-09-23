# Community Portal - Backend İhtiyaç Analizi ve Planı (20 Eylül 2026)

Bu belge, Frontend UX/UI kararları doğrultusunda "Community" sayfası için gereken yeni backend mimarisini, uç noktaları ve iş kurallarını tanımlar.

## 1. Veri Modeli
*   **Portal:** `id`, `slug` (benzersiz, URL'de kullanılır), `ad` ve `açıklama` (TR/EN, mevcut i18n tasarımındaki kalıpla), `bannerUrl` (afiş), `iconUrl`, `status` (ACTIVE / ARCHIVED / HIDDEN), `sortOrder`, `createdAt`.
*   **PortalProduction (n-n):** Bir portala 0..N yapım bağlanır. Örn: Westeros = GoT + HotD. "Genel Sohbet" = hiç yapım yok.
*   **Thread:** `portalId` alanı ZORUNLU hale gelir (FK). (1-n ilişki. Her post mutlak suretle bir portala aittir). Mevcut thread'ler için migration gerekir.
*   **PortalMembership:** `userId`, `portalId`, `joinedAt`. Ayrıca denormalize `memberCount` ve `threadCount` sayaçları (idempotent kalıp).

## 2. Endpoint'ler
*   `GET /community/portals`: sort=trending|members|new|alpha, limit, sayfalama. (Dizin sayfası ve Top Portals için).
*   `GET /community/portals/{slug}`: Portal detay (Kapak resmi, üye sayısı vb).
*   `GET /community/feed?portal={slug}`: Mevcut surface/sort ile birleşir.
*   `POST /community/threads`: Mevcut uca zorunlu `portalId` eklenir. Yanıtta portalın `id` ve `slug`'ı dönmeli.
*   `POST/DELETE /community/portals/{slug}/join`: Idempotent katılım işlemi (Üye ol / Ayrıl).
*   `GET /me/portals`: Auth gerektirir. Sol menüde kullanıcının takip ettiği "Portallarım" listesi.
*   `POST/PATCH/DELETE /admin/portals`: Portalları SADECE admin açar. Silme işlemi soft-delete (status) olmalıdır.

## 3. Alınan Kararlar ve İş Kuralları (Açık Soruların Cevapları)

1.  **"Üye" Ne Demek?**
    *   Katılım tablosudur (`PortalMembership`). Kullanıcı "Katıl/Takip Et" butonuna basınca bu tabloya işlenir. Sadece takip amaçlıdır, yetki/rol değildir. Sol menüdeki kişiselleştirilmiş "Portallarım" akışını besler.
2.  **Post URL'i ID mi Slug mı?**
    *   SEO ve hız için Karma (Hybrid) yapı kullanılmalıdır: `/portal/{portal-slug}/post/{id}-{post-slug}`.
    *   Backend yönlendirmeyi ve veritabanı sorgusunu SADECE `{id}` üzerinden yapmalıdır. Sondaki slug tamamen Frontend/SEO süsüdür (URL değişse bile id sabit kaldığı için post kırılmaz).
3.  **[topluluk-organizasyon] Kural Çakışması:**
    *   Eski `[topluluk-organizasyon]` kuralındaki "evren klasör değil, çapraz-kesen etiket" mantığı **tamamen iptal edilmiştir.**
    *   YENİ KURAL: Portal (Evren), kesinlikle bir **ODADIR (Klasördür)**. Her postun mecburi bir odası (`portalId`) olmak zorundadır (1-n ilişkisi). Bu yeni PRD kuralı geçerlidir.
4.  **Trending Tanımı:**
    *   Son 7 gün post + yorum + beğeni ağırlıklı, on-the-fly agregasyon başlangıç ve orta ölçek için fazlasıyla yeterlidir.

## 4. Backend Geliştirme Sırası
*   **Faz B1 (FE Bloke Kaldırma):** Portal tablosu + seed data. Thread'e `portalId` eklenmesi + migration. Yanıtta portal bilgisinin dönmesi ve `feed ?portal=` filtresi. (Composer, Kart ve Detay breadcrumb'ı için).
*   **Faz B2 (Dizin ve Keşif):** `GET /portals` (trending + dizin listesi, memberCount dahil).
*   **Faz B3 (Üyelik ve Admin):** join/leave mekanizması, `/me/portals`, admin CRUD ekranı, post taşıma moderasyonu.
