import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, MotionConfig, motion, useMotionValue, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { getSeriesTrivia, getTriviaTagLabels } from './Trivia.data';
import styles from './Trivia.module.css';

// DOM'da yalnız ilk VISIBLE kart basılır (performans); alttakiler index'e göre
// küçülür (%5) ve sağa kayar (referans: kartlar üsttekinin sağ kenarından
// görünür). Kart |offset.x| > SWIPE_THRESHOLD ile "atılmış" sayılır, desteden
// çıkıp dizinin SONUNA gider (deste döner).
const VISIBLE = 3;
const SWIPE_THRESHOLD = 100;
const SCALE_STEP = 0.05;
const X_STEP = 32;
const EXIT_DISTANCE = 320;
const SPRING = { type: 'spring', stiffness: 320, damping: 30 };

const cardVariants = {
  // custom = atış yönü (-1 sol, 1 sağ); AnimatePresence custom'ı çıkan karta da iletir.
  // Çıkan kart yeni üst kartın ÜSTÜNDE kalır (zIndex) ve tıklanamaz.
  exit: (dir) => ({
    x: dir * EXIT_DISTANCE,
    opacity: 0,
    zIndex: VISIBLE + 1,
    pointerEvents: 'none',
    transition: { duration: 0.35, ease: 'easeIn' },
  }),
};

// Backend'in hazır etiketleri için çizgi ikonları; tanımadığı (serbest) etiket
// varsayılan ikona düşer (backend sözleşmesi).
const TAG_ICONS = {
  BEHIND_THE_SCENES: 'M4 9h16v10H4z M4 9l2.5-5h3L7 9 M10.5 9L13 4h3l-2.5 5 M17 9l2.5-5H21v5',
  EASTER_EGG: 'M12 3c3.6 0 6 5.2 6 9.2a6 6 0 0 1-12 0C6 8.2 8.4 3 12 3z',
  CASTING: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0',
  GOOF: 'M12 3l10 18H2z M12 10v5 M12 18h.01',
  LORE: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z M4 5v16',
};
const DEFAULT_TAG_ICON = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 11v5 M12 8h.01';

