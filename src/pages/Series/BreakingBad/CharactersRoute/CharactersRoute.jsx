import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchProductionDetail, fetchCharactersForSeries } from './CharactersRoute.data';
import styles from './CharactersRoute.module.css';

const pad2 = (n) => String(n).padStart(2, '0');

// Tam arka plan görseli — kullanıcının verdiği TMDB görseli (Severance
// SeasonRoute ile aynı harici-URL deseni).
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original/p7ZDvrblpGWScGZX4V0pCycWZN6.jpg';

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4.5" y1="12" x2="19" y2="12" />
      <polyline points="13.5 6.5 19.5 12 13.5 17.5" />
    </svg>
  );
}

// BreakingBad sayfasında SeasonRoute'un ALTINDA duran bölüm. Diğer yapımların
// SeasonRoute'uyla (From/Severance/HotD) AYNI iskelet ve hareket: kicker+başlık
// üstte, solda AKTİF karakterin adı + bio'su, sağda yatay kart şeridi + iki
// dairesel ok. Kart hover/focus/tık sol paneli günceller (önceki karakter
// sağa kayıp çıkar, yenisi soldan açılır). Karakter detayı SADECE Bio olduğu
// için (learned-rules) ayrı detay paneli/CTA yok — bio zaten odak panelinin
// kendisi. Glassmorfik yüzey yok (kullanıcı kararı); kicker düz metin.
// Tema BreakingBad.jsx'ten miras alınır.
export default function CharactersRoute() {
  const { t } = useTranslation();
  const [characters, setCharacters] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const pageRef = useRef(null);
  const trackRef = useRef(null);
  const focusRef = useRef(null);
  const isFirstActiveRender = useRef(true);

  useEffect(() => {
    let cancelled = false;
    fetchProductionDetail('series', 'breaking-bad')
      .then((series) => fetchCharactersForSeries(series.id))
      .then((data) => {
        if (!cancelled) setCharacters(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const list = characters ?? [];

  useLayoutEffect(() => {
    if (!list.length) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(`.${styles.kicker}`, {
          opacity: 0,
          y: 28,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: pageRef.current, start: 'top 55%', once: true },
        });

        gsap.from(`.${styles.focus}`, {
          opacity: 0,
          x: -64,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: pageRef.current, start: 'top 45%', once: true },
        });

        // İmza "dalga" (learned-rules #imza-dalga) — SeasonRoute ile birebir.
        gsap.from(trackRef.current.querySelectorAll(`.${styles.cardWrap}`), {
          opacity: 0,
          x: 140,
          y: 56,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: pageRef.current, start: 'top 45%', once: true },
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set([`.${styles.kicker}`, `.${styles.focus}`, `.${styles.cardWrap}`], {
          opacity: 1,
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
  }, [list.length]);

  // İlk mount'ta yukarıdaki scroll-trigger zaten aynı işi yapıyor — atla.
  useEffect(() => {
    if (isFirstActiveRender.current) {
      isFirstActiveRender.current = false;
      return;
    }
    if (!focusRef.current) return;
    gsap.fromTo(
      focusRef.current,
      { x: -64, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.45, ease: 'power3.out' }
    );
  }, [activeIndex]);

  const activateCharacter = (i) => {
    if (i === activeIndex) return;
    const focus = focusRef.current;
    if (!focus) {
      setActiveIndex(i);
      return;
    }
    gsap.to(focus, {
      x: 80,
      opacity: 0,
      duration: 0.28,
      ease: 'power2.in',
      onComplete: () => setActiveIndex(i),
    });
  };

  const scrollByCard = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector(`.${styles.cardWrap}`);
    const step = (card?.offsetWidth ?? 220) + 24;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  if (!characters || characters.length === 0) return null;

  return (
    <section className={styles.page} ref={pageRef}>
      <img className={styles.backdrop} src={BACKDROP_URL} alt="" aria-hidden="true" />
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.header}>
        <h2 className={styles.kicker}>{t('series.charactersHeading')}</h2>
      </div>

      <div className={styles.bottom}>
        <div className={styles.focus} ref={focusRef}>
          {characters.map((character, i) => (
            <div className={styles.focus__item} key={character.id} data-active={i === activeIndex || undefined}>
              <h3 className={styles.focus__title}>{character.name}</h3>
              {character.description && <p className={styles.focus__dek}>{character.description}</p>}
            </div>
          ))}
        </div>

        <div className={styles.carousel}>
          <div className={styles.track} ref={trackRef}>
            {characters.map((character, i) => (
              <div className={styles.cardWrap} key={character.id}>
                <button
                  type="button"
                  className={styles.card}
                  aria-label={character.name}
                  aria-current={i === activeIndex || undefined}
                  onMouseEnter={() => activateCharacter(i)}
                  onFocus={() => activateCharacter(i)}
                  onClick={() => activateCharacter(i)}
                >
                  {character.imageUrl && (
                    <img
                      className={styles.card__image}
                      src={character.imageUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      ref={(el) => {
                        if (el?.complete) el.dataset.loaded = '1';
                      }}
                      onLoad={(e) => {
                        e.currentTarget.dataset.loaded = '1';
                      }}
                    />
                  )}
                  <span className={styles.card__number}>{pad2(character.billingOrder ?? i + 1)}</span>

                  <span className={styles.card__caption}>
                    <span className={styles.card__title}>{character.name}</span>
                  </span>
                </button>
              </div>
            ))}
          </div>

          <div className={styles.navRow}>
            <button
              type="button"
              className={styles.navArrow}
              data-dir="left"
              onClick={() => scrollByCard(-1)}
              aria-label={t('common.previous')}
            >
              <ArrowIcon />
            </button>
            <button type="button" className={styles.navArrow} onClick={() => scrollByCard(1)} aria-label={t('common.next')}>
              <ArrowIcon />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
