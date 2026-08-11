import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBlogs } from '../../../shared/api/blogs';
import styles from './BlogList.module.css';

// Editörün eksik parçası — önceden bir blogu düzenlemek için ID'yi elle
// bilmek/URL'e yazmak gerekiyordu (tasarımda bilerek "v1 kapsamı dışı"
// bırakılmıştı). status alanı backend'in BlogSummaryResponse'unda henüz
// YOK (2026-08 doğrulandı) — geldiğinde rozet otomatik dolar, şimdilik
// hepsi nötr görünür.
export default function BlogList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchBlogs({ size: 50 })
      .then((res) => {
        if (!cancelled) setItems(res.content);
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

  return (
    <section className={styles.blogList}>
      <header className={styles.blogList__head}>
        <h1 className={styles.blogList__title}>Blogs</h1>
        <Link to="/admin/blogs/new" className={styles.blogList__new}>
          + New Blog
        </Link>
      </header>

      {loading && <p className={styles.blogList__status}>Loading…</p>}
      {error && <p className={styles.blogList__status}>Failed to load.</p>}

      {!loading && !error && (
        <ul className={styles.blogList__items}>
          {items.map((item) => (
            <li key={item.id} className={styles.blogList__item}>
              <Link to={`/admin/blogs/${item.id}`} className={styles.blogList__itemLink}>
                {item.imageUrl && <img className={styles.blogList__thumb} src={item.imageUrl} alt="" />}
                <span className={styles.blogList__itemTitle}>{item.title}</span>
                {item.status && <span className={styles.blogList__badge}>{item.status}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
