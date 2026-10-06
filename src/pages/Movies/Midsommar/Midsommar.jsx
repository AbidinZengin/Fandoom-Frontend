import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { applyAccentGradient } from '../../../shared/theme/accentGradient';
import { Footer } from '../../../components/Footer/Footer';
import Hero from './Hero/Hero';
import Atmosphere from './Atmosphere/Atmosphere';
import CharactersRoute from './CharactersRoute/CharactersRoute';
import { fetchProductionDetail, theme, ATMOSPHERE_EYEBROW } from './Midsommar.data';
import styles from './Midsommar.module.css';

export default function Midsommar() {
  const { t } = useTranslation();
  const [movie, setMovie] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const backdropRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchProductionDetail('movie', 'midsommar')
      .then((data) => {
        if (!cancelled) setMovie(data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!movie) return undefined;
    const root = document.documentElement;
    const prev = {
      bg: root.style.getPropertyValue('--bg'),
      accent: root.style.getPropertyValue('--accent'),
      cardBg: root.style.getPropertyValue('--card-bg'),
    };

    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--card-bg', theme.cardBg);
    const restoreGradient = applyAccentGradient('midsommar');

    return () => {
      restoreGradient();
      root.style.setProperty('--bg', prev.bg || '#050505');
      root.style.setProperty('--accent', prev.accent || '#a02cd8');
      root.style.setProperty('--card-bg', prev.cardBg || '#101012');
    };
  }, [movie]);

  if (notFound) {
    return (
      <>
        <div className={styles['midsommar-notfound']}>
          <h1 className={styles['midsommar-notfound__title']}>{t('common.titleNotFound')}</h1>
        </div>
        <Footer />
      </>
    );
  }

  if (!movie) return null;

  return (
    <>
      <div className={styles.intro}>
        <img ref={backdropRef} className={styles.intro__backdrop} src={movie.coverImageUrl} alt="" />
        <Hero backdropRef={backdropRef} />
        <Atmosphere movie={movie} eyebrow={ATMOSPHERE_EYEBROW} />
      </div>
      <CharactersRoute />
      <Footer />
    </>
  );
}
