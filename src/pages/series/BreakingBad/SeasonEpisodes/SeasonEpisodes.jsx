import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Footer } from '../../../../components/Footer/Footer';
import { Hero } from './Hero/Hero';
import { SeasonRow } from './SeasonRow/SeasonRow';
import { theme } from '../BreakingBad.data';
import { fetchProductionDetail } from './SeasonEpisodes.data';
import styles from './SeasonEpisodes.module.css';

gsap.registerPlugin(ScrollTrigger);

// GoT'un SeasonEpisodes'unun (src/pages/series/GameOfThrones/SeasonEpisodes)
// BİREBİR aynısı — kullanıcı kararı, 2026-08: "yeni bir varyant uydurulmaz"
// (learned-rules [yapı]). Önceki özel-tasarım denemeleri (SeasonMenu —
// PageBuilder codegen sabit-canvas; SeasonRoute — Dribbble travel-carousel,
// hiç routelanmadı) bu sayfanın YERİNE geçti.
export default function SeasonEpisodes() {
  const { t } = useTranslation();
  const [series, setSeries] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [openSeasonId, setOpenSeasonId] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchProductionDetail('series', 'breaking-bad')
      .then((data) => {
        if (!cancelled) setSeries(data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // BB tema rengini basar (learned-rules: "Yapım sayfaları TAM TEMA
  // kurar") — BreakingBad.jsx/SeasonDetail ile aynı davranış.
  useEffect(() => {
    if (!series) return undefined;
    const root = document.documentElement;
    const prev = {
      bg: root.style.getPropertyValue('--bg'),
      accent: root.style.getPropertyValue('--accent'),
      cardBg: root.style.getPropertyValue('--card-bg'),
    };

    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--card-bg', theme.cardBg);

    return () => {
      root.style.setProperty('--bg', prev.bg || '#050505');
      root.style.setProperty('--accent', prev.accent || '#a02cd8');
      root.style.setProperty('--card-bg', prev.cardBg || '#101012');
    };
  }, [series]);

  // Liste bölüme girerken imza-dalga ile açığa çıkar (learned-rules: marka
  // hareket dili, section entrance sinyali) — bir kez, kalıcı olarak.
  useLayoutEffect(() => {
    if (!series) return undefined;
    const list = listRef.current;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(list.querySelectorAll('[data-row]'), {
          opacity: 0,
          x: 140,
          y: 56,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          clearProps: 'opacity,transform',
          scrollTrigger: { trigger: list, start: 'top 85%', once: true },
        });
      });
    }, listRef);

    return () => ctx.revert();
  }, [series]);

  if (notFound) {
    return (
      <>
        <div className={styles.notfound}>
          <h1 className={styles.notfound__title}>{t('common.titleNotFound')}</h1>
        </div>
        <Footer />
      </>
    );
  }

  if (!series) return null;

  return (
    <>
      <Hero />
      <section className={styles.list} aria-label={t('series.seasonsHeading')} ref={listRef}>
        {series.seasons.map((season) => (
          <SeasonRow
            key={season.id}
            season={season}
            backdropImage={season.posterUrl}
            isOpen={openSeasonId === season.id}
            onToggle={() => setOpenSeasonId((current) => (current === season.id ? null : season.id))}
          />
        ))}
      </section>
      <Footer />
    </>
  );
}
