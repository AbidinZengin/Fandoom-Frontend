import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import { Comments } from '../../../components/Comments/Comments';
import { FeedSkeleton } from '../Feed/FeedSkeleton/FeedSkeleton';
import { ThreadBody } from './ThreadBody/ThreadBody';
import { SURFACES } from '../../../shared/data/community';
import { getThreadBySlug } from './ThreadDetail.data';
import styles from './ThreadDetail.module.css';

const SURFACE_LABEL_KEYS = { DISCUSSION: 'navbar.discussion', THEORY: 'navbar.theories', FAN_ART: 'navbar.fanArt' };

// CommunityLayout'un İÇİNDE (PRD, 2026-09-21): sol/sağ menü ekranda sabit kalır,
// yalnız orta sütun Feed'den ThreadDetail'e döner — modal/popup YOK, adres
// çubuğu değişir. Thread gerçek GET /api/community/threads/{slug} ucundan gelir;
// yorumlar /api/community/comments (subjectType=THREAD, subjectId=Thread.id).
// Breadcrumb'ta Portal segmenti yok — backend'de Portal modeli gelince araya girer.
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

  if (status === 'loading') return <FeedSkeleton label={t('community.feed.loading')} count={1} />;

  if (status !== 'ready') {
    return (
      <div className={styles.threadDetail}>
        <p className={styles.threadDetail__notFound}>
          {status === 'error' ? t('community.loadError') : t('community.thread.notFound')}
        </p>
        <Link to="/community" className={styles.threadDetail__back}>
          {t('community.thread.backToFeed')}
        </Link>
      </div>
    );
  }

  const surfaceInfo = SURFACES.find((s) => s.key === thread.surface);

  return (
    <div className={styles.threadDetail}>
      <nav className={styles.threadDetail__breadcrumb} aria-label={t('community.thread.breadcrumb')}>
        <Link to="/community">{t('navbar.community')}</Link>
        <span aria-hidden="true">›</span>
        <Link to={surfaceInfo?.to ?? '/community'}>{t(SURFACE_LABEL_KEYS[thread.surface] ?? 'navbar.community')}</Link>
      </nav>

      <ThreadBody thread={thread} />

      <Comments subjectType="THREAD" subjectId={thread.id} variant="neutral" />
    </div>
  );
}
