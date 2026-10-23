import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import { PortalIcon } from '../../PortalIcon/PortalIcon';
import styles from './PortalsNav.module.css';

// Portallarım — hızlı geçiş (PRD, sol menü): "Kompakt ve Sade", yalnız küçük ikon
// + tek satır ad. Okunmamış/yeni başlık noktası backend'de karşılığı olmadığı
// için YOK (opsiyonel özellikti, sahte veriyle doldurulmaz). Boş durum çıplak
// bırakılmaz ([topluluk-navigasyon] kuralı): katılınca burada görüneceği söylenir.
export function PortalsNav({ portals, rail, onNavigate }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  // /<lang>/portal/<slug>[/post/...] — aktif portal, "portal" segmentinin hemen sonrasıdır.
  const segments = pathname.split('/');
  const activeSlug = segments[segments.indexOf('portal') + 1];

  return (
    <nav className={styles.portalsNav} data-rail={rail || undefined} aria-label={t('community.sidebar.portalsHeading')}>
      {!rail && <span className={styles.portalsNav__heading}>{t('community.sidebar.portalsHeading')}</span>}
      {portals.length === 0 ? (
        !rail && <p className={styles.portalsNav__empty}>{t('community.sidebar.portalsEmpty')}</p>
      ) : (
        <ul className={styles.portalsNav__list}>
          {portals.map((portal) => (
            <li key={portal.slug}>
              <Link
                to={`/portal/${portal.slug}`}
                className={styles.portalsNav__link}
                data-active={portal.slug === activeSlug || undefined}
                aria-label={rail ? portal.name : undefined}
                title={rail ? portal.name : undefined}
                onClick={onNavigate}
              >
                <PortalIcon portal={portal} size={rail ? 'md' : 'sm'} />
                {!rail && <span className={styles.portalsNav__name}>{portal.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
