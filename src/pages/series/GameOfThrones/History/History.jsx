import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '../../../../components/Footer/Footer';
import { fetchProductionDetail, theme } from './History.data';
import { HistoryBlocks } from './HistoryBlocks/HistoryBlocks';
import styles from './History.module.css';

// EpisodePage/WorldMap ile aynı desen: sayfa sadece series'i çözer ve GoT
// temasını basar, gerçek içerik (dönem-dönem anlatı) HistoryBlocks'a ait —
// o kendi verisini seriesId ile kendi çeker.
export default function History() {
  const navigate = useNavigate();
  const [series, setSeries] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchProductionDetail('series', 'game-of-thrones').then((data) => {
      if (!cancelled) setSeries(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // GoT tema rengini basar (learned-rules: "Yapım sayfaları TAM TEMA kurar",
  // bg/card-bg istisnası WorldMap/EpisodePage ile aynı).
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

  if (!series) return null;

  return (
    <>
      <button type="button" className={styles.back} onClick={() => navigate(-1)}>
        <span aria-hidden="true">&#8249;</span>
        <span>Back</span>
      </button>

      <HistoryBlocks seriesId={series.id} />
      <Footer />
    </>
  );
}
