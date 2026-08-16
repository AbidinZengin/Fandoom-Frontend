import { useEffect, useState } from 'react';
import { Footer } from '../../../components/Footer/Footer';
import { Hero } from './Hero/Hero';
import { MOCK_RELEASE_YEAR } from './Hero/Hero.data';
// TitleSequence (eski Hero — jenerik periyodik-tablo animasyonu) kullanıcı
// kararıyla sayfadan kaldırıldı (2026-08); dosya BİLEREK silinmedi, geri
// eklenmek istenirse: import { TitleSequence } from './TitleSequence/TitleSequence';
import { fetchProductionDetail, resolveGenreNames, theme } from './BreakingBad.data';
import styles from './BreakingBad.module.css';

export default function BreakingBad() {
  const [series, setSeries] = useState(null);
  const [genreNames, setGenreNames] = useState([]);
  const [notFound, setNotFound] = useState(false);

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

  // Genre isimleri diziye bağlı, bölüme değil — dizi verisi gelince bir kez
  // çözülür (EpisodePage'teki desenin aynısı).
  useEffect(() => {
    if (!series) return undefined;
    let cancelled = false;
    resolveGenreNames(series.genreIds).then((names) => {
      if (!cancelled) setGenreNames(names);
    });
    return () => {
      cancelled = true;
    };
  }, [series]);

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
        <div className={styles['bb-notfound']}>
          <h1 className={styles['bb-notfound__title']}>Title not found.</h1>
        </div>
        <Footer />
      </>
    );
  }

  if (!series) return null;

  return (
    <>
      <Hero
        genres={genreNames}
        seasonCount={series.seasons?.length}
        releaseYear={MOCK_RELEASE_YEAR}
      />
      <Footer />
    </>
  );
}
