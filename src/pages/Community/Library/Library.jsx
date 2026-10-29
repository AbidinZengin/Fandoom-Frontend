import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLang } from '../../../shared/i18n/useLang';
import { withLangPrefix } from '../../../shared/i18n/constants';
import { getStoredAuth } from '../../../shared/api/authStorage';
import { ContentSection } from '../../Account/DashboardView/ContentSection/ContentSection';
import { getLibraryItems } from '../../Account/Account.data';
import { RequireSession } from '../RequireSession/RequireSession';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import styles from './Library.module.css';

// Kütüphane sekmeleri artık Community'nin orta kolonunda (/community/library/:tab).
// İçerik ve başlık metinleri Account'taki ContentSection ile aynıdır.
const TABS = {
  watchlist: { headingKey: 'account.content.watchlistHeading', ctaKey: 'account.content.continueCta' },
  saved: { headingKey: 'account.content.savedHeading', ctaKey: 'account.content.readCta' },
  following: { headingKey: 'account.content.followingHeading', ctaKey: 'account.content.viewCta' },
  liked: { headingKey: 'account.content.likedHeading', ctaKey: 'account.content.viewCta' },
};

export default function Library() {
  const { tab } = useParams();
  const { t } = useTranslation();
  const lang = useLang();
  const config = TABS[tab];
  const [items, setItems] = useState(null);

  useEffect(() => {
    // Oturumsuz kullanıcı için istek atılmaz (RequireSession giriş çağrısı gösterir).
    if (!config || !getStoredAuth()?.token) return undefined;
    let cancelled = false;
    setItems(null);
    getLibraryItems(tab)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, config]);

  if (!config) return <Navigate to={withLangPrefix('/community/library/watchlist', lang)} replace />;

  return (
    <RequireSession>
      <nav className={styles.library__tabs} aria-label={t('community.sidebar.libraryHeading')}>
        {Object.keys(TABS).map((key) => (
          <Link
            key={key}
            to={`/community/library/${key}`}
            className={styles.library__tab}
            data-active={key === tab || undefined}
          >
            {t(`community.sidebar.${key}`)}
          </Link>
        ))}
      </nav>
      <ContentSection heading={t(config.headingKey)} items={items} ctaLabel={t(config.ctaKey)} />
    </RequireSession>
  );
}
