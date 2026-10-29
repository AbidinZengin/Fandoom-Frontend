import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import { useLocalizedNavigate } from '../../../shared/i18n/useLocalizedNavigate';
import { getStoredAuth } from '../../../shared/api/authStorage';
import { Breadcrumb } from '../Breadcrumb/Breadcrumb';
import Feed from '../Feed/Feed';
import { useMyPortalsStore } from '../useMyPortalsStore';
import { FeedSkeleton } from '../Feed/FeedSkeleton/FeedSkeleton';
import { PortalHeader } from './PortalHeader/PortalHeader';
import { getPortalBySlug, setPortalMembership } from './Portal.data';
import styles from './Portal.module.css';

// STAFF_ONLY portala yalnız MODERATOR/ADMIN yazar — saklanan rol bayat olabilir,
// yalnız arayüz ipucudur; yetki kararı backend'indir (403).
const STAFF_ROLES = ['MODERATOR', 'ADMIN'];
// Tür sekmeleri `?surface=` ile süzer; geçersiz/eksik değer = tüm türler.
const SURFACE_KEYS = ['DISCUSSION', 'THEORY', 'FAN_ART'];

// /portal/:portalSlug — CommunityLayout'un İÇİNDE (sidebar'lar sabit): atmosferik
// header + o portala ait akış. Sözleşme: GET /community/portals/{slug}, akış
// GET /community/feed?portal={slug}; yok/HIDDEN portal 404 → "bulunamadı".
// Tema rengi backend'den gelir: `portal.accentColor` (nullable #RRGGBB; gradyan/sis
// sunumu FE'de). Rengi olan portal atmosfer paneline (Spotify düzeni) geçer, olmayan
// eski header'da kalır. Üye avatarları backend'de YOK — sahte veriyle doldurulmaz
// ([veri] kuralı). Megathread (sabitlenmiş gündem) için yuva da AÇILMAZ (kullanıcı
// kararı: boş kutu gereksiz boşluk); sabitleme alanı gelince eklenir.
export default function Portal() {
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();
  const { portalSlug } = useParams();
  const [searchParams] = useSearchParams();
  const surfaceParam = searchParams.get('surface');
  const surface = SURFACE_KEYS.includes(surfaceParam) ? surfaceParam : undefined;
  // status: loading | ready | notFound | error
  const [state, setState] = useState({ status: 'loading', portal: null });
  // Çift tık aynı anda iki istek atmasın (idempotent olsa da sayaç titrer).
  const pending = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', portal: null });
    getPortalBySlug(portalSlug)
      .then((portal) => {
        if (!cancelled) setState(portal ? { status: 'ready', portal } : { status: 'notFound', portal: null });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', portal: null });
      });
    return () => {
      cancelled = true;
    };
  }, [portalSlug]);

  const { status, portal } = state;

  if (status === 'loading') return <FeedSkeleton label={t('community.feed.loading')} count={1} />;

  if (status !== 'ready') {
    return (
      <div className={styles.portal__missing}>
        <p className={styles.portal__missingText}>
          {status === 'error' ? t('community.loadError') : t('community.portal.notFound')}
        </p>
        <Link to="/community" className={styles.portal__back}>
          {t('community.thread.backToFeed')}
        </Link>
      </div>
    );
  }

  // Optimistic: sayaç ve durum hemen döner, sunucu cevabı (kesin sayaç) eşitler,
  // hatada geri alınır. Oturumsuz kullanıcı /account'a gider (useThreadActions ile aynı).
  const handleToggleMember = async () => {
    if (!getStoredAuth()?.token) {
      navigate('/account');
      return;
    }
    if (pending.current) return;
    pending.current = true;
    const next = !portal.isMember;
    const patch = (isMember, memberCount) =>
      setState((s) => (s.portal ? { ...s, portal: { ...s.portal, isMember, memberCount } } : s));
    patch(next, portal.memberCount + (next ? 1 : -1));
    try {
      const res = await setPortalMembership(portal.slug, next);
      patch(res.member, res.memberCount);
      useMyPortalsStore.getState().bump();
    } catch {
      patch(!next, portal.memberCount);
    } finally {
      pending.current = false;
    }
  };

  const isStaff = STAFF_ROLES.includes(getStoredAuth()?.role);
  const canPost = portal.status === 'ACTIVE' && (portal.postingPolicy === 'OPEN' || isStaff);

  const themeColor = portal.accentColor || undefined;

  const content = (
    <>
      <PortalHeader portal={portal} themeColor={themeColor} onToggleMember={handleToggleMember} />

      {!canPost && <p className={styles.portal__notice}>{t('community.portal.postingClosed')}</p>}

      <Feed surface={surface} portal={{ slug: portal.slug, name: portal.name, canPost }} />
    </>
  );

  // accentColor'lı portal: orta sütunun TÜM içeriği tek bir radius'lu panelde
  // toplanır; sis panelin içinde tepeden aşağı erir (Spotify çalma listesi düzeni).
  // accentColor'suz portallar eski akışta kalır.
  // Fragment: breadcrumb ve içerik `<main>`'in doğrudan çocuğu kalır (route
  // geçişinde yalnız içerik fade'lenir, breadcrumb sabit — bkz. Breadcrumb).
  return (
    <>
      <Breadcrumb
        items={[
          { label: t('navbar.community'), to: '/community' },
          { label: t('community.portals.crumb'), to: '/portal' },
          { label: portal.name },
        ]}
      />
      {themeColor ? (
        <div className={styles.portal__panel} style={{ '--portal-theme': themeColor }}>
          {content}
        </div>
      ) : (
        content
      )}
    </>
  );
}
