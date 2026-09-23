import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Footer } from '../../components/Footer/Footer';
// Yol bilerek büyük "Series": App.jsx/Series.jsx aynı yazımı kullanıyor, farklı
// yazım Vite'ta aynı dosyayı ikinci bir modül olarak yükler (bkz. klasör case notu).
import { SeriesHero } from '../Series/SeriesHero/SeriesHero';
import { getAllMovies } from './Movies.data';
import styles from './Movies.module.css';

// Movies hub — Series hub'ın birebir aynısı (kullanıcı kararı, 2026-09-23):
// aynı Hero, farklı veri kaynağı ve detay yolu.
export default function Movies() {
  const { t } = useTranslation();
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getAllMovies().then((data) => {
      if (!cancelled) setMovies(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <h1 className={styles.movies__badge}>{t('moviesHub.heading')}</h1>

      <SeriesHero items={movies} basePath="/movies" />

      <Footer />
    </>
  );
}
