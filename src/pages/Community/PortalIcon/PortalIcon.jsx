import styles from './PortalIcon.module.css';

// Sidebar'lardaki portal ikonu — sol menüde `sm` (24px), sağ menüde `md` (40px).
// Backend'de ikon yoksa (`iconUrl` null) baş harf: avatar fallback kalıbı, monokrom.
export function PortalIcon({ portal, size = 'sm' }) {
  return portal.iconUrl ? (
    <img src={portal.iconUrl} alt="" className={styles.portalIcon} data-size={size} />
  ) : (
    <span className={styles.portalIcon} data-size={size} data-fallback aria-hidden="true">
      {portal.name.charAt(0).toUpperCase()}
    </span>
  );
}
