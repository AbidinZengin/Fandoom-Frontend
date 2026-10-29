import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import { useLocalizedNavigate } from '../../../../shared/i18n/useLocalizedNavigate';
import { getStoredAuth } from '../../../../shared/api/authStorage';
import { PortalIcon } from '../../PortalIcon/PortalIcon';
import { formatCount } from '../../formatCount';
import { useMyPortalsStore } from '../../useMyPortalsStore';
import { getTopPortals, setPortalMembership } from './TopPortals.data';
import styles from './TopPortals.module.css';

// Sitedeki Explore CTA'larının ok SVG'siyle aynı (SeriesHero ArrowIcon).
function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.33"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={styles.topPortals__allArrow}
    >
      <line x1="4.5" y1="12" x2="19" y2="12" />
      <polyline points="13.5 6.5 19.5 12 13.5 17.5" />
    </svg>
  );
}

// Top Portals — keşif vitrini (PRD, sağ menü): "Gösterişli ve Davetkâr". Büyük
// (40px) ikon, kalın ad, altında soluk üye sayısı (FOMO), satırın sağında
// minik [+ Katıl]. Universes'in yerini alır: evren artık klasör (Portal = Oda).
// Katıl/Ayrıl sonrası store bump'ı sol menüyü ve bu listeyi tazeler.
export function TopPortals() {
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();
  const version = useMyPortalsStore((s) => s.version);
  const [portals, setPortals] = useState([]);
  // Çift tık aynı anda iki istek atmasın.
  const pending = useRef(new Set());

  // Hata durumunda widget sessizce kaybolur (yan panel, ana akışı bozmaz);
  // önceki liste varsa yerinde kalır.
  useEffect(() => {
    let cancelled = false;
    getTopPortals()
      .then((list) => {
        if (!cancelled) setPortals(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [version]);

  const patch = (slug, isMember, memberCount) =>
    setPortals((list) => list.map((p) => (p.slug === slug ? { ...p, isMember, memberCount } : p)));

  const handleToggle = async (portal) => {
    if (!getStoredAuth()?.token) {
      navigate('/account');
      return;
    }
    if (pending.current.has(portal.slug)) return;
    pending.current.add(portal.slug);
    const next = !portal.isMember;
    patch(portal.slug, next, portal.memberCount + (next ? 1 : -1));
    try {
      const res = await setPortalMembership(portal.slug, next);
      patch(portal.slug, res.member, res.memberCount);
      useMyPortalsStore.getState().bump();
    } catch {
      patch(portal.slug, portal.isMember, portal.memberCount);
    } finally {
      pending.current.delete(portal.slug);
    }
  };

  if (portals.length === 0) return null;

  return (
    <section className={styles.topPortals}>
      <h2 className={styles.topPortals__heading}>{t('community.sidebar.topPortalsHeading')}</h2>
      <ul className={styles.topPortals__list}>
        {portals.map((portal) => (
          <li key={portal.slug} className={styles.topPortals__item}>
            <Link to={`/portal/${portal.slug}`} className={styles.topPortals__link}>
              <PortalIcon portal={portal} size="md" />
              <span className={styles.topPortals__text}>
                <span className={styles.topPortals__name}>{portal.name}</span>
                <span className={styles.topPortals__members}>
                  {formatCount(portal.memberCount)} {t('community.portal.members', { count: portal.memberCount })}
                </span>
              </span>
            </Link>
            <button
              type="button"
              className={styles.topPortals__join}
              data-joined={portal.isMember || undefined}
              aria-pressed={portal.isMember}
              aria-label={`${portal.isMember ? t('community.portal.joined') : t('community.portal.join')}: ${portal.name}`}
              onClick={() => handleToggle(portal)}
            >
              {portal.isMember ? t('community.portal.joined') : t('community.portal.joinShort')}
            </button>
          </li>
        ))}
      </ul>
      <Link to="/portal" className={styles.topPortals__all}>
        {t('community.sidebar.allPortals')}
        <ArrowIcon />
      </Link>
    </section>
  );
}
