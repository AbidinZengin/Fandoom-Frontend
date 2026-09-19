import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Footer } from '../../components/Footer/Footer';
import { LeftSidebar } from './LeftSidebar/LeftSidebar';
import { RightSidebar } from './RightSidebar/RightSidebar';
import styles from './CommunityLayout.module.css';

// Community hub — bağımsız üst-seviye sayfa (learned-rules [[topluluk-yapı]]:
// yapım sayfalarının İÇİNE gömülmez). 3-kolon layout: sol kişisel/kütüphane,
// orta akış (Outlet — index/discussion/theories/fan-art route'ları), sağ
// keşif. Sürekli akış modeli (kullanıcı kararı, 2026-09-13 — learned-rules
// [[topluluk-navigasyon]]/[[topluluk-kart]] bu kararla güncellendi). Eski
// UniverseBrowse şeridi buradan KALKTI (kullanıcı düzeltmesi: eski sayfadan
// olduğu gibi taşınmıştı) — evren keşfi RightSidebar'daki Universes
// widget'ına, bu tasarımın kendi diline uyarlanmış hâliyle taşındı.
export default function CommunityLayout() {
  const { t } = useTranslation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <div className={styles.communityLayout}>
        <h1 className={styles.communityLayout__srHeading}>{t('navbar.community')}</h1>

        <button
          type="button"
          className={styles.communityLayout__mobileToggle}
          onClick={() => setMobileNavOpen(true)}
          aria-label={t('account.nav.openMenu')}
        >
          {t('community.myLibrary')}
        </button>

        <div className={styles.communityLayout__grid}>
          <LeftSidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

          <main className={styles.communityLayout__main}>
            <Outlet />
          </main>

          <RightSidebar />
        </div>
      </div>

      <Footer />
    </>
  );
}
