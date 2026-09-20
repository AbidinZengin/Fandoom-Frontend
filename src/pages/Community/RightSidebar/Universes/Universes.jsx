import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getUniverseCards } from './Universes.data';
import styles from './Universes.module.css';

// Evren keşfi RightSidebar'a taşındı (kullanıcı düzeltmesi, 2026-09-13):
// eski UniverseBrowse'un tam-genişlik yatay şeridi yerine, bu tasarımın
// kendi kompakt kart diline uyarlanmış hâli — diğer RightSidebar
// widget'larıyla (TrendingTags/RecentActivity/WhoToFollow) aynı yüzey.
export function Universes() {
  const { t } = useTranslation();
  const [universes, setUniverses] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getUniverseCards().then((cards) => {
      if (!cancelled) setUniverses(cards);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (universes.length === 0) return null;

  return (
    <section className={styles.universes}>
      <h2 className={styles.universes__heading}>{t('community.sidebar.universesHeading')}</h2>
      <ul className={styles.universes__list}>
        {universes.map((universe) => (
          <li key={universe.id} className={styles.universes__item}>
            <span className={styles.universes__name}>{universe.name}</span>
            <div className={styles.universes__productions}>
              {universe.productions.map((production) => (
                <span key={production.title} className={styles.universes__tag}>
                  {production.title}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
