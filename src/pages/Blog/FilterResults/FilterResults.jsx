import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { FacetDropdown } from '../FilterPanel/FacetDropdown/FacetDropdown';
import { SORT_OPTIONS } from '../FilterPanel/filterDefaults';
import { ResultCard } from './ResultCard/ResultCard';
import styles from './FilterResults.module.css';

const SORT_DROPDOWN_OPTIONS = SORT_OPTIONS.map((o) => ({ id: o.value, slug: o.value, name: o.label }));
const SKELETON_COUNT = 8;

function chipLookup(facetList, slug) {
  return facetList?.find((o) => o.slug === slug)?.name ?? slug;
}

// Filtre aktifken (browseMode) küratörlü hub bölümlerinin YERİNE geçer —
// aktif filtre chip'leri + hızlı sort + sonuç grid'i + load more. Chip'ler
// facet slug'larını facets listesinden gerçek isme çözer.
export function FilterResults({
  filters,
  facets,
  results,
  onRemoveFilter,
  onClearAll,
  onSortChange,
  onLoadMore,
  onRetry,
}) {
  const gridRef = useRef(null);
  const animatedCountRef = useRef(0);

  const chips = [
    ...(filters.format ? [{ key: 'format', label: chipLookup(facets?.formats, filters.format) }] : []),
    ...(filters.franchise ? [{ key: 'franchise', label: chipLookup(facets?.franchises, filters.franchise) }] : []),
    ...filters.genre.map((slug) => ({ key: 'genre', value: slug, label: chipLookup(facets?.genres, slug) })),
    ...filters.mood.map((slug) => ({ key: 'mood', value: slug, label: chipLookup(facets?.moods, slug) })),
    ...(filters.spoilerFree ? [{ key: 'spoilerFree', label: 'Spoiler-Free' }] : []),
  ];

  // Filtre kombinasyonu değişince (sonuç seti sıfırdan geldiğinde) sayaç
  // sıfırlanır ki yeni set baştan reveal alsın; "Load more" ile eklenen
  // kuyruk zaten animatedCountRef'in ÜSTÜNDE kalıp yalnız o kısım oynar.
  useEffect(() => {
    animatedCountRef.current = 0;
  }, [filters.format, filters.franchise, filters.genre, filters.mood, filters.spoilerFree, filters.sort]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const nodes = gridRef.current?.querySelectorAll('[data-reveal]') ?? [];
    const freshNodes = Array.from(nodes).slice(animatedCountRef.current);
    if (freshNodes.length === 0) return;
    gsap.from(freshNodes, { opacity: 0, y: 16, duration: 0.35, ease: 'power2.out', stagger: 0.04 });
    animatedCountRef.current = nodes.length;
  }, [results.items]);

  const showSkeleton = results.loading && results.items.length === 0;
  const isEmpty = !results.loading && results.items.length === 0;
  const canLoadMore = !results.loading && results.page + 1 < results.totalPages;

  return (
    <section className={styles.results}>
      <div className={styles.results__toolbar}>
        <div className={styles.results__chips}>
          {chips.length === 0 ? (
            <span className={styles.results__count}>
              {results.loading ? 'Loading…' : results.error ? '' : `${results.totalElements} results`}
            </span>
          ) : (
            <>
              {chips.map((chip) => (
                <button
                  key={`${chip.key}-${chip.value ?? chip.label}`}
                  type="button"
                  className={styles.chip}
                  onClick={() => onRemoveFilter(chip.key, chip.value)}
                >
                  {chip.label}
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              ))}
              <button type="button" className={styles.results__clearAll} onClick={onClearAll}>
                Clear all
              </button>
            </>
          )}
        </div>

        <div className={styles.results__sort}>
          <FacetDropdown
            label="Sort"
            mode="single"
            options={SORT_DROPDOWN_OPTIONS}
            value={filters.sort}
            onChange={onSortChange}
          />
        </div>
      </div>

      {chips.length > 0 && (
        <span className={styles.results__countLine}>
          {results.loading ? 'Loading…' : results.error ? '' : `${results.totalElements} results`}
        </span>
      )}

      {results.error ? (
        <div className={styles.results__empty}>
          <p>Something went wrong loading results.</p>
          <button type="button" className={styles.results__loadMore} onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : isEmpty ? (
        <div className={styles.results__empty}>
          <p>No blogs match these filters.</p>
          <button type="button" className={styles.results__clearAll} onClick={onClearAll}>
            Clear all filters
          </button>
        </div>
      ) : (
        <div className={styles.results__grid} ref={gridRef}>
          {showSkeleton
            ? Array.from({ length: SKELETON_COUNT }, (_, i) => <ResultCard key={i} item={null} />)
            : results.items.map((item) => <ResultCard key={item.id} item={item} />)}
        </div>
      )}

      {canLoadMore && (
        <button type="button" className={styles.results__loadMore} onClick={onLoadMore}>
          Load more
        </button>
      )}
    </section>
  );
}
