import { Link } from 'react-router-dom';
import styles from './AdminHome.module.css';

// Admin'in giriş noktası — Login sonrası buraya düşülür. Tek işi var
// olan araçlara (Blog, Series Hero, Page Builder) yönlendirmek; kendi
// başına bir tasarım yatırımı gerektirmiyor (kullanıcı odağı Page
// Builder'ın kendisinde), mevcut BlogList/SeriesHeroList'in sade koyu
// admin diliyle tutarlı kalır.
const SECTIONS = [
  { to: '/admin/blogs', title: 'Blog', description: 'Blog yazılarını yönet' },
  { to: '/admin/series-hero', title: 'Series Hero', description: 'Dizi hero bölümlerini düzenle' },
  { to: '/admin/page-builder', title: 'Page Builder', description: 'Genel sayfa oluşturucu (yeni)' },
];

export default function AdminHome() {
  return (
    <section className={styles.adminHome}>
      <header className={styles.adminHome__head}>
        <h1 className={styles.adminHome__title}>Admin</h1>
      </header>

      <ul className={styles.adminHome__grid}>
        {SECTIONS.map((section) => (
          <li key={section.to}>
            <Link to={section.to} className={styles.adminHome__card}>
              <span className={styles.adminHome__cardTitle}>{section.title}</span>
              <span className={styles.adminHome__cardDesc}>{section.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
