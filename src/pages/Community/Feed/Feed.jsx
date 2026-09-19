import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PostComposer } from './PostComposer/PostComposer';
import { SurfaceFilter } from './SurfaceFilter/SurfaceFilter';
import { SortBar } from './SortBar/SortBar';
import { FeedCard } from './FeedCard/FeedCard';
import { getFeedThreads } from './Feed.data';
import styles from './Feed.module.css';

const PAGE_SIZE = 5;

// index route'u (surface=undefined, karışık akış) VE discussion/theories/
// fan-art route'larını (surface sabit) TEK component karşılar — ayrı bir
// SurfaceFeed dosyası açmak burada gereksiz kopya olurdu (Karpathy ilkesi:
// istenenden fazla soyutlama yok); tek fark PostComposer'ın varsayılan
// yüzeyi ve listenin filtresi. Sıralama ve sayfalama sunucuda.
export default function Feed({ surface }) {
  const { t } = useTranslation();
  const [sort, setSort] = useState('hot');
  const [threads, setThreads] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // surface/sort değişince veya yeni post atılınca liste baştan yüklenir.
  // Yarış durumu: eski isteğin cevabı yeni seçimin listesini ezmesin diye
  // cleanup'ta iptal bayrağı set edilir.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    getFeedThreads({ surface, sort, page: 0, size: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setThreads(res.threads);
        setHasMore(res.hasMore);
        setPage(0);
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
  }, [surface, sort, reloadKey]);

  const handleLoadMore = async () => {
    setLoading(true);
    try {
      const res = await getFeedThreads({ surface, sort, page: page + 1, size: PAGE_SIZE });
      setThreads((prev) => [...prev, ...res.threads]);
      setHasMore(res.hasMore);
      setPage(page + 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PostComposer defaultSurface={surface ?? 'DISCUSSION'} onPostCreated={() => setReloadKey((k) => k + 1)} />

      <SurfaceFilter />

      <SortBar sort={sort} onChange={setSort} />

      {error ? (
        <p className={styles.feed__empty}>{t('community.loadError')}</p>
      ) : threads.length === 0 ? (
        !loading && <p className={styles.feed__empty}>{t('community.emptyState')}</p>
      ) : (
        <div className={styles.feed__list}>
          {threads.map((thread) => (
            <FeedCard key={thread.id} thread={thread} />
          ))}
        </div>
      )}

      {hasMore && !error && (
        <button type="button" className={styles.feed__loadMore} onClick={handleLoadMore} disabled={loading}>
          {t('community.feed.loadMore')}
        </button>
      )}
    </>
  );
}
