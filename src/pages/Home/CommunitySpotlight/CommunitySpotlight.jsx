import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import { useLocalizedNavigate } from '../../../shared/i18n/useLocalizedNavigate';
import { getStoredAuth } from '../../../shared/api/authStorage';
import { joinPortal, leavePortal } from '../../../shared/api/community';
import { PortalIcon } from '../../Community/PortalIcon/PortalIcon';
import { SegmentedControl } from '../../Community/Feed/SegmentedControl/SegmentedControl';
import { formatCount } from '../../Community/formatCount';
import { useMyPortalsStore } from '../../Community/useMyPortalsStore';
import { Cover } from './Cover/Cover';
import { PostTile } from './PostTile/PostTile';
import { PeekCard } from './PeekCard/PeekCard';
import { useThreadLikes } from './useThreadLikes';
import { getCommunityMeta, getCommunityThreads } from './CommunitySpotlight.data';
import styles from './CommunitySpotlight.module.css';

gsap.registerPlugin(ScrollTrigger);

// Sol kolonda gösterilen oda chip sayısı; kalanı "+N" chip'ine düşer.
const CHIP_LIMIT = 6;
// Alandan çıkınca ambient/manşet ilk posta kısa gecikmeyle döner (titremeyi önler).
const RESET_DELAY_MS = 350;
const SURFACES = [
  { key: 'ALL', labelKey: 'community.feed.tabAll' },
  { key: 'DISCUSSION', labelKey: 'navbar.discussion' },
  { key: 'THEORY', labelKey: 'navbar.theories' },
  { key: 'FAN_ART', labelKey: 'navbar.fanArt' },
];
const SORTS = ['hot', 'new', 'top'];

// Tüm "Explore/View all" butonlarıyla aynı ok ikonu (PosterWall deseni).
function ArrowIcon() {
  return (
    <svg
      className={styles['community__arrow']}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.33"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4.5" y1="12" x2="19" y2="12" />
      <polyline points="13.5 6.5 19.5 12 13.5 17.5" />
    </svg>
  );
}

