import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllProductions } from '../../../shared/api/productions';
import styles from './SeriesHeroList.module.css';

// BlogList'in Series karşılığı — ama "+ New" YOK: Series zaten var olan
// yapımlar (productions API'den), burada sadece hangisinin Hero'sunu
// düzenleyeceğini seçmek için liste. MOVIE'ler filtrelenir — Hero editörü
// şimdilik yalnız SeriesHeroBlock (dizi) için tasarlandı.
export default function SeriesHeroList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAllProductions()
      .then((all) => {
        if (!cancelled) setItems(all.filter((p) => p.type === 'SERIES'));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className={styles.seriesHeroList}>
      <header className={styles.seriesHeroList__head}>
        <h1 className={styles.seriesHeroList__title}>Series Heroes</h1>
      </header>

      {loading && <p className={styles.seriesHeroList__status}>Loading…</p>}
      {error && <p className={styles.seriesHeroList__status}>Failed to load.</p>}

      {!loading && !error && (
        <ul className={styles.seriesHeroList__items}>
          {items.map((item) => (
            <li key={item.id} className={styles.seriesHeroList__item}>
              <Link to={`/admin/series-hero/${item.id}`} className={styles.seriesHeroList__itemLink}>
                {item.posterUrl && <img className={styles.seriesHeroList__thumb} src={item.posterUrl} alt="" />}
                <span className={styles.seriesHeroList__itemTitle}>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
