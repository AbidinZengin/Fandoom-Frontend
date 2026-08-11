import { Link } from 'react-router-dom';
import styles from './TagChips.module.css';

// Blog yazısı ↔ yapım/sezon/bölüm bağı n-n çapraz-kesen tag'dir
// (learned-rules [blog-veri]) — sezon/bölüm ZORUNLU DEĞİL, bir tag yalnız
// yapıma ya da (productionSlug bile olmadan) serbest bir konu etiketine de
// işaret edebilir. Bir yazının hiçbir bölümle ilişkisi OLMAYABİLİR — bu
// durumda `tags` boş/undefined kalır ve component hiçbir şey basmaz (yer
// kaplayan boş bir satır bırakılmaz).
function tagLabel(tag) {
  if (tag.label) return tag.label;
  const parts = [];
  if (tag.productionSlug) {
    parts.push(
      tag.productionSlug
        .split('-')
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(' ')
    );
  }
  if (tag.seasonNumber != null) parts.push(`S${tag.seasonNumber}`);
  if (tag.episodeNumber != null) parts.push(`E${tag.episodeNumber}`);
  return parts.join(' · ');
}

// Yalnız BÖLÜM sayfası rotası bugün gerçekten var (game-of-thrones),
// başka yapımlar için sezon/bölüm derinliğinde link üretilmez — üretim
// sayfası (`/series/:slug`) her yapım için geçerli, en güvenli geri düşüş.
function tagHref(tag) {
  if (tag.productionSlug === 'game-of-thrones' && tag.seasonNumber != null && tag.episodeNumber != null) {
    return `/series/game-of-thrones/seasons/${tag.seasonNumber}/episodes/${tag.episodeNumber}`;
  }
  if (tag.productionSlug) return `/series/${tag.productionSlug}`;
  return null;
}

export function TagChips({ tags }) {
  if (!tags || tags.length === 0) return null;

  return (
    <ul className={styles.chips}>
      {tags.map((tag, i) => {
        const href = tagHref(tag);
        const label = tagLabel(tag);
        const key = `${tag.productionSlug ?? tag.label ?? 'tag'}-${i}`;
        return (
          <li key={key}>
            {href ? (
              <Link to={href} className={styles.chip}>
                {label}
              </Link>
            ) : (
              <span className={styles.chip}>{label}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
