import { useEffect, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import { useLocalizedNavigate } from '../../../shared/i18n/useLocalizedNavigate';
import {
  DEBOUNCE_MS,
  GROUP_LABEL_KEYS,
  MIN_QUERY_LENGTH,
  fetchQuickResults,
  hitPath,
  searchPagePath,
  thumbUrl,
} from './SearchBox.data';

// theme.css'teki varsayılan --accent (ana sayfa moru) — bununla eşleşen
// inline değer "yapım rengi yok" sayılır.
const DEFAULT_ACCENT = '#a02cd8';
import styles from './SearchBox.module.css';

// Header quick search — ARIA combobox deseni. variant="bar": masaüstü navbar,
// sonuçlar input'un altında açılan panelde. variant="inline": mobil navbar,
// kabın genişliğini doldurur, sonuçlar aynı panelde.
export function SearchBox({ variant = 'bar' }) {
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();
  const { pathname } = useLocation();
  const listId = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [accent, setAccent] = useState(null);

  const trimmed = query.trim();
  const searchable = trimmed.length >= MIN_QUERY_LENGTH;

  // Debounce + iptal: her yeni tuşta önceki zamanlayıcı ve uçuştaki istek
  // düşer, eski yanıt yenisinin üstüne yazamaz.
  useEffect(() => {
    if (!searchable) {
      setGroups([]);
      setStatus('idle');
      return undefined;
    }
    const controller = new AbortController();
    setStatus('loading');
    const timer = setTimeout(async () => {
      try {
        const result = await fetchQuickResults(trimmed, { signal: controller.signal });
        setGroups(result);
        setStatus('done');
        setActiveIndex(-1);
      } catch (err) {
        if (err.name !== 'AbortError') setStatus('error');
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, searchable]);

  // Sayfa değişince panel kapanır ve kutu sıfırlanır.
  useEffect(() => {
    setOpen(false);
    setQuery('');
  }, [pathname]);

  // Dışarı tıklayınca kapanır (overlay'de panel yok, gerek de yok).
  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  // Klavye gezintisi için düz liste: tüm sonuçlar + en sonda "tüm sonuçlar".
  const options = groups.flatMap((group) =>
    group.items.map((hit) => ({ key: `${group.type}-${hit.id}`, to: hitPath(group.type, hit, trimmed) })),
  );
  // "Tüm sonuçlar" yalnız sonuç varken çıkar; boş durumla aynı anda görünmez.
  const hasResults = groups.length > 0;
  const allResultsIndex = options.length;
  const optionCount = searchable && hasResults ? options.length + 1 : 0;
  const optionId = (index) => `${listId}-opt-${index}`;

  // İlk yanıt gelmeden boş panel açılmaz.
  const showPanel = open && searchable && (hasResults || status === 'done' || status === 'error');

  // Yapım sayfaları kendi rengini <html>'e inline --accent olarak yazar; ana
  // sayfada inline yoktur ya da varsayılan mor kalır (sayfa cleanup'ları onu
  // geri yazar) → nötr kalınır (kullanıcı kararı: ana sayfada mor yok).
  // Odakta okunur: sayfanın efekti navbar render'ından sonra çalışır.
  const readAccent = () => {
    const value = document.documentElement.style.getPropertyValue('--accent').trim();
    setAccent(value && value.toLowerCase() !== DEFAULT_ACCENT ? value : null);
  };

  const goTo = (to) => {
    setOpen(false);
    inputRef.current?.blur();
    navigate(to);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!searchable) return;
    if (activeIndex >= 0 && activeIndex < options.length) goTo(options[activeIndex].to);
    else goTo(searchPagePath(trimmed));
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!optionCount) return;
      event.preventDefault();
      setOpen(true);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((i) => (i + step + optionCount) % optionCount);
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  let flatIndex = -1;

  return (
    <form
      ref={rootRef}
      role="search"
      className={`${styles.searchbox} ${styles[`searchbox--${variant}`]}`}
      style={accent ? { '--searchbox-accent': accent } : undefined}
      data-accent={accent ? '' : undefined}
      onSubmit={handleSubmit}
    >
      <div className={styles.searchbox__field}>
      <svg
        className={styles.searchbox__icon}
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="6.5" />
        <path d="M20 20l-4.2-4.2" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        className={styles.searchbox__input}
        type="search"
        value={query}
        placeholder={t('navbar.searchPlaceholder')}
        aria-label={t('navbar.searchPlaceholder')}
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showPanel && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        autoComplete="off"
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          readAccent();
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />
      </div>

      {showPanel && (
        <div className={styles.searchbox__panel}>
        <div className={styles.searchbox__scroll} id={listId} role="listbox" aria-label={t('navbar.searchPlaceholder')}>
          {status === 'done' && !hasResults && (
            <p className={styles.searchbox__empty}>{t('search.noResults', { q: trimmed })}</p>
          )}
          {status === 'error' && <p className={styles.searchbox__empty}>{t('search.error')}</p>}

          {groups.map((group) => (
            <div key={group.type} role="group" aria-label={t(GROUP_LABEL_KEYS[group.type])}>
              <p className={styles.searchbox__group} aria-hidden="true">
                {t(GROUP_LABEL_KEYS[group.type])}
              </p>
              {group.items.map((hit) => {
                flatIndex += 1;
                const index = flatIndex;
                return (
                  <Link
                    key={hit.id}
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === activeIndex}
                    to={options[index].to}
                    className={styles.searchbox__hit}
                    data-active={index === activeIndex || undefined}
                    tabIndex={-1}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => setOpen(false)}
                  >
                    <span className={styles.searchbox__thumb}>
                      {hit.imageUrl ? (
                        <img src={thumbUrl(hit.imageUrl)} alt="" loading="lazy" />
                      ) : (
                        <span aria-hidden="true">{hit.title.charAt(0)}</span>
                      )}
                    </span>
                    <span className={styles.searchbox__text}>
                      <span className={styles.searchbox__title}>{hit.title}</span>
                      {hit.subtitle && <span className={styles.searchbox__subtitle}>{hit.subtitle}</span>}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}

          {hasResults && (
          <Link
            id={optionId(allResultsIndex)}
            role="option"
            aria-selected={activeIndex === allResultsIndex}
            to={searchPagePath(trimmed)}
            className={styles.searchbox__all}
            data-active={activeIndex === allResultsIndex || undefined}
            tabIndex={-1}
            onMouseEnter={() => setActiveIndex(allResultsIndex)}
            onClick={() => setOpen(false)}
          >
            {t('search.allResults', { q: trimmed })}
          </Link>
          )}
        </div>
        </div>
      )}
    </form>
  );
}
