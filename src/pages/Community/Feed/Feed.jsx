import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigationType } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { PostComposer } from './PostComposer/PostComposer';
import { SurfaceFilter } from './SurfaceFilter/SurfaceFilter';
import { SortBar } from './SortBar/SortBar';
import { FeedCard } from './FeedCard/FeedCard';
import { FeedRow } from './FeedRow/FeedRow';
import { FeedTile } from './FeedTile/FeedTile';
import { FeedSkeleton } from './FeedSkeleton/FeedSkeleton';
import { getFeedThreads } from './Feed.data';
import { FEED_STALE_MS, feedKey, useFeedStore } from './useFeedStore';
import { useControlsReveal } from './useControlsReveal';
import styles from './Feed.module.css';

// PRD "Chameleon Feed": orta akış aktif Post Türü'ne göre görünüm değiştirir —
// ALL → geniş kartlar (vitrin), Discussion/Theories → sıkışık liste (okuma
// odası), Fan Art → masonry galeri. Görünüm YALNIZ yüzeyden türer; render
// farkıdır, ayrı bir istek değil. Veri anahtarı yüzey+sıralamadır ve zustand
// önbelleğinde durur (useFeedStore): daha önce açılan sekmeye/detaydan geri
// dönüş ağa gitmez. Sayfa boyutu görünüme göre (kart 5, liste 15, galeri 12).
const VIEWS = { ALL: 'card', DISCUSSION: 'list', THEORY: 'list', FAN_ART: 'grid' };
const PAGE_SIZES = { card: 5, list: 15, grid: 12 };
// Kart girişi kademesi: her sayfa grubunun içinde sıra × 60ms.
const STAGGER_MS = 60;

