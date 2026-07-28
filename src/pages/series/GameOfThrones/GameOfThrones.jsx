import { useEffect, useState } from 'react';
import { Footer } from '../../../components/Footer/Footer';
import { Hero } from './Hero/Hero';
import { Intro } from './Intro/Intro';
import { ScrollStepper } from './ScrollStepper/ScrollStepper';
import { TabExhibit } from './TabExhibit/TabExhibit';
import { fetchProductionDetail, theme } from './GameOfThrones.data';
import styles from './GameOfThrones.module.css';

export default function GameOfThrones() {
  const [series, setSeries] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchProductionDetail('series', 'game-of-thrones')
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
    root.style.setProperty('--card-bg', theme.bg);

    return () => {
      root.style.setProperty('--bg', prev.bg || '#050505');
      root.style.setProperty('--accent', prev.accent || '#a02cd8');
      root.style.setProperty('--card-bg', prev.cardBg || '#101012');
    };
  }, [series]);

  if (notFound) {
    return (
      <>
        <div className={styles['got-notfound']}>
          <h1 className={styles['got-notfound__title']}>Title not found.</h1>
        </div>
        <Footer />
      </>
    );
  }

  if (!series) return null;

  return (
    <>
      <Hero entityId={series.id} title={series.title} synopsis={series.synopsis} />
      <Intro entityId={series.id} />
      <ScrollStepper entityId={series.id} />
      <TabExhibit entityId={series.id} />
      <Footer />
    </>
  );
}
