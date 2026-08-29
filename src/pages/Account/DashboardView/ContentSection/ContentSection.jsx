import { useTranslation } from 'react-i18next';
import { LocalizedLink } from '../../../../shared/i18n/LocalizedLink';
import styles from './ContentSection.module.css';

// Watchlist/Custom Lists'te öğeler tek tip (MOVIE/SERIES) olabilir ama
// Following/Liked/Saved backend'de itemType bazında karışık gelebilir
// (bkz. UserFollowResponse/UserLikeResponse) — bu yüzden blog/prodüksiyon
// ayrımı liste seviyesinde `variant` prop'uyla DEĞİL, her kartın kendi
// `item.itemType`'ıyla yapılır (Account.data.js enrichment'ta eklenir).
export function ContentSection({ heading, items, ctaLabel }) {
  const { t } = useTranslation();
  // Grid sütun genişliği: Saved gibi tamamen blog olan listeler daha geniş
  // kart ister; Following/Liked karışık geldiğinde varsayılan (poster)
  // genişlikte kalır — kart bazlı en-boy oranı zaten item.itemType'a göre.
  const isBlogList = !!items?.length && items.every((item) => item.itemType === 'BLOG');

  return (
    <section className={styles.content}>
      <h1 className={styles.content__heading}>{heading}</h1>

      {items && items.length === 0 && <p className={styles.content__empty}>{t('account.content.emptyState')}</p>}

      <ul className={styles.content__grid} data-variant={isBlogList ? 'blog' : undefined}>
        {(items ?? []).map((item) => {
          const isBlog = item.itemType === 'BLOG';
          const href = isBlog
            ? `/blog/${item.slug}`
            : item.itemType === 'MOVIE'
              ? `/movies/${item.slug}`
              : `/series/${item.slug}`;
          const imageSrc = isBlog ? item.imageUrl : item.posterUrl;
          const imageAlt = isBlog ? (item.imageAlt ?? '') : item.title;
          const cardVariant = isBlog ? 'blog' : 'poster';

          return (
            <li key={item.id} className={styles.content__card}>
              <LocalizedLink to={href} className={styles.content__cardLink} data-variant={cardVariant}>
                <img src={imageSrc} alt={imageAlt} className={styles.content__poster} />
                <div className={styles.content__cardOverlay}>
                  <span className={styles.content__cardCta}>{ctaLabel}</span>
                </div>
              </LocalizedLink>
              <p className={styles.content__cardTitle}>{item.title}</p>
              <span className={styles.content__cardType}>
                {isBlog
                  ? t('blog.minRead', { count: item.readingTimeMinutes })
                  : item.itemType === 'MOVIE'
                    ? t('account.content.typeMovie')
                    : t('account.content.typeSeries')}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
