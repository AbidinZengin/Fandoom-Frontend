import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchStepperItems } from './ScrollStepper.data';
import styles from './ScrollStepper.module.css';

gsap.registerPlugin(ScrollTrigger);

// Sinematik süzülme reveal (kullanıcı kararı: 3D helix dönüşü reddedildi —
// referansların dili düz, yumuşak kayma). Pin YOK: uzun stage boyunca sticky
// merkez eksen (rail + beyaz dot, tüm bölüme scrub'lı); kartlar eksenin
// sağ/solunda alternating, her biri alttan yumuşak süzülerek (fade + uzun
// dikey glide + blur focus-pull) viewport merkezine oturur; scroll durunca
// yönlü snap aktif kartı dikey merkeze kilitler (GoT sayfası snap deseni).
export function ScrollStepper({ entityId }) {
  const sectionRef = useRef(null);
  const axisRef = useRef(null);
  const [stepperItems, setStepperItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchStepperItems(entityId).then((items) => {
      if (!cancelled) setStepperItems(items);
    });
    return () => {
      cancelled = true;
    };
  }, [entityId]);

  useLayoutEffect(() => {
    if (stepperItems.length === 0) return undefined;
    const section = sectionRef.current;
    const axis = axisRef.current;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // Tek kurulum, iki koşul: reduced-motion açıksa hiç kurulmaz (kartlar
      // statik akışta görünür); mobilde (≤900px) kartlar CSS ile merkez
      // kolondadır — yatay alternating yerleşimi yalnız masaüstünde set
      // edilir, süzülme/blur/snap her iki kırılımda aynıdır. 900px eşiği
      // geçilince matchMedia context'i revert edip yeniden kurar.
      // (Eşik ScrollStepper.module.css'teki max-width:900px ile ÇİFTTİR.)
      mm.add(
        {
          motionOk: '(prefers-reduced-motion: no-preference)',
          desktop: '(min-width: 901px)',
        },
        (mmCtx) => {
          const { motionOk, desktop } = mmCtx.conditions;
          if (!motionOk) return;

          const cards = gsap.utils.toArray(section.querySelectorAll('[data-card]'));
          const rail = axis.querySelector('[data-rail]');
          const dot = axis.querySelector('[data-dot]');

          gsap.set(rail, { scaleY: 0, transformOrigin: 'top center' });
          gsap.set(
            cards.map((card) => card.querySelector('[data-copy]')),
            { y: 26, autoAlpha: 0 }
          );
          gsap.set(
            cards.map((card) => card.querySelector('[data-media]')),
            { filter: 'blur(9px) saturate(.65)', scale: 1.08 }
          );

          cards.forEach((card) => {
            const opensLeft = card.dataset.side === 'left';
            const copy = card.querySelector('[data-copy]');
            const media = card.querySelector('[data-media]');

            // Yatay yerleşim kartta; dikey süzülme İÇ elemanlarda (frame +
            // numara) — kartın kendisi transform'suz kalır ki ScrollTrigger
            // start/end ve snap ölçümleri kaymasın.
            if (desktop) {
              gsap.set(card, {
                xPercent: opensLeft ? -100 : 0,
                x: opensLeft ? -38 : 38,
              });
            }
            const glide = [card.querySelector('[data-number]'), card.querySelector('[data-frame]')];
            gsap.set(glide, { y: '18vh', autoAlpha: 0 });

            // Süzülme, kartın merkezi viewport merkezine oturduğunda tamamlanır —
            // "durduğunda dikeyde tam ortada" (snap de aynı noktaya kilitler).
            // Zamanlama (toplam 1.0): glide 0→0.85, blur 0.4→1.0, copy 0.55→1.0 —
            // blur ve yazı TAM merkez anında biter (kullanıcı düzeltmesi: erken
            // oturma); inOut ease'ler değişimi sona kadar algılanır tutar.
            const reveal = gsap.timeline({
              scrollTrigger: {
                trigger: card,
                start: 'top 87%',
                end: 'center center',
                scrub: 1.2,
              },
            });

            reveal
              .to(glide, { y: 0, autoAlpha: 1, duration: 0.85, ease: 'power2.out' }, 0)
              .to(
                media,
                { filter: 'blur(0px) saturate(1)', scale: 1, duration: 0.6, ease: 'power1.inOut' },
                0.4
              )
              .to(copy, { y: 0, autoAlpha: 1, duration: 0.45, ease: 'power1.inOut' }, 0.55);
          });

          // Scroll durunca yönlü snap: aktif kartın merkezi viewport merkezine
          // akar (learned-rules snap deseni — kartlar arasında durulmaz).
          let toSnap = (value) => value;
          ScrollTrigger.create({
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            onRefresh: (self) => {
              const range = self.end - self.start;
              const points = cards.map((card) => {
                const rect = card.getBoundingClientRect();
                const centerScroll =
                  rect.top + window.scrollY + rect.height / 2 - window.innerHeight / 2;
                return gsap.utils.clamp(0, 1, (centerScroll - self.start) / range);
              });
              // Yarıçap ~46vh: kartın etki alanında merkeze kilitler, bölüm
              // kenarlarında (hero/exhibit sınırı) scroll'u çekiştirmez.
              toSnap = gsap.utils.snap({
                values: points,
                radius: (window.innerHeight * 0.46) / range,
              });
            },
            snap: {
              snapTo: (value) => toSnap(value),
              duration: { min: 0.35, max: 0.9 },
              ease: 'power2.inOut',
              delay: 0.1,
            },
          });

          // Eksen ilerlemesi: dot aşağı iner, rail dolar — bölümün tamamına scrub.
          gsap.to(dot, {
            y: () => axis.clientHeight - 11,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
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
              trigger: section,
              start: 'top top',
              end: 'bottom bottom',
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [stepperItems]);

  return (
    <section className={styles.stepper} aria-label="Story sections" ref={sectionRef}>
      <div className={styles.stepper__stage}>
        {/* Track: sticky eksenin kayabileceği alanı sınırlar — alt sınırı
            bölüm sonundaki boşluğun içinde biter, parlak dot Highlights'a
            taşamaz (negatif margin hilesi sticky sınırını aşağı genişletiyordu). */}
        <div className={styles['stepper__axis-track']} aria-hidden="true">
          <div className={styles.stepper__axis} ref={axisRef}>
            <i className={styles['stepper__axis-rail']} data-rail />
            <span className={styles['stepper__axis-dot']} data-dot />
          </div>
        </div>

        {stepperItems.map((item, i) => (
          <article
            key={i}
            className={`${styles.stepper__card} ${
              i % 2 === 0 ? styles['stepper__card--left'] : styles['stepper__card--right']
            }`}
            data-card
            data-side={i % 2 === 0 ? 'left' : 'right'}
            aria-label={`${String(i + 1).padStart(2, '0')}: ${item.title}`}
          >
            <div className={styles.stepper__number} data-number>
              {String(i + 1).padStart(2, '0')}
            </div>
            {/* item.titleLinkUrl CMS'ten geliyor (groupBySection, section
                kaydının linkUrl'ü boşsa alan hiç eklenmez) — rotası olan
                kartlar Link, olmayanlar (ör. henüz sayfası olmayan
                Characters) düz div olarak kalır. */}
            {(() => {
              const FrameTag = item.titleLinkUrl ? Link : 'div';
              const frameProps = item.titleLinkUrl ? { to: item.titleLinkUrl } : {};
              return (
                <FrameTag className={styles.stepper__frame} data-frame {...frameProps}>
                  {item.image ? (
                    <img
                      className={styles.stepper__media}
                      src={item.image}
                      alt={item.title}
                      data-media
                    />
                  ) : (
                    <div
                      className={`${styles.stepper__media} ${styles['stepper__media--empty']}`}
                      data-media
                    >
                      <span>IMAGE</span>
                    </div>
                  )}
                  <div className={styles.stepper__shade} />
                  <div className={styles.stepper__copy} data-copy>
                    <h3 className={styles.stepper__cardTitle}>{item.title}</h3>
                    <p className={styles.stepper__desc}>{item.description}</p>
                  </div>
                </FrameTag>
              );
            })()}
          </article>
        ))}
      </div>
    </section>
  );
}
