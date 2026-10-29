import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import styles from './Breadcrumb.module.css';

// Community breadcrumb'ı (ListDetail embedded kipiyle aynı dil): `items` soldan
// sağa; `to`su olan öğe link, sonuncusu (to'suz) mevcut sayfadır.
// data-route-persist: CommunityLayout'un route geçişi fade'i bu öğeye dokunmaz —
// sayfa `<main>`'in DOĞRUDAN çocuğu olarak basmalı (sarmalayıcıya konursa sarmalayıcı
// fade'lenir). Yalnız altındaki içerik değişir, "Community › Portals" yerinde kalır.
export function Breadcrumb({ items }) {
  const { t } = useTranslation();
  return (
    <nav className={styles.breadcrumb} aria-label={t('community.thread.breadcrumb')} data-route-persist>
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 && <span aria-hidden="true">›</span>}
          {item.to ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span className={styles.breadcrumb__current} aria-current="page">
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
