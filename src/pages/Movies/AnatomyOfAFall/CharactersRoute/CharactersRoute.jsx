import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchProductionDetail, fetchCharactersForMovie } from './CharactersRoute.data';
import styles from './CharactersRoute.module.css';

// Tam arka plan görseli: TMDb backdrop'u (mahkeme salonu),
// hero kapağından farklı.
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original/xyR7MdyqWZRYkiraHPFHHi5KDmu.jpg';

const EASE_OUT = [0.22, 1, 0.36, 1];
const ACCORDION_TRANSITION = { duration: 0.5, ease: EASE_OUT };
const ACCORDION_MS = ACCORDION_TRANSITION.duration * 1000;
const PHOTO_TRANSITION = { duration: 0.45, ease: 'easeOut' };
const PHOTO_BLUR = 'blur(12px)';

// Dikey yapıya geçilen aralık (CSS'teki @media (max-width: 1023px) ile AYNI):
// bu aralıkta akordeon yerine yatay seçici + sabit bio kutusu basılır.
const COMPACT_QUERY = '(max-width: 1023px)';

function subscribeCompact(callback) {
  const mq = window.matchMedia(COMPACT_QUERY);
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

const getCompact = () => window.matchMedia(COMPACT_QUERY).matches;

function useIsCompact() {
  return useSyncExternalStore(subscribeCompact, getCompact, () => false);
}

// Seçilen chip şeritte ortaya kayar; yalnız yatay (block: 'nearest' sayfayı
// dikeyde oynatmaz).
function centerChip(el) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
}

// Sahne fotoğrafı: yüklenene kadar koyu zemin kalır, yüklenince bulanıklıktan
// netleşerek gelir (skeleton/blur-up yok, görsel fade-in kuralı). Eski ve yeni
// görsel ÜST ÜSTE (mode="wait" değil) çapraz-erir: aradaki boşlukta zemin rengi
// (gri) görünmesin diye.
function ScenePhoto({ src }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  // Önbellekten gelen görselde onLoad tetiklenmeyebilir.
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <motion.img
      ref={imgRef}
      className={styles.scene__photo}
      src={src}
      alt=""
      draggable={false}
      onLoad={() => setLoaded(true)}
      initial={{ opacity: 0, filter: PHOTO_BLUR }}
      animate={loaded ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: PHOTO_BLUR }}
      exit={{ opacity: 0 }}
      transition={PHOTO_TRANSITION}
    />
  );
}

