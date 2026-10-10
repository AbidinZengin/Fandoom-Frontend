import { Link } from 'react-router-dom';
import { ArrowUpRightIcon } from '../icons';
import styles from './LinkCard.module.css';

// Hızlı erişim kartı. `to`: uygulama içi rota, `href`: dış/yeni sekme.
export default function LinkCard({ to, href, icon, title, description }) {
  const content = (
    <>
      <span className={styles['linkCard__icon']}>{icon}</span>
      <span className={styles['linkCard__text']}>
        <span className={styles['linkCard__title']}>{title}</span>
        <span className={styles['linkCard__desc']}>{description}</span>
      </span>
      <span className={styles['linkCard__arrow']}>
        <ArrowUpRightIcon />
      </span>
    </>
  );

  if (href) {
    return (
      <a className={styles['linkCard']} href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link className={styles['linkCard']} to={to}>
      {content}
    </Link>
  );
}
