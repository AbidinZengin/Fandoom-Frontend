import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchHistoryScenes } from '../History.data';
import styles from './HistoryBlocks.module.css';

gsap.registerPlugin(ScrollTrigger);

/**
 * History sayfasının dönem-dönem anlatısı — sol tarafta ScrollStepper'ın
 * dolan-rail+dot mekaniğinin (bkz. ScrollStepper.jsx) sol kenara taşınmış
 * hâli (kullanıcı kararı: "solda bir line olsun ilerledikçe dolan"), sağda/
 * ortada tek kolon glassmorphism kartlar (WorldMap'in `.worldmap__card`
 * blur-arka-plan dili — kullanıcı kararı: "cardlar location cardları gibi
 * arkası blurlu"). Rail'deki 9 madde tıklanınca ilgili karta scroll eder,
 * o an görünen kart rail'de aktif/vurgulu işaretlenir.
 *
 * Motion: kicker/title/thesis + final sahne tek seferlik fade+rise; sahne
 * başlığı scroll-scrub yükseliş; alıntı soldan süpürme+kayma; görsel hafif
 * parallax — EpisodeBlocks'un hareket diliyle aynı (learned-rules). Final
 * sahne bu turda sticky/pin ALMIYOR (kapsam kasıtlı küçük tutuldu).
 */
