import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Footer } from '../../../components/Footer/Footer';
import Hero from './Hero/Hero';
import { fetchProductionDetail, theme } from './Zodiac.data';
import styles from './Zodiac.module.css';

export default function Zodiac() {
  const { t } = useTranslation();
  const [movie, setMovie] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const backdropRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchProductionDetail('movie', 'zodiac')
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

    return () => {
      root.style.setProperty('--bg', prev.bg || '#050505');
      root.style.setProperty('--accent', prev.accent || '#a02cd8');
      root.style.setProperty('--card-bg', prev.cardBg || '#101012');
    };
  }, [movie]);

  if (notFound) {
    return (
      <>
        <div className={styles['zodiac-notfound']}>
          <h1 className={styles['zodiac-notfound__title']}>{t('common.titleNotFound')}</h1>
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
      </div>
      <Footer />
    </>
  );
}
