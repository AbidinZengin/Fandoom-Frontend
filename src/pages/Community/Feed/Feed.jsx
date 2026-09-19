import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PostComposer } from './PostComposer/PostComposer';
import { SurfaceFilter } from './SurfaceFilter/SurfaceFilter';
import { SortBar } from './SortBar/SortBar';
import { FeedCard } from './FeedCard/FeedCard';
import { getFeedThreads, sortThreads } from './Feed.data';
import styles from './Feed.module.css';

const PAGE_SIZE = 5;

// index route'u (surface=undefined, karışık akış) VE discussion/theories/
// fan-art route'larını (surface sabit) TEK component karşılar — ayrı bir
// SurfaceFeed dosyası açmak burada gereksiz kopya olurdu (Karpathy ilkesi:
// istenenden fazla soyutlama yok); tek fark PostComposer'ın varsayılan
// yüzeyi ve listenin filtresi.
export default function Feed({ surface }) {
  const { t } = useTranslation();
  const [sort, setSort] = useState('hot');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [threads, setThreads] = useState(() => getFeedThreads(surface));

  useEffect(() => {
    setThreads(getFeedThreads(surface));
    setVisibleCount(PAGE_SIZE);
  }, [surface]);

  const sorted = sortThreads(threads, sort);
  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  const handlePostCreated = () => {
    setThreads(getFeedThreads(surface));
    setVisibleCount((v) => v + 1);
  };

  return (
    <>
      <PostComposer defaultSurface={surface ?? 'DISCUSSION'} onPostCreated={handlePostCreated} />

      <SurfaceFilter />

      <SortBar sort={sort} onChange={setSort} />

      {visible.length === 0 ? (
        <p className={styles.feed__empty}>{t('community.emptyState')}</p>
      ) : (
        <div className={styles.feed__list}>
          {visible.map((thread) => (
            <FeedCard key={thread.id} thread={thread} />
          ))}
        </div>
      )}

      {hasMore && (
        <button type="button" className={styles.feed__loadMore} onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}>
          {t('community.feed.loadMore')}
        </button>
      )}
    </>
  );
}
