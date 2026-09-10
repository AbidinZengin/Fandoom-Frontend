import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Footer } from '../../../components/Footer/Footer';
import Hero from './Hero/Hero';
// GEÇİCİ (karar için önizleme): ?hero=artdirector | cinematic ile Hero
// konsept karşılaştırması. Karar verilince bu iki import + seçim mantığı
// kaldırılacak.
import ArtDirectorHero from './Hero/ArtDirectorHero';
import CinematicHero from './Hero/CinematicHero';
import { fetchProductionDetail, theme } from './Severance.data';
import styles from './Severance.module.css';
import SeasonRoute from './SeasonRoute/SeasonRoute';
export default function Severance({ forceHero } = {}) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const heroVariant = forceHero ?? searchParams.get('hero');
  const HeroComponent =
    heroVariant === 'artdirector' ? ArtDirectorHero : heroVariant === 'cinematic' ? CinematicHero : Hero;
  const [series, setSeries] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchProductionDetail('series', 'severance')
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

  if (notFound) {
    return (
      <>
        <div className={styles['severance-notfound']}>
          <h1 className={styles['severance-notfound__title']}>{t('common.titleNotFound')}</h1>
        </div>
        <Footer />
      </>
    );
  }

  if (!series) return null;

  return (
    <>
      <HeroComponent />
      <SeasonRoute />
      <Footer />
    </>
  );
}
