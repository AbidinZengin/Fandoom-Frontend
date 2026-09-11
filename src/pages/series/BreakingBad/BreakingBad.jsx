import { useEffect, useState } from 'react';
import { Footer } from '../../../components/Footer/Footer';
import Hero from './Hero/Hero';
import SeasonRoute from './SeasonRoute/SeasonRoute';

// OldHero (eski SeriesHero editör sistemiyle çalışan hero) kullanıcı
// kararıyla route'tan kaldırıldı (2026-08) — yeni Hero PageBuilder'ın
// "Kodu Üret" çıktısı, kendi verisini kendi çeker (bkz. Hero/Hero.jsx).
// Eski dosyalar BİLEREK silinmedi, bkz. src/pages/series/BreakingBad/OldHero/.
// TitleSequence (eski Hero — jenerik periyodik-tablo animasyonu) kullanıcı
// kararıyla sayfadan kaldırıldı (2026-08); dosya BİLEREK silinmedi, geri
// eklenmek istenirse: import { TitleSequence } from './TitleSequence/TitleSequence';
import { fetchProductionDetail, theme } from './BreakingBad.data';
import styles from './BreakingBad.module.css';

export default function BreakingBad() {
  const [series, setSeries] = useState(null);
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
      <Hero />
      <SeasonRoute />
      <Footer />
    </>
  );
}
