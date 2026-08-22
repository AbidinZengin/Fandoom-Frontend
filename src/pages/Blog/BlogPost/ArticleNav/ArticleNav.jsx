import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import styles from './ArticleNav.module.css';

// Makale sonu önceki/sonraki gezinmesi — ikisi de yoksa (katalogda tek kayıt)
// hiçbir şey basılmaz. Tek taraf eksikse (listenin ucundayız) o hücre boş
// kalır, karşı taraf hizasını korur (grid iki kolonlu sabit kalıyor).
//
// Küçük thumbnail (BlogSummaryResponse.imageUrl zaten var) + metin —
// RelatedContent kartlarıyla aynı görsel dil (kullanıcı kararı: kartsız
// metin versiyonu "olmadı", görselli hâle dönüldü). Next'te görsel SAĞDA —
// gidiş yönüne işaret etsin diye.
export function ArticleNav({ previous, next }) {
  const { t } = useTranslation();
  if (!previous && !next) return null;

  return (
    <nav className={styles.nav} aria-label={t('blog.articleNavAriaLabel')}>
      {previous ? (
        <Link to={`/blog/${previous.slug}`} className={styles.link} data-dir="prev">
          <img
            className={styles.thumb}
            src={previous.imageUrl}
            alt={previous.imageAlt ?? ''}
            loading="lazy"
            decoding="async"
          />
          <span className={styles.text}>
            <span className={styles.label}>
              <span aria-hidden="true">&#8249;</span> {t('common.previous')}
            </span>
            <span className={styles.title}>{previous.title}</span>
          </span>
        </Link>
      ) : (
        <span className={styles.link} data-empty="" />
      )}

      {next ? (
        <Link to={`/blog/${next.slug}`} className={styles.link} data-dir="next">
          <span className={styles.text}>
            <span className={styles.label}>
              {t('common.next')} <span aria-hidden="true">&#8250;</span>
            </span>
            <span className={styles.title}>{next.title}</span>
          </span>
          <img
            className={styles.thumb}
            src={next.imageUrl}
            alt={next.imageAlt ?? ''}
            loading="lazy"
            decoding="async"
          />
        </Link>
      ) : (
        <span className={styles.link} data-empty="" />
      )}
    </nav>
  );
}
