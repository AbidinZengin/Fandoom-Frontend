import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Footer } from '../../components/Footer/Footer';
import { SeriesHero } from './SeriesHero/SeriesHero';
import { getAllSeries } from './Series.data';
import styles from './Series.module.css';

// Series hub — Hero kendi "Featured Titles" şeridini taşıdığı için
// (kullanıcı kararı) sayfa burada ayrı bir katalog grid'i TEKRARLAMAZ.
export default function Series() {
  const { t } = useTranslation();
  const [series, setSeries] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getAllSeries().then((data) => {
      if (!cancelled) setSeries(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {/* Hero artık tam viewport genişliğinde/yüksekliğinde — sarmalayıcı
          padding/max-width kaldırıldı. Başlık, Hero'nun ÜSTÜNE sabitlenmiş
          küçük bir köşe etiketi (kullanıcı kararı: "sol üst köşede sabit,
          hero onun altında kalsın"). */}
      <h1 className={styles.series__badge}>{t('seriesHub.heading')}</h1>

      <SeriesHero items={series} />

      <Footer />
    </>
  );
}
