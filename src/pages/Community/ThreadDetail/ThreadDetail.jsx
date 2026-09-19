import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Footer } from '../../../components/Footer/Footer';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import { Comments } from '../../../components/Comments/Comments';
import { ThreadBody } from './ThreadBody/ThreadBody';
import { SURFACES } from '../../../shared/data/community';
import { getThreadBySlug } from './ThreadDetail.data';
import styles from './ThreadDetail.module.css';

// CommunityLayout'un DIŞINDA — 3-kolon değil, tam sayfa (kullanıcı spec'i).
// Thread gerçek GET /api/community/threads/{slug} ucundan gelir; yorumlar
// /api/community/comments (subjectType=THREAD, subjectId=Thread.id).
export default function ThreadDetail() {
  const { t } = useTranslation();
  const { slug } = useParams();
  // status: loading | ready | notFound | error
  const [state, setState] = useState({ status: 'loading', thread: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', thread: null });
    getThreadBySlug(slug)
      .then((thread) => {
        if (!cancelled) setState(thread ? { status: 'ready', thread } : { status: 'notFound', thread: null });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', thread: null });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const { status, thread } = state;

  if (status === 'loading') return null;

  if (status !== 'ready') {
    return (
      <>
        <div className={styles.threadDetail}>
          <p className={styles.threadDetail__notFound}>
            {status === 'error' ? t('community.loadError') : t('community.thread.notFound')}
          </p>
          <Link to="/community" className={styles.threadDetail__back}>
            {t('community.thread.backToFeed')}
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const surfaceInfo = SURFACES.find((s) => s.key === thread.surface);

  return (
    <>
      <div className={styles.threadDetail}>
        <Link to={surfaceInfo?.to ?? '/community'} className={styles.threadDetail__back}>
          {t('community.thread.backToFeed')}
        </Link>

        <ThreadBody thread={thread} />

        <Comments subjectType="THREAD" subjectId={thread.id} variant="neutral" />
      </div>

      <Footer />
    </>
  );
}