function TagIcon({ tag }) {
  return (
    <svg viewBox="0 0 24 24" className={styles['trivia__tagIcon']} aria-hidden="true">
      <path
        d={TAG_ICONS[tag] ?? DEFAULT_TAG_ICON}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// İki katman: dıştaki <li> deste konumunu (ölçek/sağa kayma/z-index/çıkış)
// yönetir, içteki <div> sürükleme + dönüşü. Tek katmanda x hem deste ofseti hem
// sürükleme olurdu ve alt kartlar ofsetle birlikte dönerdi.
function DeckCard({ item, index, total, onThrow, tagLabels }) {
  const { t } = useTranslation();
  const isTop = index === 0;
  const [imageLoaded, setImageLoaded] = useState(false);
  const dragX = useMotionValue(0);
  const rotate = useTransform(dragX, [-200, 200], [-10, 10]);
  const tag = item.tag ?? item.tags?.[0];

  const handleDragEnd = (_, info) => {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) onThrow(Math.sign(info.offset.x));
  };

  return (
    <motion.li
      className={`${styles['trivia__item']} ${isTop ? styles['trivia__item--top'] : ''}`}
      layout="position"
      variants={cardVariants}
      style={{ zIndex: VISIBLE - index }}
      initial={{ opacity: 0, scale: 1 - (index + 1) * SCALE_STEP, x: (index + 1) * X_STEP }}
      animate={{ opacity: 1, scale: 1 - index * SCALE_STEP, x: index * X_STEP }}
      exit="exit"
      transition={SPRING}
      inert={!isTop || undefined}
    >
      <motion.div
        className={styles['trivia__drag']}
        style={{ x: dragX, rotate }}
        drag={isTop && total > 1 ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
      >
        <article className={`${styles['trivia__card']} ${item.imageUrl ? styles['trivia__card--image'] : ''}`}>
          {item.imageUrl && (
            <>
              <img
                className={`${styles['trivia__image']} ${imageLoaded ? styles['trivia__image--loaded'] : ''}`}
                src={item.imageUrl}
                alt=""
                draggable={false}
                onLoad={() => setImageLoaded(true)}
              />
              <span className={styles['trivia__scrim']} aria-hidden="true" />
            </>
          )}

          <div className={styles['trivia__body']}>
            {tag && (
              <span className={styles['trivia__tag']}>
                <TagIcon tag={tag} />
                {tagLabels[tag] ?? t(`series.trivia.tags.${tag}`, { defaultValue: tag })}
              </span>
            )}
            {item.title && <h3 className={styles['trivia__cardTitle']}>{item.title}</h3>}
            <p className={styles['trivia__content']}>{item.content}</p>
          </div>
        </article>
      </motion.div>
    </motion.li>
  );
}

// Kayıtta hem tag hem tags[] gelir; filtre tags[]'e bakar.
const tagsOf = (item) => (item.tags?.length ? item.tags : item.tag ? [item.tag] : []);

// Breaking Bad sayfasında Karakterler ile Related Blogs arasında duran card
// deck: en üstteki kart sürüklenip atılır, altındakiler yay animasyonuyla öne
// gelir. Kayıt yoksa (ya da çekme başarısızsa) bölüm hiç basılmaz, sahte veri
// basılmaz.
export default function Trivia({ seriesId, title }) {
  const { t } = useTranslation();
  // Deste girdisi { uid, item }: atılan kart sona AYNI item'la ama YENİ uid'le
  // eklenir; key değiştiği için çıkış animasyonu oynar.
  const [items, setItems] = useState(null);
  const [deck, setDeck] = useState(null);
  const [activeTag, setActiveTag] = useState(null);
  // Etiket kodu → dile göre çözülmüş ad (GET /api/trivia/tags). Uç yoksa/hata verirse boş kalır,
  // etiket adları i18n yedeğine (ve o da yoksa koda) düşer.
  const [tagLabels, setTagLabels] = useState({});
  const [exitDir, setExitDir] = useState(1);
  const lap = useRef(0);
  // Her kart YENİ uid alır (key değişince çıkış/giriş animasyonu oynar).
  const buildDeck = (list) => list.map((item) => ({ uid: `${item.id}-${++lap.current}`, item }));
  const titleId = useId();
  const titleRef = useRef(null);
  const titleLeadRef = useRef(null);
  const titleActionRef = useRef(null);
  const deckRef = useRef(null);
  const panelRef = useRef(null);
  const layoutRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getTriviaTagLabels()
      .then((labels) => {
        if (!cancelled) setTagLabels(labels);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getSeriesTrivia(seriesId)
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setDeck(buildDeck(data));
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setDeck([]);
      });
    return () => {
      cancelled = true;
    };
  }, [seriesId]);

  const ready = Boolean(deck?.length);

  // Filtre chip'leri kayıtlardaki etiketlerden türer (en sık kullanılan önde);
  // sahte/sabit liste yok. Etiket fazlalığı backend verisinin işidir (kullanıcı
  // backend'den düzeltir), ön yüzde gizlenmez.
  const tagOptions = useMemo(() => {
    const counts = new Map();
    (items ?? []).forEach((item) => {
      tagsOf(item).forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
  }, [items]);

  const selectTag = (tag) => {
    if (tag === activeTag) return;
    setActiveTag(tag);
    setExitDir(1);
    setDeck(buildDeck(tag ? items.filter((item) => tagsOf(item).includes(tag)) : items));
  };

  // Giriş animasyonu bölüm ekrana girince TEK SEFER oynar: başlığın iki
  // satırı soldan kayarak (kademeli), ardından kontrol bloğu soldan, deste
  // aşağıdan yükselerek. Tetikleyici KULLANICI KAYDIRMASINDA ölçülen canlı
  // konumdur; ne ScrollTrigger'ın ne IntersectionObserver'ın yükleme anındaki
  // konumu kullanılır: Trivia, üstündeki bölümler (Related Blogs vb.) veriyi
  // çekip render edilene kadar geçici olarak sayfanın en üstünde durur, o anki
  // konum "ekranda" görünür ve animasyon kullanıcı henüz oraya gelmeden oynayıp
  // bitiyordu. useLayoutEffect: gizli başlangıç hâli ilk boyamadan önce
  // uygulanır. Kartların transform'unu framer-motion yönettiği için GSAP yalnız
  // sarmalayıcılara dokunur.
  useLayoutEffect(() => {
    if (!ready) return undefined;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
        tl.from(
          [titleLeadRef.current, titleActionRef.current],
          { opacity: 0, x: -120, duration: 0.9, stagger: 0.12, clearProps: 'opacity,transform' },
          0,
        )
          .from(deckRef.current, { opacity: 0, y: 40, duration: 0.9, clearProps: 'opacity,transform' }, 0.15)
          .from(panelRef.current, { opacity: 0, x: -64, duration: 0.8, clearProps: 'opacity,transform' }, 0.25);

        const stop = () => {
          window.removeEventListener('scroll', check);
          window.removeEventListener('resize', check);
        };
        function check() {
          if (layoutRef.current.getBoundingClientRect().top >= window.innerHeight * 0.85) return;
          tl.play();
          stop();
        }
        window.addEventListener('scroll', check, { passive: true });
        window.addEventListener('resize', check);
        // Yükleme anında kontrol YOK (geçici konum yanıltır); yalnız kullanıcı
        // zaten kaydırmışsa ya da sayfa kaydırılamayacak kadar kısaysa hemen bak.
        const scrollable = document.documentElement.scrollHeight > window.innerHeight + 50;
        if (window.scrollY > 0 || !scrollable) check();
        return stop;
      });
    });
    return () => ctx.revert();
  }, [ready]);

  const throwTop = (dir) => {
    if (deck.length < 2) return;
    const id = ++lap.current;
    setExitDir(dir);
    setDeck((prev) => [...prev.slice(1), { uid: `${prev[0].item.id}-${id}`, item: prev[0].item }]);
  };

  // Sürükleme klavyeyle yapılamadığı için oklar üst kartı atar.
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') throwTop(-1);
    if (e.key === 'ArrowRight') throwTop(1);
  };

  if (!ready) return null;

  const visible = deck.slice(0, VISIBLE);

  return (
    <section className={styles.trivia} aria-labelledby={titleId}>
      {/* Split: solda başlık + kontrol bloğu (alt başlık, etiket filtreleri),
          sağda deste; deste başlıkla aynı hizadan başlar. Dikey yapıda önce
          başlık ve kontroller, altında deste. */}
      <div className={styles['trivia__layout']} ref={layoutRef}>
        <div className={styles['trivia__panel']}>
          <h2 className={styles['trivia__title']} id={titleId} ref={titleRef}>
            <span ref={titleLeadRef} className={styles['trivia__titleLead']}>{t('series.trivia.titleLead')}</span>
            <span ref={titleActionRef} className={styles['trivia__titleAction']}>{t('series.trivia.titleAction')}</span>
          </h2>

          <div className={styles['trivia__controls']} ref={panelRef}>
            <p className={styles['trivia__subtitle']}>{t('series.trivia.subtitle', { title })}</p>
            <div className={styles['trivia__filters']} role="group" aria-labelledby={titleId}>
              {[null, ...tagOptions].map((tag) => (
                <button
                  type="button"
                  key={tag ?? 'all'}
                  className={styles['trivia__chip']}
                  aria-pressed={tag === activeTag}
                  onClick={() => selectTag(tag)}
                >
                  {tag
                    ? (tagLabels[tag] ?? t(`series.trivia.tags.${tag}`, { defaultValue: tag }))
                    : t('series.trivia.filterAll')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <MotionConfig reducedMotion="user">
          <div
            className={styles['trivia__deck']}
            ref={deckRef}
            role="group"
            aria-labelledby={titleId}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            // Alt kartların sağa taşma payı JS'teki kayma adımından türer.
            style={{ '--trivia-deck-depth': `${(VISIBLE - 1) * X_STEP}px` }}
          >
            <ul className={styles['trivia__stack']}>
              <AnimatePresence initial={false} custom={exitDir}>
                {visible.map((entry, index) => (
                  <DeckCard
                    key={entry.uid}
                    item={entry.item}
                    index={index}
                    total={deck.length}
                    onThrow={throwTop}
                    tagLabels={tagLabels}
                  />
                ))}
              </AnimatePresence>
            </ul>
          </div>
        </MotionConfig>
      </div>
    </section>
  );
}