export function HistoryBlocks({ seriesId }) {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  const introRef = useRef(null);
  const finaleContentRef = useRef(null);
  const bodyRef = useRef(null);
  const navAxisRef = useRef(null);
  const sceneRefs = useRef([]);
  const navItemRefs = useRef([]);
  const [scenes, setScenes] = useState(null);

  useEffect(() => {
    if (!seriesId) return undefined;
    let cancelled = false;
    fetchHistoryScenes(seriesId).then((data) => {
      if (!cancelled) setScenes(data);
    });
    return () => {
      cancelled = true;
    };
  }, [seriesId]);

  const hasScenes = Boolean(scenes);

  useLayoutEffect(() => {
    if (!hasScenes || !rootRef.current) return undefined;

    const ctx = gsap.context((self) => {
      const mm = gsap.matchMedia();
      const headers = self.selector('[data-scene-header]');
      const quoteBlocks = self.selector('[data-quote]');
      const images = self.selector('[data-image]');

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(introRef.current.children, {
          opacity: 0,
          y: 28,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          clearProps: 'opacity,transform',
          scrollTrigger: { trigger: introRef.current, start: 'top 80%', once: true },
        });

        if (finaleContentRef.current) {
          gsap.from(finaleContentRef.current.children, {
            opacity: 0,
            y: 28,
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.12,
            clearProps: 'opacity,transform',
            scrollTrigger: { trigger: finaleContentRef.current, start: 'top 80%', once: true },
          });
        }

        headers.forEach((header) => {
          gsap.fromTo(
            header,
            { opacity: 0, y: 64 },
            {
              opacity: 1,
              y: 0,
              ease: 'none',
              scrollTrigger: {
                trigger: header,
                start: 'top bottom',
                end: 'top 62%',
                scrub: 1.2,
              },
            },
          );
        });

        quoteBlocks.forEach((block) => {
          const rule = block.querySelector('[data-quote-rule]');
          const text = block.querySelector('[data-quote-text]');

          gsap
            .timeline({
              scrollTrigger: {
                trigger: block,
                start: 'top bottom',
                end: 'top 55%',
                scrub: 1.2,
              },
            })
            .fromTo(rule, { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 0.45 }, 0)
            .fromTo(
              text,
              { opacity: 0, x: -48 },
              { opacity: 1, x: 0, ease: 'none', duration: 0.55 },
              0.3,
            );
        });

        // Sol rail: ScrollStepper'ın dot+rail scrub'ının aynısı — dot,
        // blocks__body'nin tüm scroll mesafesine (top top → bottom bottom)
        // bağlı olarak nav ekseninin boyunca iner.
        const axis = navAxisRef.current;
        if (axis && bodyRef.current) {
          const rail = axis.querySelector('[data-rail]');
          const dot = axis.querySelector('[data-dot]');
          gsap.set(rail, { scaleY: 0, transformOrigin: 'top center' });

          gsap.to(dot, {
            y: () => axis.clientHeight - 9,
            ease: 'none',
            scrollTrigger: {
              trigger: bodyRef.current,
              start: 'top top',
              end: 'bottom bottom',
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
          gsap.to(rail, {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: bodyRef.current,
              start: 'top top',
              end: 'bottom bottom',
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
        }

        // Aktif dönem: görüntülenen kart rail listesinde vurgulanır.
        sceneRefs.current.forEach((sceneEl, i) => {
          const navItem = navItemRefs.current[i];
          if (!sceneEl || !navItem) return;
          ScrollTrigger.create({
            trigger: sceneEl,
            start: 'top center',
            end: 'bottom center',
            toggleClass: { targets: navItem, className: styles['nav__item--active'] },
          });
        });
      });

      mm.add(
        {
          motionOk: '(prefers-reduced-motion: no-preference)',
          desktop: '(min-width: 901px)',
        },
        (mmCtx) => {
          const { motionOk, desktop } = mmCtx.conditions;
          if (!motionOk || !desktop) return;

          images.forEach((image) => {
            gsap.fromTo(
              image,
              { yPercent: -3.5 },
              {
                yPercent: 3.5,
                ease: 'none',
                scrollTrigger: {
                  trigger: image.closest('figure') ?? image,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              },
            );
          });
        },
      );

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(headers, { opacity: 1, y: 0 });
        quoteBlocks.forEach((block) => {
          gsap.set(block.querySelector('[data-quote-rule]'), { scaleX: 1 });
          gsap.set(block.querySelector('[data-quote-text]'), { opacity: 1, x: 0 });
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, [hasScenes]);

  if (!scenes) return null;

  const scrollToScene = (index) => {
    sceneRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <section className={styles.blocks} id="history-blocks" ref={rootRef}>
      <div className={styles.blocks__intro} ref={introRef}>
        <p className={styles.blocks__kicker}>{t('series.historyKicker')}</p>
        <h1 className={styles.blocks__title}>{t('series.historyTitle')}</h1>
        <p className={styles.blocks__thesis}>
          Nine ages carried Westeros from the first landing of bronze-armed men to
          the throne that finally broke beneath a Mad King&rsquo;s fire — a chronicle
          of pacts, invasions, and the slow ruin of dragons, set down here in the
          maesters&rsquo; own patient, unadorned hand.
        </p>
      </div>

      <div className={styles.blocks__body} ref={bodyRef}>
        <nav className={styles.nav} aria-label={t('series.agesOfWesterosAriaLabel')}>
          <p className={styles.nav__heading}>{t('series.timeline')}</p>

          <div className={styles.nav__body}>
            <div className={styles.nav__track}>
              <div className={styles.nav__axis} ref={navAxisRef}>
                <i className={styles.nav__rail} data-rail />
                <span className={styles.nav__dot} data-dot />
              </div>
            </div>

            <ol className={styles.nav__list}>
              {scenes.map((scene, index) => (
                <li
                  key={scene.id}
                  className={styles.nav__item}
                  ref={(el) => {
                    navItemRefs.current[index] = el;
                  }}
                >
                  <button type="button" className={styles.nav__button} onClick={() => scrollToScene(index)}>
                    <span className={styles.nav__number}>{String(index + 1).padStart(2, '0')}</span>
                    <span className={styles.nav__label}>{scene.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <ol className={styles.blocks__scenes}>
          {scenes.map((scene, index) => {
            if (scene.pinned) {
              return (
                <li
                  key={scene.id}
                  className={styles.finale}
                  id="history-finale"
                  data-pinned="true"
                  ref={(el) => {
                    sceneRefs.current[index] = el;
                  }}
                >
                  <figure className={styles.finale__figure}>
                    <img
                      className={styles.finale__image}
                      data-image=""
                      src={scene.image}
                      alt=""
                      loading="lazy"
                    />
                    <div className={styles.finale__scrim} />
                  </figure>
                  <div className={styles.finale__content} ref={finaleContentRef}>
                    <p className={styles.finale__kicker}>{scene.date}</p>
                    <h2 className={styles.finale__title}>{scene.title}</h2>
                    {scene.quote && <p className={styles.finale__quote}>&ldquo;{scene.quote}&rdquo;</p>}
                    <div className={styles.finale__body}>
                      {scene.body.map((paragraph) => (
                        <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                      ))}
                    </div>

                    <div className={styles.card__ctaRow}>
                      <span className={styles.card__cta} aria-hidden="true">
                        {t('series.exploreMore')} <span>›</span>
                      </span>
                    </div>
                  </div>
                </li>
              );
            }

            return (
              <li
                key={scene.id}
                className={styles.scene}
                ref={(el) => {
                  sceneRefs.current[index] = el;
                }}
              >
                <div className={styles.card}>
                  <figure className={styles.card__figure}>
                    <img
                      className={styles.card__image}
                      data-image=""
                      src={scene.image}
                      alt=""
                      loading="lazy"
                    />
                  </figure>

                  <header className={styles.card__header} data-scene-header="">
                    <p className={styles.card__kicker}>{scene.date}</p>
                    <h2 className={styles.card__title}>{scene.title}</h2>
                  </header>

                  <div className={styles.card__body}>
                    {scene.body.map((paragraph) => (
                      <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                    ))}
                  </div>

                  {scene.quote && (
                    <p className={styles.card__quote} data-quote="">
                      <span className={styles.card__quoteRule} data-quote-rule="" aria-hidden="true" />
                      <span data-quote-text="">{scene.quote}</span>
                    </p>
                  )}

                  {/* Dekoratif — hedef backend'de/ site mimarisinde henüz
                      kararlaştırılmadı (kullanıcı kararı, bkz. görev notu). */}
                  <div className={styles.card__ctaRow}>
                    <span className={styles.card__cta} aria-hidden="true">
                      {t('series.exploreMore')} <span>›</span>
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
