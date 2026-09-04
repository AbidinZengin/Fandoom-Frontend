import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import styles from './SidebarRelated.module.css';

// SeasonDetail'in sağ sidebar'ındaki EpisodeGrid ile BİREBİR aynı görsel
// desen (kullanıcı kararı, 2026-08) — sadece bölüm yerine diğer blog
// yazıları listelenir, numara rozeti YOK (blogların sıra numarası yok).
// Blog relation sistemi henüz kurulmadığı için (kullanıcı: "iki yere de
// aynı blogları koyabilirsin") RelatedContent (Dive Deeper) ile AYNI
// `item.relatedBlogs` verisiyle beslenir — ayrı bir veri kaynağı YOK.
export function SidebarRelated({ items }) {
  const { t } = useTranslation();

  if (!items?.length) return null;

  return (
    <div aria-label={t('blog.moreStoriesHeading')}>
      <p className={styles.panel__heading}>{t('blog.moreStoriesHeading')}</p>
      <ol className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <Link to={`/blog/${item.slug}`} className={styles.row}>
              {item.imageUrl && (
                <img
                  className={styles.row__image}
                  src={item.imageUrl}
                  alt={item.imageAlt ?? ''}
                  loading="lazy"
                  decoding="async"
                  onLoad={(e) => {
                    e.currentTarget.dataset.loaded = 'true';
                  }}
                />
              )}
              <span className={styles.row__scrim} aria-hidden="true" />
              <span className={styles.row__title}>{item.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
