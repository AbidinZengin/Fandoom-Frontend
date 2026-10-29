import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { Footer } from '../../components/Footer/Footer';
import { LeftSidebar } from './LeftSidebar/LeftSidebar';
import { RightSidebar } from './RightSidebar/RightSidebar';
import { MobileNav } from './MobileNav/MobileNav';
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
// /community + discussion/theories/fan-art: SurfaceFilter sekmelerinin route'ları.
const FEED_TAB_PATH = /^\/(?:[a-z]{2}\/)?community(?:\/(?:discussion|theories|fan-art))?\/?$/;

export default function CommunityLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const gridRef = useRef(null);
  const leftWidth = useCommunityLayoutStore((s) => s.leftWidth);
  const rightWidth = useCommunityLayoutStore((s) => s.rightWidth);
  const leftMode = useCommunityLayoutStore((s) => s.leftMode);
  const rightMode = useCommunityLayoutStore((s) => s.rightMode);
  const isDesktop = useSyncExternalStore(subscribeDesktop, getDesktop, () => true);

  // Community içi geçişte (sekme, feed↔detay, /portal↔/portal/x) App'teki sayfa
  // fade'i bilerek atlanır (menüler sabit kalmalı); yerine yalnız orta sütunun
  // blokları sırayla (kademeli) fade ile girer. İlk giriş atlanır (o PageTransition'ın işi).
  // useLayoutEffect: yeni içerik tam opaklıkta tek frame bile boyanmasın.
  const mainRef = useRef(null);
  const prevPathname = useRef(pathname);
  useLayoutEffect(() => {
    const previous = prevPathname.current;
    if (previous === pathname) return undefined;
    prevPathname.current = pathname;
    // Feed türü sekmeleri arası geçişi Feed kendi gövdesinde animasyonlar —
    // sütunu fade'lemek composer ve sekme çubuğunu da yakıp söndürürdü.
    if (FEED_TAB_PATH.test(previous) && FEED_TAB_PATH.test(pathname)) return undefined;

    // Sütunun çocukları animasyonlanır; breadcrumb gibi kalıcı öğeler
    // (data-route-persist) yerinde kalır, yalnız içerik değişir.
    const targets = [...mainRef.current.children].filter((el) => !el.hasAttribute('data-route-persist'));

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        targets,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: 'power2.out', stagger: 0.07, clearProps: 'opacity' }
      );
    });
    return () => mm.revert();
  }, [pathname]);

  // Oturum açıksa düzen tercihi hesapla eşitlenir (oturumsuzken istek atılmaz).
  useEffect(() => {
    useCommunityLayoutStore.getState().syncWithAccount();
  }, []);

  return (
    <>
      <div className={styles.communityLayout} data-community-canvas>
        <h1 className={styles.communityLayout__srHeading}>{t('navbar.community')}</h1>

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

          <main ref={mainRef} className={styles.communityLayout__main}>
            <Outlet />
          </main>

          <Splitter side="right" gridRef={gridRef} />
          <RightSidebar collapsed={rightMode === 'hidden'} />
        </div>
      </div>

      <Footer />
      {/* Mobilde yüzen alt çubuk Footer'ın son satırını örtmesin diye boşluk. */}
      <div className={styles.communityLayout__navSpacer} aria-hidden="true" />
      <MobileNav menuOpen={mobileNavOpen} onOpenMenu={() => setMobileNavOpen(true)} />
    </>
  );
}
