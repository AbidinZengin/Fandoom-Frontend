import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import { useLocalizedNavigate } from '../../../shared/i18n/useLocalizedNavigate';
import { Comments } from '../../../components/Comments/Comments';
import { FeedSkeleton } from '../Feed/FeedSkeleton/FeedSkeleton';
import { ThreadBody } from './ThreadBody/ThreadBody';
import { SURFACES } from '../../../shared/data/community';
import { threadPath } from '../threadLink';
import { getThreadByIdOrSlug } from './ThreadDetail.data';
import styles from './ThreadDetail.module.css';

const SURFACE_LABEL_KEYS = { DISCUSSION: 'navbar.discussion', THEORY: 'navbar.theories', FAN_ART: 'navbar.fanArt' };

// CommunityLayout'un İÇİNDE (PRD, 2026-09-21): sol/sağ menü ekranda sabit kalır,
// yalnız orta sütun Feed'den ThreadDetail'e döner — modal/popup YOK, adres
// çubuğu değişir. İki giriş yolu: hibrit /portal/:portalSlug/post/:idSlug
// (birincil — sorgu YALNIZ id ile, slug süs) ve eski /community/<yüzey>/:slug
// linkleri (paylaşılmış URL'ler kırılmasın). İkisi de yüklenince kanonik URL'e
// `replace` edilir (başlık değişti / thread taşındı / eski link) — backend 301 vermez.
// Yorumlar /api/community/comments (subjectType=THREAD, subjectId=Thread.id).
// Breadcrumb: Community › Portal › Tür (portal segmenti /portal/:slug'a gider).
export default function ThreadDetail() {
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();
  const { portalSlug, idSlug, slug } = useParams();
  // Hibrit segmentin başındaki rakam dizisi id'dir (`4127-12-monkeys` → 4127);
  // rakamla başlamıyorsa geçersizdir. Eski rotada segment slug'ın kendisidir.
  const lookup = idSlug === undefined ? slug : idSlug.match(/^(\d+)(?:-|$)/)?.[1];
  // status: loading | ready | notFound | error
  const [state, setState] = useState({ status: 'loading', thread: null });

  useEffect(() => {
    if (!lookup) {
      setState({ status: 'notFound', thread: null });
      return undefined;
    }
    let cancelled = false;
    setState({ status: 'loading', thread: null });
    getThreadByIdOrSlug(lookup)
      .then((thread) => {
        if (cancelled) return;
        setState(thread ? { status: 'ready', thread } : { status: 'notFound', thread: null });
        const canonical = thread?.portal?.slug && `${thread.id}-${thread.slug}`;
        if (canonical && (thread.portal.slug !== portalSlug || canonical !== idSlug)) {
          navigate(threadPath(thread), { replace: true });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', thread: null });
      });
    return () => {
      cancelled = true;
    };
    // Kanonik replace params'ı değiştirir ama lookup (id) aynı kalır — yeniden
    // fetch YOK; navigate her render'da yeni kimlik olduğu için bilerek dışarıda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookup]);

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
        {thread.portal && (
          <>
            <Link to={`/portal/${thread.portal.slug}`}>{thread.portal.name}</Link>
            <span aria-hidden="true">›</span>
          </>
        )}
        <Link to={surfaceInfo?.to ?? '/community'}>{t(SURFACE_LABEL_KEYS[thread.surface] ?? 'navbar.community')}</Link>
      </nav>

      <ThreadBody thread={thread} />

      <Comments subjectType="THREAD" subjectId={thread.id} variant="neutral" />
    </div>
  );
}
