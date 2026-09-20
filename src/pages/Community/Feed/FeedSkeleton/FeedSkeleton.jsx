import styles from './FeedSkeleton.module.css';

// Feed'in ilk yüklemesinde boş ekran yerine, AKTİF GÖRÜNÜMÜN anatomisini taşıyan
// statik iskelet (variant: card | list | grid — Feed.jsx VIEWS ile aynı): kart
// için avatar+başlık+özet+aksiyon, liste için sıkışık satırlar, galeri için
// farklı boylu karolar. Shimmer/dönen çark YOK (learned-rules: skeleton/shimmer
// görsel yüklemesi için yasak; bu, yapı iskeleti). Gerçek öğelerle aynı hairline
// çerçeve — yükleme bitince yerleşim sıçramaz. `count`: detay sayfası tek kart ister.
const DEFAULT_COUNTS = { card: 3, list: 8, grid: 6 };
const TILE_HEIGHTS = ['tall', 'short', 'medium', 'medium', 'tall', 'short'];

function CardSkeleton() {
  return (
    <div className={styles.feedSkeleton__card} aria-hidden="true">
      <div className={styles.feedSkeleton__author}>
        <span className={styles.feedSkeleton__avatar} />
        <span className={styles.feedSkeleton__bar} data-size="name" />
      </div>
      <span className={styles.feedSkeleton__bar} data-size="title" />
      <span className={styles.feedSkeleton__bar} data-size="pill" />
      <span className={styles.feedSkeleton__bar} data-size="line" />
      <span className={styles.feedSkeleton__bar} data-size="lineShort" />
      <div className={styles.feedSkeleton__actions}>
        <span className={styles.feedSkeleton__bar} data-size="action" />
        <span className={styles.feedSkeleton__bar} data-size="action" />
        <span className={styles.feedSkeleton__bar} data-size="action" />
      </div>
    </div>
  );
}

// Zengin satır anatomisi: sayaç | başlık + özet + meta | (bazı satırlarda) küçük resim.
function RowSkeleton({ withThumb }) {
  return (
    <div className={styles.feedSkeleton__row} data-has-thumb={withThumb || undefined} aria-hidden="true">
      <span className={styles.feedSkeleton__bar} data-size="vote" />
      <span className={styles.feedSkeleton__rowBody}>
        <span className={styles.feedSkeleton__bar} data-size="rowTitle" />
        <span className={styles.feedSkeleton__bar} data-size="line" />
        <span className={styles.feedSkeleton__bar} data-size="rowMeta" />
      </span>
      {withThumb && <span className={styles.feedSkeleton__thumb} />}
    </div>
  );
}

export function FeedSkeleton({ label, variant = 'card', count = DEFAULT_COUNTS[variant] }) {
  return (
    <div className={styles.feedSkeleton} data-variant={variant} role="status">
      <span className={styles.feedSkeleton__sr}>{label}</span>
      {Array.from({ length: count }, (_, index) =>
        variant === 'list' ? (
          <RowSkeleton key={index} withThumb={index % 2 === 0} />
        ) : variant === 'grid' ? (
          <span
            key={index}
            className={styles.feedSkeleton__tile}
            data-height={TILE_HEIGHTS[index % TILE_HEIGHTS.length]}
            aria-hidden="true"
          />
        ) : (
          <CardSkeleton key={index} />
        ),
      )}
    </div>
  );
}
