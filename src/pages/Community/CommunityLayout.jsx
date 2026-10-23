import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Footer } from '../../components/Footer/Footer';
import { LeftSidebar } from './LeftSidebar/LeftSidebar';
import { RightSidebar } from './RightSidebar/RightSidebar';
import { Splitter } from './layout/Splitter/Splitter';
import { useCommunityLayoutStore } from './layout/useCommunityLayoutStore';
import styles from './CommunityLayout.module.css';

// Community hub — bağımsız üst-seviye sayfa (learned-rules [[topluluk-yapı]]:
// yapım sayfalarının İÇİNE gömülmez). 3-kolon layout: sol kişisel/kütüphane,
// orta akış (Outlet — index/discussion/theories/fan-art route'ları), sağ
// keşif. Sürekli akış modeli (kullanıcı kararı, 2026-09-13 — learned-rules
// [[topluluk-navigasyon]]/[[topluluk-kart]] bu kararla güncellendi). Eski
// UniverseBrowse şeridi buradan KALKTI (kullanıcı düzeltmesi: eski sayfadan
// olduğu gibi taşınmıştı) — evren keşfi RightSidebar'daki Universes
// widget'ına, bu tasarımın kendi diline uyarlanmış hâliyle taşındı.
// Ray ve ayırıcılar yalnız masaüstü 3-kolon düzeninde var (CSS kırılımıyla aynı
// 1201px); altında sol kolon sabit genişlikli/çekmece, ray içeriği gösterilmez.
const DESKTOP_QUERY = '(min-width: 1201px)';
function subscribeDesktop(onChange) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
const getDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;

export default function CommunityLayout() {
  const { t } = useTranslation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const gridRef = useRef(null);
  const leftWidth = useCommunityLayoutStore((s) => s.leftWidth);
  const rightWidth = useCommunityLayoutStore((s) => s.rightWidth);
  const leftMode = useCommunityLayoutStore((s) => s.leftMode);
  const rightMode = useCommunityLayoutStore((s) => s.rightMode);
  const isDesktop = useSyncExternalStore(subscribeDesktop, getDesktop, () => true);

  // Oturum açıksa düzen tercihi hesapla eşitlenir (oturumsuzken istek atılmaz).
  useEffect(() => {
    useCommunityLayoutStore.getState().syncWithAccount();
  }, []);

  return (
    <>
      <div className={styles.communityLayout} data-community-canvas>
        <h1 className={styles.communityLayout__srHeading}>{t('navbar.community')}</h1>

        <button
          type="button"
          className={styles.communityLayout__mobileToggle}
          onClick={() => setMobileNavOpen(true)}
          aria-label={t('account.nav.openMenu')}
        >
          {t('community.myLibrary')}
        </button>

        {/* Kolon genişlikleri CSS değişkeni: Splitter sürüklerken bu değişkeni
            doğrudan yazar (render yok), bırakınca store → buradaki style güncellenir. */}
        <div
          ref={gridRef}
          className={styles.communityLayout__grid}
          style={{ '--col-left': `${leftWidth}px`, '--col-right': `${rightWidth}px` }}
          data-left-mode={leftMode}
          data-right-mode={rightMode}
        >
          <LeftSidebar
            mobileOpen={mobileNavOpen}
            collapsed={leftMode === 'hidden'}
            rail={leftMode === 'rail' && isDesktop}
            onClose={() => setMobileNavOpen(false)}
          />
          <Splitter side="left" gridRef={gridRef} />

          <main className={styles.communityLayout__main}>
            <Outlet />
          </main>

          <Splitter side="right" gridRef={gridRef} />
          <RightSidebar collapsed={rightMode === 'hidden'} />
        </div>
      </div>

      <Footer />
    </>
  );
}
