import { BlogCard } from '../BlogCard/BlogCard';
import styles from './SideList.module.css';

// FEATURED / LATEST yan şeritleri — ikisi de aynı BlogCard satırını
// paylaşır, sadece üstlerindeki başlık (Blog.jsx) farklı. Veri gelene kadar
// `count` kadar iskelet kart basılır.
export function SideList({ items = [], count = 3 }) {
  if (items.length === 0) {
    return (
      <ul className={styles.list}>
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <BlogCard />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.id}>
          <BlogCard item={item} />
        </li>
      ))}
    </ul>
  );
}
