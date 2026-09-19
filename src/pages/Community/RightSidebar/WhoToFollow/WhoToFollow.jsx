import { useTranslation } from 'react-i18next';
import styles from './WhoToFollow.module.css';

// "Takip Et" butonu bu fazda DEKORATİF — backend'in follow ucu (/me/follows)
// itemType PRODUCTION/BLOG içindir, kullanıcı-kullanıcı takibi ayrı bir uç
// gerektirir ve henüz teyit edilmedi. Profil linki de aynı sebeple Faz 2'de
// (@:username route'u kurulunca).
export function WhoToFollow({ people }) {
  const { t } = useTranslation();

  return (
    <section className={styles.whoToFollow}>
      <h2 className={styles.whoToFollow__heading}>{t('community.sidebar.whoToFollowHeading')}</h2>
      <ul className={styles.whoToFollow__list}>
        {people.map((person) => (
          <li key={person.username} className={styles.whoToFollow__item}>
            <div className={styles.whoToFollow__avatar}>{person.username.charAt(0).toUpperCase()}</div>
            <div className={styles.whoToFollow__info}>
              <span className={styles.whoToFollow__username}>@{person.username}</span>
              <span className={styles.whoToFollow__bio}>{person.bio}</span>
            </div>
            <button type="button" className={styles.whoToFollow__button}>
              {t('community.sidebar.follow')}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
