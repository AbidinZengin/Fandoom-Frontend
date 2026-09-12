import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Footer } from '../../../components/Footer/Footer';
import Hero from './Hero/Hero';
import Atmosphere from './Atmosphere/Atmosphere';
import { fetchProductionDetail, theme } from './HouseOfTheDragon.data';
import styles from './HouseOfTheDragon.module.css';
import SeasonRoute from './SeasonRoute/SeasonRoute';

// İskelet — Hero ve diğer bölümler henüz yok. Breaking Bad'deki desenle aynı:
// Hero PageBuilder'ın "Kodu Üret" çıktısı olarak ayrıca eklenecek (bkz.
// BreakingBad.jsx üstündeki yorum), bu sayfa şimdilik sadece PageBuilder'ın
// hedef sayfa listesinde seçilebilir olması için var.
export default function HouseOfTheDragon() {
  const { t } = useTranslation();
  const [series, setSeries] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const backdropRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchProductionDetail('series', 'house-of-the-dragon')
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
        <div className={styles['hotd-notfound']}>
          <h1 className={styles['hotd-notfound__title']}>{t('common.titleNotFound')}</h1>
        </div>
        <Footer />
      </>
    );
  }

  if (!series) return null;

  return (
    <>
      <div className={styles.intro}>
        <img ref={backdropRef} className={styles.intro__backdrop} src={series.coverImageUrl} alt="" />
        <Hero backdropRef={backdropRef} />
        <Atmosphere />
      </div>
      <SeasonRoute />
      <Footer />
    </>
  );
}