// index route'u (surface=undefined, karışık akış) VE discussion/theories/
// fan-art route'larını (surface sabit) TEK component karşılar — ayrı bir
// SurfaceFeed dosyası açmak burada gereksiz kopya olurdu (Karpathy ilkesi:
// istenenden fazla soyutlama yok); tek fark PostComposer'ın varsayılan
// yüzeyi ve listenin filtresi. Sıralama ve sayfalama sunucuda.
// `portal` ({slug, name, canPost}, Portal sayfasından): akış yalnız o odanın
// thread'leridir; PRD gereği portal içinde liste görünümü YOK — tüm türler
// kartla akar, tür sekmeleri `?surface=` ile aynı sayfada süzer (Portal.jsx),
// composer portalı kilitli gelir
// (canPost=false: ARCHIVED / STAFF_ONLY → composer hiç çıkmaz).
// Route'lar aynı Feed örneğini yeniden kullanır (remount yok) — bu yüzden
// hata/"daha fazla" durumları ANAHTARA bağlıdır, sekme değişince eski sekmenin
// durumu sızmaz; yükleme durumu da türetilir (`!entry && !error`), böylece
// önbelleksiz sekmede bir kare bile sahte "boş" görünmez.
export default function Feed({ surface, portal }) {
  const { t } = useTranslation();
  const navigationType = useNavigationType();
  const portalSlug = portal?.slug;
  const view = portal ? 'card' : VIEWS[surface ?? 'ALL'];
  const size = PAGE_SIZES[view];
  const sort = useFeedStore((s) => s.sort);
  const setSort = useFeedStore((s) => s.setSort);
  const save = useFeedStore((s) => s.save);
  const key = feedKey(surface, sort, portalSlug);
  const entry = useFeedStore((s) => s.entries[key]);
  const [errorKey, setErrorKey] = useState(null);
  const [more, setMore] = useState({ key: null, status: 'idle' });
  const [reloadKey, setReloadKey] = useState(0);
  // Detaydan geri (POP) dönüşte liste kaldığı yere döner; sekme/link ile
  // gelişte başa iner. Konum İLK RENDER'da okunur (StrictMode'da cleanup
  // sonradan sıfır yazsa da değer kaybolmaz).
  const [restoreTo] = useState(() =>
    navigationType === 'POP' ? (useFeedStore.getState().entries[key]?.scrollY ?? 0) : 0,
  );
  const controlsRef = useRef(null);
  useControlsReveal(controlsRef);

  const threads = entry?.threads ?? [];
  const error = errorKey === key;
  const loading = !entry && !error;

  // Tür sekmesi değişince liste/galeri öğeleri sırayla (kademeli) belirir;
  // composer ve sekme çubuğu yerinde kalır (CommunityLayout'taki sütun geçişi
  // sekme↔sekme için bu yüzden atlanır). Kart görünümünün (ALL, portal) kademeli
  // girişi FeedCard'ın kendi CSS animasyonudur — burada tekrarlanmaz. Veri
  // gelene kadar (iskelet) beklenir; sıralama değişimi animasyon almaz. İlk
  // render atlanır. useLayoutEffect: öğeler tam opaklıkta boyanmasın.
  const bodyRef = useRef(null);
  const animatedSurface = useRef(surface);
  const showingItems = !loading && !error && threads.length > 0;
  useLayoutEffect(() => {
    if (animatedSurface.current === surface || !showingItems) return undefined;
    animatedSurface.current = surface;
    if (view === 'card') return undefined;

    const items = bodyRef.current?.firstElementChild?.children;
    if (!items?.length) return undefined;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        items,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: 'power2.out', stagger: { amount: 0.4 }, clearProps: 'opacity' }
      );
    });
    return () => mm.revert();
  }, [surface, showingItems, view]);

  const page = entry?.page ?? 0;
  const hasMore = entry?.hasMore ?? false;
  const moreLoading = more.key === key && more.status === 'loading';
  const moreFailed = more.key === key && more.status === 'failed';

  // surface/sort değişince (önbellekte taze yoksa) veya yeni post atılınca liste
  // baştan yüklenir. Yarış durumu: eski isteğin cevabı yeni seçimin listesini
  // ezmesin diye cleanup'ta iptal bayrağı set edilir.
  useEffect(() => {
    const cached = useFeedStore.getState().entries[key];
    if (cached?.loadedAt && Date.now() - cached.loadedAt < FEED_STALE_MS) return undefined;
    let cancelled = false;
    getFeedThreads({ surface, sort, page: 0, size, portal: portalSlug })
      .then((res) => {
        if (cancelled) return;
        setErrorKey(null);
        save(key, { threads: res.threads, hasMore: res.hasMore, page: 0, loadedAt: Date.now() });
      })
      .catch(() => {
        if (!cancelled) setErrorKey(key);
      });
    return () => {
      cancelled = true;
    };
  }, [key, reloadKey, surface, sort, size, portalSlug, save]);

  useEffect(() => {
    if (!restoreTo) return undefined;
    // App'in route scroll sıfırlaması layout effect'te koştuğu için bir sonraki karede.
    const frame = requestAnimationFrame(() => window.scrollTo(0, restoreTo));
    return () => cancelAnimationFrame(frame);
  }, [restoreTo]);

  // Ayrılırken (detay/sekme) kaydırma konumu bu listenin anahtarına yazılır.
  // Layout effect: cleanup'ı App'in scrollTo(0,0)'ından ÖNCE koşar, yani
  // window.scrollY hâlâ gerçek konumdur.
  useLayoutEffect(
    () => () => {
      if (useFeedStore.getState().entries[key]) save(key, { scrollY: window.scrollY });
    },
    [key, save],
  );

  // "Daha fazla" cevabı yazılırken önbellek TAZE okunur: bu sırada gelen beğeni
  // güncellemesi ezilmez, araya giren invalidate() sonrası bayat liste geri
  // yazılmaz; id ile tekrarsızlaştırılır. Hata listeyi silmez, yeniden denenir.
  const handleLoadMore = async () => {
    setMore({ key, status: 'loading' });
    try {
      const nextPage = page + 1;
      const res = await getFeedThreads({ surface, sort, page: nextPage, size, portal: portalSlug });
      const current = useFeedStore.getState().entries[key];
      if (current) {
        const known = new Set(current.threads.map((item) => item.id));
        save(key, {
          threads: [...current.threads, ...res.threads.filter((item) => !known.has(item.id))],
          hasMore: res.hasMore,
          page: nextPage,
        });
      }
      setMore({ key, status: 'idle' });
    } catch {
      setMore({ key, status: 'failed' });
    }
  };

  const handlePostCreated = () => {
    useFeedStore.getState().invalidate();
    setReloadKey((k) => k + 1);
  };

  return (
    <>
      {portal ? (
        portal.canPost && (
          <PostComposer defaultSurface={surface ?? null} lockedPortal={portal} onPostCreated={handlePostCreated} />
        )
      ) : (
        <PostComposer defaultSurface={surface ?? null} onPostCreated={handlePostCreated} />
      )}

      {/* Sekmeler + sıralama tek satırda; yapışkan, aşağı scroll'da kaybolur,
          yukarı scroll'da geri gelir (useControlsReveal). */}
      <div ref={controlsRef} className={styles.feed__controls}>
        <SurfaceFilter portalSlug={portalSlug} />
        <SortBar sort={sort} onChange={setSort} />
      </div>

      <div ref={bodyRef} className={styles.feed__body}>
      {error ? (
        <p className={styles.feed__empty}>{t('community.loadError')}</p>
      ) : loading ? (
        <FeedSkeleton label={t('community.feed.loading')} variant={view} />
      ) : threads.length === 0 ? (
        <p className={styles.feed__empty}>{t('community.emptyState')}</p>
      ) : view === 'card' ? (
        <div className={styles.feed__list}>
          {threads.map((thread, index) => (
            <FeedCard
              key={thread.id}
              thread={thread}
              featured={sort === 'hot' && index === 0 && thread.likeCount + thread.commentCount > 0}
              enterDelay={(index % size) * STAGGER_MS}
            />
          ))}
        </div>
      ) : view === 'list' ? (
        <div className={styles.feed__rows}>
          {threads.map((thread) => (
            <FeedRow key={thread.id} thread={thread} />
          ))}
        </div>
      ) : (
        <div className={styles.feed__grid}>
          {threads.map((thread) => (
            <FeedTile key={thread.id} thread={thread} />
          ))}
        </div>
      )}

      {moreFailed && <p className={styles.feed__moreError}>{t('community.loadError')}</p>}
      {hasMore && !error && (
        <button type="button" className={styles.feed__loadMore} onClick={handleLoadMore} disabled={moreLoading}>
          {t('community.feed.loadMore')}
        </button>
      )}
      </div>
    </>
  );
}
