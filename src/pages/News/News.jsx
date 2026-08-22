import { useTranslation } from 'react-i18next';
import { news } from './News.data';
import { NewsCard } from './NewsCard/NewsCard';
import { Footer } from '../../components/Footer/Footer';
import styles from './News.module.css';

// Community'nin NEWS yüzeyi — statik iskelet (motion YOK, component-dev
// adımı). İlk öğe 2x öne-çıkan kart, gerisi grid (learned-rules kart
// anatomisi: Medium/Substack featured deseni).
export default function News() {
  const { t } = useTranslation();
  const [featured, ...rest] = news;

  return (
    <>
      <section className={styles.news}>
        <header className={styles.news__head}>
          <span className={styles.news__kicker}>Fandoom</span>
          <h1 className={styles.news__heading}>{t('navbar.news')}</h1>
        </header>

        <div className={styles.news__grid}>
          {featured && <NewsCard item={featured} featured />}
          {rest.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
