import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import controls from '../../controls.module.css';
import { ArrowUpRightIcon, SearchIcon } from '../../icons';
import PageHeader from '../../PageHeader/PageHeader';
import { listEntities } from '../entities.api';
import styles from './EntityListPage.module.css';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

// Üst-seviye varlık listesi (series, movies); `entity` yönlendiriciden gelir.
export default function EntityListPage({ entity }) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(false);

  // Arama yazarken her tuşta istek atmaz; durunca ilk sayfadan başlar.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    listEntities(entity, { page, size: PAGE_SIZE, search: debounced })
      .then((res) => {
        if (!cancelled) setResult(res);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [entity, page, debounced]);

  const items = result?.content ?? [];

  return (
    <div className={styles['entityList']}>
      <PageHeader
        title={entity.label}
        subtitle={result ? `${result.totalElements} kayıt` : undefined}
        action={{ to: `/admin/${entity.key}/new`, label: `Yeni ${entity.singular.toLocaleLowerCase('tr')}` }}
      />

      <div className={styles['entityList__search']}>
        <span className={styles['entityList__searchIcon']}>
          <SearchIcon />
        </span>
        <input
          type="search"
          className={`${controls.control} ${styles['entityList__searchInput']}`}
          placeholder="Başlıkta ara"
          aria-label="Başlıkta ara"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {!result && !error && <p className={styles['entityList__status']}>Yükleniyor…</p>}
      {error && <p className={styles['entityList__status']}>Liste yüklenemedi, sayfayı yenile.</p>}
      {result && items.length === 0 && <p className={styles['entityList__status']}>Eşleşen kayıt yok.</p>}

      {items.length > 0 && (
        <ul className={styles['entityList__items']}>
          {items.map((item) => {
            const row = entity.row(item);
            return (
              <li key={item.id}>
                <Link to={`/admin/${entity.key}/${item.id}`} className={styles['entityList__row']}>
                  {row.image ? (
                    <img className={styles['entityList__thumb']} src={row.image} alt="" />
                  ) : (
                    <span className={styles['entityList__thumb']} aria-hidden="true" />
                  )}
                  <span className={styles['entityList__title']}>{row.title || 'Başlıksız'}</span>
                  {row.meta && <span className={styles['entityList__meta']}>{row.meta}</span>}
                  <span className={styles['entityList__arrow']}>
                    <ArrowUpRightIcon />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {result && result.totalPages > 1 && (
        <nav className={styles['entityList__pager']} aria-label="Sayfalama">
          <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Önceki
          </button>
          <span>
            {page + 1} / {result.totalPages}
          </span>
          <button type="button" disabled={result.last} onClick={() => setPage((p) => p + 1)}>
            Sonraki
          </button>
        </nav>
      )}
    </div>
  );
}
