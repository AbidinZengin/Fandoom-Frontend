import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lightbox } from './Lightbox';
import { computeLayout } from './ThreadMedia.layout';
import { useMediaRatios } from './useMediaRatios';
import styles from './ThreadMedia.module.css';

// Mozaik en fazla 3 karo gösterir; 3'ten fazlaysa 3. karo "+N" olur. Görsel
// karoları ve "+N" tam ekran Lightbox'ı açar (kullanıcı kararı, 2026-09-23 —
// önceki "aynı kutuda galeri, lightbox YOK" kararının YERİNE geçti). Video
// karoları satır içi oynatılır (kendi kontrolleri var), Lightbox'ta da açılır.
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
function LayoutNode({ node, media, weight, extra, onOpen }) {
  const { t } = useTranslation();
  const style = { flexGrow: weight };

  if (node.kind === 'tile') {
    const item = media[node.index];
    return (
      <div className={styles.tile} style={style} data-index={node.index}>
        <Tile item={item} className={styles.media} />
        {item.type !== 'VIDEO' && (
          <button
            type="button"
            className={styles.open}
            onClick={() => onOpen(node.index)}
            aria-label={t('community.thread.openMedia', { defaultValue: 'Büyüt' })}
          />
        )}
        {extra > 0 && node.index === MOSAIC_MAX - 1 && (
          <button type="button" className={styles.more} onClick={() => onOpen(node.index)}>
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
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

export function ThreadMedia({ media }) {
  // null = kapalı; sayı = Lightbox'ın açıldığı medya sırası.
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const mosaicRef = useRef(null);

  // Lightbox fotoğrafı bu karonun konumundan büyür ve kapanınca ona döner. Mozaikte
  // olmayan sıralar (3+) son karoya ("+N") döner. Her çağrıda güncel konum ölçülür
  // (kapanışta sayfa kaymış olabilir).
  const getOriginRect = useCallback((index) => {
    const tile = mosaicRef.current?.querySelector(`[data-index="${Math.min(index, MOSAIC_MAX - 1)}"]`);
    return tile?.getBoundingClientRect() ?? null;
  }, []);

  const shown = media.slice(0, MOSAIC_MAX);
  const extra = media.length - MOSAIC_MAX;
  const ratios = useMediaRatios(shown);
  const layout = ratios ? computeLayout(ratios) : null;
  const boxStyle = { '--ratio': layout ? layout.boxRatio : PENDING_RATIO };

  return (
    <>
      <div ref={mosaicRef} className={styles.mosaic} style={boxStyle} data-pending={!layout}>
        {layout && <LayoutNode node={layout.root} media={media} weight={1} extra={extra} onOpen={setLightboxIndex} />}
      </div>
      {lightboxIndex !== null && (
        <Lightbox media={media} initialIndex={lightboxIndex} getOriginRect={getOriginRect} onClose={closeLightbox} />
      )}
    </>
  );
}
