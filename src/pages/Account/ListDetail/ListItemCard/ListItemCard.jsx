import { useTranslation } from 'react-i18next';
import { LocalizedLink } from '../../../../shared/i18n/LocalizedLink';
import styles from './ListItemCard.module.css';

function DragHandleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="5" r="1.3" />
      <circle cx="9" cy="12" r="1.3" />
      <circle cx="9" cy="19" r="1.3" />
      <circle cx="15" cy="5" r="1.3" />
      <circle cx="15" cy="12" r="1.3" />
      <circle cx="15" cy="19" r="1.3" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

// Normal modda ContentSection'daki kart deseninin aynısı (link+hover
// overlay). Edit modda link devre dışı kalır — kart sürüklenebilir olur,
// sıra rozeti + sil butonu belirir. Pozisyon değişiminin smooth olması
// (React'in anlık grid reflow'u yerine) ListDetail.jsx'teki GSAP Flip
// tarafından sağlanır — bu component sadece drag event'lerini yukarı iletir.
export function ListItemCard({
  item,
  index,
  editMode,
  isDragging,
  isDragOver,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const { t } = useTranslation();
  const isBlog = item.itemType === 'BLOG';
  const href = isBlog ? `/blog/${item.slug}` : item.itemType === 'MOVIE' ? `/movies/${item.slug}` : `/series/${item.slug}`;
  const imageSrc = isBlog ? item.imageUrl : item.posterUrl;
  const imageAlt = isBlog ? (item.imageAlt ?? '') : item.title;
  const orderLabel = String(index + 1).padStart(2, '0');

  const media = (
    <>
      <img src={imageSrc} alt={imageAlt} className={styles.card__poster} />
      {editMode ? (
        <span className={styles.card__orderBadge}>{orderLabel}</span>
      ) : (
        <div className={styles.card__overlay}>
          <span className={styles.card__cta}>{isBlog ? t('account.content.readCta') : t('account.content.viewCta')}</span>
        </div>
      )}
    </>
  );

  return (
    <li
      className={styles.card}
      data-editing={editMode || undefined}
      data-dragging={isDragging || undefined}
      data-drag-over={(isDragOver && !isDragging) || undefined}
      draggable={editMode}
      onDragStart={editMode ? onDragStart : undefined}
      onDragOver={editMode ? onDragOver : undefined}
      onDrop={editMode ? onDrop : undefined}
      onDragEnd={editMode ? onDragEnd : undefined}
    >
      {editMode ? (
        <div className={styles.card__media} data-variant={isBlog ? 'blog' : 'poster'}>
          {media}
          <span className={styles.card__dragHandle}>
            <DragHandleIcon />
          </span>
          <button type="button" className={styles.card__removeButton} onClick={onRemove} aria-label={t('account.listDetail.removeItem')}>
            <RemoveIcon />
          </button>
        </div>
      ) : (
        <LocalizedLink to={href} className={styles.card__media} data-variant={isBlog ? 'blog' : 'poster'}>
          {media}
        </LocalizedLink>
      )}
      <p className={styles.card__title}>{item.title}</p>
      <span className={styles.card__type}>
        {isBlog
          ? t('blog.minRead', { count: item.readingTimeMinutes })
          : item.itemType === 'MOVIE'
            ? t('account.content.typeMovie')
            : t('account.content.typeSeries')}
      </span>
    </li>
  );
}
