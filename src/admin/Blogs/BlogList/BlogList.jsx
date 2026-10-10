import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBlogs } from '../../../shared/api/blogs';
import controls from '../../controls.module.css';
import { ArrowUpRightIcon, SearchIcon } from '../../icons';
import PageHeader from '../../PageHeader/PageHeader';
import styles from './BlogList.module.css';

export default function BlogList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchBlogs({ size: 50, sort: 'id,desc' })
      .then((res) => {
        if (!cancelled) setItems(res.content ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const needle = query.trim().toLocaleLowerCase('tr');
  const visible = needle
    ? items.filter((item) => (item.title ?? '').toLocaleLowerCase('tr').includes(needle))
    : items;

  return (
    <div className={styles['blogList']}>
      <PageHeader
        title="Bloglar"
        subtitle={loading ? undefined : `${items.length} yazı`}
        action={{ to: '/admin/blogs/new', label: 'Yeni blog' }}
      />

      <div className={styles['blogList__search']}>
        <span className={styles['blogList__searchIcon']}>
          <SearchIcon />
        </span>
        <input
          type="search"
          className={`${controls.control} ${styles['blogList__searchInput']}`}
          placeholder="Başlıkta ara"
          aria-label="Başlıkta ara"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading && <p className={styles['blogList__status']}>Yükleniyor…</p>}
      {error && <p className={styles['blogList__status']}>Liste yüklenemedi, sayfayı yenile.</p>}
      {!loading && !error && visible.length === 0 && (
        <p className={styles['blogList__status']}>Eşleşen yazı yok.</p>
      )}

      {!loading && !error && visible.length > 0 && (
        <ul className={styles['blogList__items']}>
          {visible.map((item) => (
            <li key={item.id}>
              <Link to={`/admin/blogs/${item.id}`} className={styles['blogList__row']}>
                {item.imageUrl ? (
                  <img className={styles['blogList__thumb']} src={item.imageUrl} alt="" />
                ) : (
                  <span className={styles['blogList__thumb']} aria-hidden="true" />
                )}
                <span className={styles['blogList__title']}>{item.title || 'Başlıksız'}</span>
                {item.status && <span className={styles['blogList__badge']}>{item.status}</span>}
                {item.readingTimeMinutes != null && (
                  <span className={styles['blogList__meta']}>{item.readingTimeMinutes} dk</span>
                )}
                <span className={styles['blogList__arrow']}>
                  <ArrowUpRightIcon />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
