import { BlogCard } from '../BlogCard/BlogCard';
import styles from './SideList.module.css';

// FEATURED / LATEST yan şeritleri — ikisi de aynı BlogCard satırını
// paylaşır, sadece üstlerindeki başlık (Blog.jsx) farklı.
export function SideList({ count = 3 }) {
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
