import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import { useLocalizedNavigate } from '../../../shared/i18n/useLocalizedNavigate';
import { getStoredAuth } from '../../../shared/api/authStorage';
import { CarouselArrow } from '../../Blog/CarouselArrow/CarouselArrow';
import { Breadcrumb } from '../Breadcrumb/Breadcrumb';
import { PortalIcon } from '../PortalIcon/PortalIcon';
import { formatCount } from '../formatCount';
import { useMyPortalsStore } from '../useMyPortalsStore';
import { getAllPortals, setPortalMembership } from './PortalsIndex.data';
import styles from './PortalsIndex.module.css';

const SKELETON_COUNT = 4;
// Büyük vitrin kartı: ürün bağımsız ana sohbet odası (backend seed slug'ı).
const FEATURED_SLUG = 'general-chat';

// /portal — tüm portalların keşif sayfası (CommunityLayout'un İÇİNDE, orta sütun).
// TopPortals'ın "Tüm portallar" linkinin hedefi. Üstte General Chat büyük vitrin
// kartı (banner/rengi yok → koyu soft mesh), altında diğer portallar renkli
// görsel kartlarla yatay carousel. Liste bir kez çekilir, arama istemcide süzer:
// General Chat aramadan ETKİLENMEZ (hep üstte), eşleşen portallar altında kalır.
// Katıl/Ayrıl mantığı TopPortals ile aynı: optimistic, hatada geri al, store
// bump'ı sol menüyü tazeler.
export default function PortalsIndex() {
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();
  const version = useMyPortalsStore((s) => s.version);
  const [query, setQuery] = useState('');
  // status: loading | ready | error.
  const [state, setState] = useState({ status: 'loading', portals: [] });
  // Çift tık aynı anda iki istek atmasın.
  const pending = useRef(new Set());

  const viewportRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  // version: Katıl/Ayrıl başka yerden (sol menü, portal sayfası) değişince liste tazelenir.
  useEffect(() => {
    let cancelled = false;
    getAllPortals()
      .then((portals) => {
        if (!cancelled) setState({ status: 'ready', portals });
      })
      .catch(() => {
        if (!cancelled) setState((s) => (s.portals.length ? s : { status: 'error', portals: [] }));
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const patch = (slug, isMember, memberCount) =>
    setState((s) => ({
      ...s,
      portals: s.portals.map((p) => (p.slug === slug ? { ...p, isMember, memberCount } : p)),
    }));

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

  const { status, portals } = state;
  const featured = portals.find((p) => p.slug === FEATURED_SLUG);
  const needle = query.trim().toLocaleLowerCase();
  const others = portals.filter((p) => p.slug !== FEATURED_SLUG);
  const matches = (p) => !needle || `${p.name} ${p.description ?? ''}`.toLocaleLowerCase().includes(needle);
  const visibleCount = others.filter(matches).length;

  // Ok durumları gerçek kaydırma konumundan okunur (TopBlogsRow ile aynı yaklaşım).
  const sync = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    // Track'i de izle: süzmede kartlar daralıp açılırken scrollWidth değişir,
    // oklar viewport boyutu sabit kalsa da güncellenmeli.
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', sync);
      ro.disconnect();
    };
  }, [sync, others.length, status]);

  // Arama değişince şerit başa kayar — açılan kartlar görünür alanda kalsın.
  useEffect(() => {
    viewportRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  }, [needle]);

  const step = (direction) => {
    const el = viewportRef.current;
    const card = el?.firstElementChild?.firstElementChild;
    if (!card) return;
    el.scrollBy({ left: direction * (card.offsetWidth + parseFloat(getComputedStyle(card.parentElement).columnGap || 0)), behavior: 'smooth' });
  };

  const joinButton = (portal) => (
    <button
      type="button"
      className={styles.portalsIndex__join}
      data-joined={portal.isMember || undefined}
      aria-pressed={portal.isMember}
      aria-label={`${portal.isMember ? t('community.portal.joined') : t('community.portal.join')}: ${portal.name}`}
      onClick={() => handleToggle(portal)}
    >
      {portal.isMember ? t('community.portal.joined') : t('community.portal.joinShort')}
    </button>
  );

  const stats = (portal) => (
    <span className={styles.portalsIndex__stats}>
      {formatCount(portal.memberCount)} {t('community.portal.members', { count: portal.memberCount })}
      {' • '}
      {formatCount(portal.threadCount)} {t('community.portal.threads', { count: portal.threadCount })}
    </span>
  );

  // Fragment: breadcrumb `<main>`'in doğrudan çocuğu kalır (route geçişinde sabit).
  return (
    <>
      <Breadcrumb items={[{ label: t('navbar.community'), to: '/community' }, { label: t('community.portals.crumb') }]} />

      <section className={styles.portalsIndex}>
      <div className={styles.portalsIndex__sections}>
        {status === 'loading' && (
          <div role="status">
            <span className={styles.portalsIndex__sr}>{t('community.feed.loading')}</span>
            <div className={styles.portalsIndex__featured} data-skeleton aria-hidden="true" />
          </div>
        )}

        {status === 'ready' && featured && (
          <article className={styles.portalsIndex__featured}>
            <Link to={`/portal/${featured.slug}`} className={styles.portalsIndex__featuredLink}>
              <span className={styles.portalsIndex__featuredName}>{featured.name}</span>
              {featured.description && (
                <span className={styles.portalsIndex__featuredDescription}>{featured.description}</span>
              )}
              {stats(featured)}
            </Link>
            <div className={styles.portalsIndex__featuredJoin}>{joinButton(featured)}</div>
          </article>
        )}

        {/* Arama satırı hata dışında hep aynı konumda kalır: sonuç yokken de
            unmount olmaz, yazarken odak kaybolmaz. */}
        {status !== 'error' && (
          <div className={styles.portalsIndex__controls}>
            <h2 className={styles.portalsIndex__subheading}>{t('community.portals.popular')}</h2>
            <input
              type="search"
              className={styles.portalsIndex__search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('community.portals.searchPlaceholder')}
              aria-label={t('community.portals.searchPlaceholder')}
            />
          </div>
        )}

        {status === 'loading' && (
          <ul className={styles.portalsIndex__track} aria-hidden="true">
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <li key={index} className={styles.portalsIndex__slot}>
                <div className={styles.portalsIndex__card} data-skeleton />
              </li>
            ))}
          </ul>
        )}

        {status === 'error' && <p className={styles.portalsIndex__message}>{t('community.loadError')}</p>}

        {status === 'ready' && visibleCount === 0 && (
          <p className={styles.portalsIndex__message}>
            {query ? t('community.portals.noResults') : t('community.portals.empty')}
          </p>
        )}

        {status === 'ready' && others.length > 0 && (
          <div className={styles.portalsIndex__carousel} data-empty={visibleCount === 0 || undefined}>
            <CarouselArrow direction="prev" onClick={() => step(-1)} disabled={atStart} />
            <div className={styles.portalsIndex__viewport} ref={viewportRef}>
              <ul className={styles.portalsIndex__track}>
                {/* Eşleşmeyen kart DOM'da kalır, slot genişlik+opaklık geçişiyle kapanır;
                    inert → kapalıyken odaklanamaz/okunmaz. */}
                {others.map((portal) => {
                  const hidden = !matches(portal);
                  return (
                    <li
                      key={portal.slug}
                      className={styles.portalsIndex__slot}
                      data-hidden={hidden || undefined}
                      inert={hidden || undefined}
                    >
                      <div
                        className={styles.portalsIndex__card}
                        style={{
                          ...(portal.accentColor ? { '--portal-theme': portal.accentColor } : null),
                          ...(portal.bannerUrl ? { '--portal-banner': `url("${portal.bannerUrl}")` } : null),
                        }}
                      >
                        <Link to={`/portal/${portal.slug}`} className={styles.portalsIndex__cardLink}>
                          <PortalIcon portal={portal} size="md" />
                          <span className={styles.portalsIndex__cardText}>
                            <span className={styles.portalsIndex__name}>{portal.name}</span>
                            {portal.description && (
                              <span className={styles.portalsIndex__description}>{portal.description}</span>
                            )}
                            {stats(portal)}
                          </span>
                        </Link>
                        <div className={styles.portalsIndex__cardJoin}>{joinButton(portal)}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <CarouselArrow direction="next" onClick={() => step(1)} disabled={atEnd} />
          </div>
        )}
      </div>
      </section>
    </>
  );
}
