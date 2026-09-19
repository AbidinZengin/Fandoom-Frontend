import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Footer } from '../../../components/Footer/Footer';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import { Comments } from '../../../components/Comments/Comments';
import { ThreadBody } from './ThreadBody/ThreadBody';
import { SURFACES } from '../../../shared/data/community';
import { getThreadById } from './ThreadDetail.data';
import styles from './ThreadDetail.module.css';

// CommunityLayout'un DIŞINDA — 3-kolon değil, tam sayfa (kullanıcı spec'i).
// Yorumlar gerçek /api/community/comments ucuna bağlı (subjectType=THREAD,
// kullanıcı kararı: mock yazmak yerine zaten hazır API'yi kullan).
// subjectId burada mock thread id'si (ör. 'f4' veya 'local-...') — backend
// tarafında gerçek bir Thread entity'sine karşılık gelmiyor, bu yüzden
// çalışma zamanında doğrulanması gerekir (bkz. teslim notu).
export default function ThreadDetail() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const thread = getThreadById(slug);

  if (!thread) {
    return (
      <>
        <div className={styles.threadDetail}>
          <p className={styles.threadDetail__notFound}>{t('community.thread.notFound')}</p>
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