// Görseli olmayan karakterde boş daire yerine baş harf.
function Avatar({ character }) {
  if (!character.imageUrl) {
    return (
      <span className={`${styles.avatar} ${styles['avatar--empty']}`} aria-hidden="true">
        {character.name?.[0]}
      </span>
    );
  }
  return (
    <img
      className={styles.avatar}
      src={character.imageUrl}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}

// AnatomyOfAFall sayfasında Atmosphere'in ALTINDA duran bölüm (Master-Detail):
// solda karakter listesi + tıklanan satırın altında akordeon gibi açılan bio,
// sağda seçime göre fotoğrafı eriyerek değişen "karakter sahnesi". BreakingBad
// CharactersRoute'un BİREBİR aynısı (kullanıcı isteği) — kicker + "The Faces
// of the Story." başlığı ve arka plan çerçevesi AYNEN korunur. Karakter
// verisinde ayrı avatar/portre alanı ve oyuncu adı yok: avatar ve sahne
// fotoğrafı imageUrl'i kullanır, oyuncu adı basılmaz (sahte veri basılmaz).
// Tema AnatomyOfAFall.jsx'ten miras alınır.
export default function CharactersRoute() {
  const { t } = useTranslation();
  const [characters, setCharacters] = useState(null);
  const [activeId, setActiveId] = useState(null);
  // Masaüstü akordeonunda bio varsayılan KAPALI gelir; sadece satıra
  // tıklanınca açılır (activeId'den ayrı — o sahne fotoğrafını sürer).
  const [expandedId, setExpandedId] = useState(null);
  const baseId = useId();
  const isCompact = useIsCompact();

  const pageRef = useRef(null);
  const listRef = useRef(null);
  const itemRefs = useRef(new Map());

  useEffect(() => {
    let cancelled = false;
    fetchProductionDetail('movie', 'anatomy-of-a-fall')
      .then((movie) => fetchCharactersForMovie(movie.id))
      .then((data) => {
        if (!cancelled) {
          setCharacters(data);
          setActiveId(data[0]?.id ?? null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const count = characters?.length ?? 0;
  // Masaüstünde seçilen satır, akordeon (önceki bio'nun kapanması + yenisinin
  // açılması) oturduktan sonra listenin en üstüne kayar; yoksa alttaki bir
  // satırın bio'su pencerenin dışında kalırdı.
  useEffect(() => {
    if (isCompact || expandedId == null) return undefined;
    const timer = setTimeout(() => {
      const li = itemRefs.current.get(expandedId);
      if (!listRef.current || !li) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      listRef.current.scrollTo({ top: li.offsetTop, behavior: reduce ? 'auto' : 'smooth' });
    }, ACCORDION_MS);
    return () => clearTimeout(timer);
  }, [expandedId, isCompact]);

  // Reveal hedefi kipe göre değişir: masaüstünde liste, dikey yapıda seçici şerit.
  const pickerClass = isCompact ? styles.selector : styles.list;

  useLayoutEffect(() => {
    if (!count) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(`.${styles.kicker}`, {
          opacity: 0,
          y: 28,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: pageRef.current, start: 'top 55%', once: true },
        });

        // Başlığın iki satırı SOLDAN kayarak girer, kademeli — SeasonRoute ile
        // birebir. Header yatayda kırpar, yazı kartın dışına taşmaz.
        gsap.from([`.${styles.titleLead}`, `.${styles.titleAction}`], {
          opacity: 0,
          x: -120,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          delay: 0.12,
          scrollTrigger: { trigger: pageRef.current, start: 'top 55%', once: true },
        });

        gsap.from(`.${pickerClass}`, {
          opacity: 0,
          x: -64,
          duration: 0.8,
          ease: 'power3.out',
          clearProps: 'opacity,transform',
          scrollTrigger: { trigger: pageRef.current, start: 'top 45%', once: true },
        });

        gsap.from(`.${styles.scene}`, {
          opacity: 0,
          y: 56,
          duration: 0.9,
          ease: 'power3.out',
          clearProps: 'opacity,transform',
          scrollTrigger: { trigger: pageRef.current, start: 'top 45%', once: true },
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set([`.${styles.kicker}`, `.${styles.titleLead}`, `.${styles.titleAction}`, `.${pickerClass}`, `.${styles.scene}`], {
          opacity: 1,
          x: 0,
          y: 0,
          clearProps: 'transform',
        });
      });
    }, pageRef);

    const timerId = setTimeout(() => ScrollTrigger.refresh(), 250);

    return () => {
      clearTimeout(timerId);
      ctx.revert();
    };
  }, [count, pickerClass]);

  if (!count) return null;

  const active = characters.find((c) => c.id === activeId) ?? characters[0];
  const bioBoxId = `${baseId}-bio`;

  const scene = (
    <div className={styles.scene}>
      <div className={styles.scene__frame}>
        <AnimatePresence initial={false}>
          {active.imageUrl && <ScenePhoto key={active.id} src={active.imageUrl} />}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <section className={styles.page} ref={pageRef}>
      <img className={styles.backdrop} src={BACKDROP_URL} alt="" aria-hidden="true" />
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.header}>
        <p className={styles.kicker}>{t('series.charactersHeading')}</p>
        <h2 className={styles.title}>
          <span className={styles.titleLead}>{t('series.charactersTitleLead')}</span>
          <span className={styles.titleAction}>{t('series.charactersTitleAction')}</span>
        </h2>
      </div>

      <MotionConfig reducedMotion="user">
        <div className={styles.bottom}>
          {isCompact ? (
            <>
              {scene}

              {/* Dikey yapı: akordeon YOK. Yatay kayan isim/avatar şeridi
                  seçer, seçili karakterin bio'su altta sabit kutuda değişir. */}
              <div className={styles.selector} role="group" aria-label={t('series.charactersHeading')}>
                {characters.map((character) => (
                  <button
                    type="button"
                    key={character.id}
                    className={styles.chip}
                    data-active={character.id === active.id || undefined}
                    aria-pressed={character.id === active.id}
                    aria-controls={bioBoxId}
                    onClick={(e) => {
                      setActiveId(character.id);
                      centerChip(e.currentTarget);
                    }}
                  >
                    <Avatar character={character} />
                    <span className={styles.chip__name}>{character.name}</span>
                  </button>
                ))}
              </div>

              {/* Tüm bio'lar AYNI grid hücresinde üst üste durur, kutu en uzun
                  metne göre ölçülür: karakter değişince kutu boyu zıplamaz. */}
              <div className={styles.bioBox} id={bioBoxId} aria-live="polite">
                {characters.map((character) => (
                  <div
                    className={styles.bioBox__item}
                    key={character.id}
                    data-active={character.id === active.id || undefined}
                  >
                    {character.description && <p className={styles.bioBox__text}>{character.description}</p>}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className={styles.listWrap}>
              <ul className={styles.list} ref={listRef}>
                {characters.map((character) => {
                  const isActive = character.id === expandedId;
                  const panelId = `${baseId}-bio-${character.id}`;
                  return (
                    <li
                      className={styles.item}
                      key={character.id}
                      ref={(el) => {
                        if (el) itemRefs.current.set(character.id, el);
                        else itemRefs.current.delete(character.id);
                      }}
                    >
                      <button
                        type="button"
                        className={styles.row}
                        data-active={isActive || undefined}
                        aria-expanded={isActive}
                        aria-controls={panelId}
                        onClick={() => {
                          setActiveId(character.id);
                          setExpandedId((prev) => (prev === character.id ? null : character.id));
                        }}
                      >
                        <Avatar character={character} />
                        <span className={styles.row__name}>{character.name}</span>
                      </button>

                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.div
                            key="bio"
                            id={panelId}
                            role="region"
                            aria-label={character.name}
                            className={styles.bio}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={ACCORDION_TRANSITION}
                          >
                            {character.description && <p className={styles.bio__text}>{character.description}</p>}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </li>
                  );
                })}
              </ul>
              </div>

              {scene}
            </>
          )}
        </div>
      </MotionConfig>
    </section>
  );
}
