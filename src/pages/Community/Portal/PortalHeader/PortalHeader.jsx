import { useTranslation } from 'react-i18next';
import { AnimatedCount } from '../../ThreadActions/AnimatedCount/AnimatedCount';
import { formatCount } from '../../formatCount';
import styles from './PortalHeader.module.css';

// Atmosferik portal başlığı (PRD): bulanık banner zemini + sis → ikon, ad,
// açıklama → Katıl + sosyal kanıt (üye • tartışma; çevrimiçi sayısı YOK).
// `themeColor` (= portal.accentColor) verilirse ATMOSFER varyantı: sis/radius
// Portal.jsx'teki panele ait, header yalnız içerik (ikon, ad, açıklama, aksiyonlar
// sağ sütunda). Rengi olmayan portalda: `bannerUrl` varsa bulanık ambient zemin,
// yoksa nötr koyu gradient (learned-rules ambient-blur kuralı: karartma katmanı).
// Üst üste binen üye avatarları backend'de yok → kesik çerçeveli 3 iskelet halka.
export function PortalHeader({ portal, themeColor, onToggleMember }) {
  const { t } = useTranslation();
  const { name, description, iconUrl, bannerUrl, memberCount, threadCount, isMember, status } = portal;
  // ARCHIVED portala yeni üyelik backend'de 400 — mevcut üye yine ayrılabilir.
  const joinDisabled = status === 'ARCHIVED' && !isMember;

  const actions = (
    <div className={styles.portalHeader__actions}>
      <button
        type="button"
        className={styles.portalHeader__join}
        data-joined={isMember || undefined}
        aria-pressed={isMember}
        disabled={joinDisabled}
        onClick={onToggleMember}
      >
        {isMember ? t('community.portal.joined') : t('community.portal.join')}
      </button>

      {!themeColor && (
        <span className={styles.portalHeader__avatars} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      )}

      <p className={styles.portalHeader__stats}>
        <span>
          <AnimatedCount count={memberCount} text={formatCount(memberCount)} /> {t('community.portal.members', { count: memberCount })}
        </span>
        <span aria-hidden="true">•</span>
        <span>
          {formatCount(threadCount)} {t('community.portal.threads', { count: threadCount })}
        </span>
      </p>
    </div>
  );

  return (
    <header
      className={styles.portalHeader}
      data-has-banner={Boolean(bannerUrl) || undefined}
      data-variant={themeColor ? 'atmosphere' : undefined}
      style={themeColor ? { '--portal-theme': themeColor } : undefined}
    >
      {!themeColor && (
        <div
          className={styles.portalHeader__ambient}
          style={bannerUrl ? { backgroundImage: `url("${bannerUrl}")` } : undefined}
          aria-hidden="true"
        />
      )}

      <div className={styles.portalHeader__identity}>
        {iconUrl ? (
          <img src={iconUrl} alt="" className={styles.portalHeader__icon} />
        ) : (
          <span className={styles.portalHeader__icon} data-fallback aria-hidden="true">
            {name.charAt(0).toUpperCase()}
          </span>
        )}

        <div className={styles.portalHeader__text}>
          <h2 className={styles.portalHeader__name}>{name}</h2>
          {description && <p className={styles.portalHeader__description}>{description}</p>}
          {themeColor && actions}
        </div>
      </div>

      {!themeColor && actions}
    </header>
  );
}
