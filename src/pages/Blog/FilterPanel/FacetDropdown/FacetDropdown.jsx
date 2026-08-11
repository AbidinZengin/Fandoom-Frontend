import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import styles from './FacetDropdown.module.css';

const SEARCH_THRESHOLD = 6;

// Filtre panelinin her facet'i (Format/Franchise tekil, Genre/Mood çoklu)
// AYNI dropdown'ı kullanır — kullanıcının referans gösterdiği "Cable
// category" deseni: tetik buton → popover (arama + select all/reset [çoklu
// modda] + checkbox/radio liste + count). `value`: single modda slug|null,
// multi modda slug[].
export function FacetDropdown({ label, options = [], mode = 'single', value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const panelRef = useRef(null);

  const selectedCount = mode === 'multi' ? (value?.length ?? 0) : value ? 1 : 0;
  const summary =
    mode === 'multi'
      ? selectedCount > 0
        ? `${selectedCount} selected`
        : 'Any'
      : (options.find((o) => o.slug === value)?.name ?? 'Any');

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  // Dışarı tıklama / Escape ile kapanır — Navbar dropdown'ındaki desenin
  // genel hâli.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Popover açılış — utility register (hızlı, sinematik değil).
  useEffect(() => {
    if (!open || !panelRef.current) return undefined;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(panelRef.current, { opacity: 0, y: -6, duration: 0.22, ease: 'power2.out' });
      });
    });
    return () => ctx.revert();
  }, [open]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const toggleOption = (slug) => {
    if (mode === 'single') {
      onChange(value === slug ? null : slug);
      setOpen(false);
      return;
    }
    const set = new Set(value ?? []);
    if (set.has(slug)) set.delete(slug);
    else set.add(slug);
    onChange([...set]);
  };

  return (
    <div className={styles.facet} ref={rootRef}>
      <span className={styles.facet__label}>{label}</span>

      <button
        type="button"
        className={styles.facet__trigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-active={selectedCount > 0 || undefined}
      >
        <span className={styles.facet__summary}>{summary}</span>
        <svg
          className={styles.facet__chevron}
          data-open={open || undefined}
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className={styles.facet__panel} ref={panelRef}>
          {mode === 'multi' && (
            <div className={styles.facet__panelHead}>
              <button type="button" className={styles.facet__linkBtn} onClick={() => onChange(options.map((o) => o.slug))}>
                Select all
              </button>
              <span className={styles.facet__divider}>·</span>
              <button type="button" className={styles.facet__linkBtn} onClick={() => onChange([])}>
                Reset
              </button>
            </div>
          )}

          {options.length > SEARCH_THRESHOLD && (
            <div className={styles.facet__search}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
              />
            </div>
          )}

          <ul className={styles.facet__list}>
            {filtered.length === 0 && (
              <li className={styles.facet__empty}>{options.length === 0 ? 'No options available' : 'No matches'}</li>
            )}
            {filtered.map((option) => {
              const checked = mode === 'multi' ? (value ?? []).includes(option.slug) : value === option.slug;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    className={styles.facet__option}
                    onClick={() => toggleOption(option.slug)}
                  >
                    <span className={styles.facet__mark} data-shape={mode} data-checked={checked || undefined}>
                      {checked && (
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {option.logoUrl && (
                      <img className={styles.facet__logo} src={option.logoUrl} alt="" loading="lazy" />
                    )}
                    <span className={styles.facet__name}>{option.name}</span>
                    {option.count != null && <span className={styles.facet__count}>{option.count}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