// Home'da Community vitrini ("mini-Community"): solda başlık + CTA + odalar
// (katılmalı) + gerçek sayaçlar; sağda sekmeli/sıralı canlı post grid'i. Bir
// karta gelince arka plandaki ambient zemin onun kapağına geçer; tıklayınca
// kart yerinden kalkıp bölümün ortasına gelir (PosterWall'daki öne gelen kart).
export function CommunitySpotlight() {
  const { t, i18n } = useTranslation();
  const navigate = useLocalizedNavigate();
  const likes = useThreadLikes();
  const sectionRef = useRef(null);
  const tileRefs = useRef(new Map());
  const cache = useRef(new Map());
  const resetTimerRef = useRef(null);
  // Çift tık aynı anda iki istek atmasın.
  const pendingJoin = useRef(new Set());

  const [meta, setMeta] = useState(undefined); // undefined: yükleniyor, null: düştü
  const [portals, setPortals] = useState([]);
  const [surface, setSurface] = useState('ALL');
  const [sort, setSort] = useState('hot');
  const [threads, setThreads] = useState(undefined); // undefined: ilk yükleme
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [peek, setPeek] = useState(null); // { thread }

  useEffect(() => {
    let cancelled = false;
    getCommunityMeta().then((result) => {
      if (cancelled) return;
      setMeta(result);
      setPortals(result?.portals ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sekme/sıralama değişince thread'ler çekilir; aynı anahtar önbellekten gelir.
  useEffect(() => {
    const key = `${surface}|${sort}`;
    const cached = cache.current.get(key);
    if (cached) {
      setThreads(cached);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    getCommunityThreads({ surface, sort }).then((result) => {
      if (cancelled) return;
      if (result) cache.current.set(key, result);
      setThreads(result ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [surface, sort]);

  useEffect(() => () => clearTimeout(resetTimerRef.current), []);

  const ready = threads !== undefined && meta !== undefined;

  // İmza-dalga giriş (bir kez): bölüm görünüme girerken öğeler kademeli gelir.
  useEffect(() => {
    if (!ready) return undefined;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-reveal]', {
          opacity: 0,
          x: 120,
          y: 48,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          clearProps: 'opacity,transform',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 78%', once: true },
        });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [ready]);

  const cancelReset = () => clearTimeout(resetTimerRef.current);
  const scheduleReset = () => {
    cancelReset();
    resetTimerRef.current = setTimeout(() => setActiveId(null), RESET_DELAY_MS);
  };
  const activate = (id) => {
    cancelReset();
    setActiveId(id);
  };

  const changeSurface = (key) => {
    setActiveId(null);
    setSurface(key);
  };
  const changeSort = (key) => {
    setActiveId(null);
    setSort(key);
  };

  const registerTile = (id) => (el) => {
    if (el) tileRefs.current.set(id, el);
    else tileRefs.current.delete(id);
  };

  // Kaynak kartın bölüme göreli CANLI konumu (öne gelen kart ona geri döner).
  const getSourceRect = () => {
    const el = peek ? tileRefs.current.get(peek.thread.id) : null;
    if (!el || !sectionRef.current) return null;
    const rect = el.getBoundingClientRect();
    const sec = sectionRef.current.getBoundingClientRect();
    return { left: rect.left - sec.left, top: rect.top - sec.top, width: rect.width, height: rect.height };
  };

  const openPeek = (thread, ratio) => {
    activate(thread.id);
    setPeek({ thread, ratio });
  };

  const patchPortal = (slug, isMember, memberCount) =>
    setPortals((list) => list.map((p) => (p.slug === slug ? { ...p, isMember, memberCount } : p)));

  // TopPortals ile aynı kural: misafir → hesap sayfası, üye → optimistic katıl/ayrıl.
  const toggleJoin = async (portal) => {
    if (!getStoredAuth()?.token) {
      navigate('/account');
      return;
    }
    if (pendingJoin.current.has(portal.slug)) return;
    pendingJoin.current.add(portal.slug);
    const next = !portal.isMember;
    patchPortal(portal.slug, next, portal.memberCount + (next ? 1 : -1));
    try {
      const res = await (next ? joinPortal(portal.slug) : leavePortal(portal.slug));
      patchPortal(portal.slug, res.member, res.memberCount);
      useMyPortalsStore.getState().bump();
    } catch {
      patchPortal(portal.slug, portal.isMember, portal.memberCount);
    } finally {
      pendingJoin.current.delete(portal.slug);
    }
  };

  if (!ready) return null;
  // İlk yüklemede hiç içerik yoksa bölüm hiç görünmez (sahte içerik yok).
  if (threads.length === 0 && portals.length === 0 && surface === 'ALL') return null;

  const stats = meta?.stats ?? { members: 0, discussions: 0, portals: 0 };
  const chipPortals = portals.slice(0, CHIP_LIMIT);
  const hiddenPortalCount = Math.max(0, stats.portals - chipPortals.length);
  const statItems = [
    { key: 'members', value: stats.members, label: t('community.portal.members', { count: stats.members }) },
    {
      key: 'discussions',
      value: stats.discussions,
      label: t('community.portal.threads', { count: stats.discussions }),
    },
    { key: 'portals', value: stats.portals, label: t('community.sidebar.topPortalsHeading') },
  ].filter((s) => s.value > 0);

  const shownId = peek?.thread.id ?? activeId ?? threads[0]?.id;

  return (
    <section className={styles['community']} ref={sectionRef}>
      {/* Ambient zemin: öne çıkan/üstüne gelinen postun çok bulanık, karartılmış kapağı */}
      <div className={styles['community__ambient']} aria-hidden="true">
        {threads.map((thread) =>
          thread.media?.[0]?.type === 'IMAGE' ? (
            <Cover
              key={thread.id}
              src={thread.media[0].url}
              visible={thread.id === shownId}
              className={styles['community__ambient-image']}
            />
          ) : null
        )}
      </div>

      <div className={styles['community__intro']}>
        {/* lang: text-transform: uppercase Türkçe i/İ, ı/I eşlemesini dile göre yapar. */}
        <h2 className={styles['community__heading']} lang={i18n.language} data-reveal>
          <span className={styles['community__heading-top']}>{t('home.communityHeadingTop')}</span>
          <span className={styles['community__heading-bottom']}>{t('home.communityHeadingBottom')}</span>
        </h2>
        <p className={styles['community__body']} data-reveal>
          {t('community.sidebar.ctaBody')}
        </p>
        <Link to="/community" className={styles['community__cta']} data-reveal>
          {t('home.posterWallViewAll')} <ArrowIcon />
        </Link>

        {chipPortals.length > 0 && (
          <ul className={styles['community__rooms']} data-reveal>
            {chipPortals.map((portal) => (
              <li key={portal.slug} className={styles['community__room']}>
                <Link to={`/portal/${portal.slug}`} className={styles['community__room-link']}>
                  <PortalIcon portal={portal} size="sm" />
                  {portal.name}
                </Link>
                <button
                  type="button"
                  className={styles['community__room-join']}
                  data-joined={portal.isMember || undefined}
                  aria-pressed={portal.isMember}
                  aria-label={`${portal.isMember ? t('community.portal.joined') : t('community.portal.join')}: ${portal.name}`}
                  onClick={() => toggleJoin(portal)}
                >
                  <span aria-hidden="true">{portal.isMember ? '✓' : '+'}</span>
                </button>
              </li>
            ))}
            {hiddenPortalCount > 0 && (
              <li className={styles['community__room']}>
                <Link to="/community" className={styles['community__room-link']}>
                  +{hiddenPortalCount}
                </Link>
              </li>
            )}
          </ul>
        )}

        {statItems.length > 0 && (
          <dl className={styles['community__stats']} data-reveal>
            {statItems.map((s) => (
              <div key={s.key} className={styles['community__stat']}>
                <dt className={styles['community__stat-label']}>{s.label}</dt>
                <dd className={styles['community__stat-value']}>{formatCount(s.value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className={styles['community__stage']}>
        <div className={styles['community__controls']} data-reveal>
          <SegmentedControl
            items={SURFACES.map((s) => ({ key: s.key, label: t(s.labelKey) }))}
            activeKey={surface}
            onSelect={changeSurface}
            label={t('community.feed.tabAll')}
          />
          <SegmentedControl
            items={SORTS.map((key) => ({ key, label: t(`community.feed.sort.${key}`) }))}
            activeKey={sort}
            onSelect={changeSort}
            size="sm"
          />
        </div>

        {/* Composer ipucu: sahte bir giriş çubuğu; yazma deneyimi /community'de */}
        <Link to="/community" className={styles['community__teaser']} data-reveal>
          <span className={styles['community__teaser-icon']} aria-hidden="true">
            ✎
          </span>
          {t('community.composer.titlePlaceholder')}
        </Link>

        {threads.length > 0 ? (
          <div
            className={styles['community__grid']}
            data-loading={loading || undefined}
            data-reveal
            onMouseEnter={cancelReset}
            onMouseLeave={scheduleReset}
          >
            {threads.map((thread) => (
              <PostTile
                key={thread.id}
                thread={thread}
                like={likes.view(thread)}
                onToggleLike={likes.toggle}
                onOpen={openPeek}
                onActivate={activate}
                registerRef={registerTile(thread.id)}
                lifted={peek?.thread.id === thread.id}
              />
            ))}
          </div>
        ) : (
          <Link to="/community" className={styles['community__empty']} data-reveal>
            {t('community.emptyState')}
          </Link>
        )}
      </div>

      {peek && (
        <PeekCard
          thread={peek.thread}
          ratio={peek.ratio}
          like={likes.view(peek.thread)}
          onToggleLike={likes.toggle}
          sectionRef={sectionRef}
          getSourceRect={getSourceRect}
          onClosed={() => setPeek(null)}
        />
      )}
    </section>
  );
}
