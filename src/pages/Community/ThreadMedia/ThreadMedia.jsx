import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronIcon } from '../ThreadIcons';
import { computeLayout } from './ThreadMedia.layout';
import { useMediaRatios } from './useMediaRatios';
import styles from './ThreadMedia.module.css';

// Mozaik en fazla 3 karo gösterir; 3'ten fazlaysa 3. karo "+N" olur ve ona
// basınca AYNI kutunun içinde yana kaydırılabilir küçük bir galeriye
// dönüşür (lightbox/modal YOK — kullanıcı kararı, 2026-09-19).
const MOSAIC_MAX = 3;
// Oranlar ölçülene kadar (kısa süre) kutu bu oranda koyu zeminle yer tutar.
const PENDING_RATIO = 4 / 3;

function Tile({ item, className }) {
  return item.type === 'VIDEO' ? (
    // #t=0.1 ilk kareyi poster yapar (iOS dahil).
    <video src={`${item.url}#t=0.1`} controls playsInline preload="metadata" className={className} />
  ) : (
    <img src={item.url} alt="" loading="lazy" className={className} />
  );
}

// computeLayout ağacını çizer: satır/sütun grupları flex-grow ile oranlarına
// göre paylaşır (satırda çocuğun oranı, sütunda 1/oranı — bkz. layout dosyası).
function LayoutNode({ node, media, weight, extra, onMore }) {
  const style = { flexGrow: weight };

  if (node.kind === 'tile') {
    return (
      <div className={styles.tile} style={style}>
        <Tile item={media[node.index]} className={styles.media} />
        {extra > 0 && node.index === MOSAIC_MAX - 1 && (
          <button type="button" className={styles.more} onClick={() => onMore(node.index)}>
            +{extra}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.group} data-dir={node.kind} style={style}>
      {node.children.map((child, index) => (
        <LayoutNode
          key={index}
          node={child}
          media={media}
          weight={node.kind === 'row' ? child.ratio : 1 / child.ratio}
          extra={extra}
          onMore={onMore}
        />
      ))}
    </div>
  );
}

export function ThreadMedia({ media }) {
  const { t } = useTranslation();
  const trackRef = useRef(null);
  const [current, setCurrent] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const shown = media.slice(0, MOSAIC_MAX);
  const extra = media.length - MOSAIC_MAX;
  const ratios = useMediaRatios(shown);
  const layout = ratios ? computeLayout(ratios) : null;
  // Galeri de aynı kutu oranını kullanır — açılınca kutu boyutu sıçramaz.
  const boxStyle = { '--ratio': layout ? layout.boxRatio : PENDING_RATIO };

  const openGallery = (startIndex) => {
    setCurrent(startIndex);
    setGalleryOpen(true);
    // Track render'dan sonra oluşur; başlangıç slaytına anlık konumlanır.
    requestAnimationFrame(() => {
      const track = trackRef.current;
      if (track) track.scrollLeft = startIndex * track.clientWidth;
    });
  };

  const handleScroll = (event) => {
    const track = event.currentTarget;
    setCurrent(Math.round(track.scrollLeft / track.clientWidth));
  };

  const step = (direction) => {
    const track = trackRef.current;
    track?.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' });
  };

  if (galleryOpen) {
    return (
      <div className={styles.gallery} style={boxStyle}>
        <div className={styles.gallery__track} ref={trackRef} onScroll={handleScroll} tabIndex={0}>
          {media.map((item) => (
            <div key={item.url} className={styles.gallery__slide}>
              <Tile item={item} className={styles.gallery__media} />
            </div>
          ))}
        </div>
        <button
          type="button"
          className={styles.gallery__button}
          data-position="prev"
          onClick={() => step(-1)}
          disabled={current === 0}
          aria-label={t('common.previous')}
        >
          <span data-direction="prev">
            <ChevronIcon />
          </span>
        </button>
        <button
          type="button"
          className={styles.gallery__button}
          data-position="next"
          onClick={() => step(1)}
          disabled={current === media.length - 1}
          aria-label={t('common.next')}
        >
          <span data-direction="next">
            <ChevronIcon />
          </span>
        </button>
        <button
          type="button"
          className={styles.gallery__button}
          data-position="close"
          onClick={() => setGalleryOpen(false)}
          aria-label={t('community.thread.closeGallery')}
        >
          ×
        </button>
        <span className={styles.gallery__counter}>
          {current + 1} / {media.length}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.mosaic} style={boxStyle} data-pending={!layout}>
      {layout && <LayoutNode node={layout.root} media={media} weight={1} extra={extra} onMore={openGallery} />}
    </div>
  );
}
