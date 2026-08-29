import { useTranslation } from 'react-i18next';
import { BADGES } from '../../Account.data';
import styles from './CharactersSection.module.css';

const PODIUM_ORDER = [2, 1, 3];

export function CharactersSection({ topCharacters }) {
  const { t } = useTranslation();
  const characters = topCharacters ?? [];

  return (
    <section className={styles.characters}>
      <h1 className={styles.characters__heading}>{t('account.characters.podiumHeading')}</h1>

      <div className={styles.characters__podium}>
        {PODIUM_ORDER.map((rank) => {
          const character = characters[rank - 1];
          if (!character) return null;
          return (
            <div key={character.id} className={styles.characters__podiumSpot} data-rank={rank}>
              <img
                src={character.imageUrl}
                alt={character.name}
                className={styles.characters__podiumImage}
              />
              <span className={styles.characters__podiumRank}>{rank}</span>
              <p className={styles.characters__podiumName}>{character.name}</p>
            </div>
          );
        })}
      </div>

      <h2 className={styles.characters__badgesHeading}>{t('account.characters.badgesHeading')}</h2>
      <ul className={styles.characters__badgeGrid}>
        {BADGES.map((badge) => (
          <li
            key={badge.key}
            className={styles.characters__badge}
            data-locked={!badge.unlocked}
            title={
              badge.unlocked
                ? undefined
                : t('account.characters.lockedBadgeHint', { count: badge.hintCount })
            }
          >
            <span className={styles.characters__badgeIcon} aria-hidden="true">
              ★
            </span>
            <span className={styles.characters__badgeName}>
              {t(`account.characters.badgeNames.${badge.key}`)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
