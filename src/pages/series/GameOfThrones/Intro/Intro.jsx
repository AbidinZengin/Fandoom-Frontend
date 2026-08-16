import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchIntroContent } from './Intro.data';
import styles from './Intro.module.css';

gsap.registerPlugin(ScrollTrigger);

// Waypoint ambient renkleri — sahnenin görselinden seçilmiş baskın ton.
// Yalnız HAFİF tint (görsel tarafı radial + metin başlığı glow) olarak
// kullanılır. CMS'ten gelen waypoint'ler stabil bir id taşımadığı için
// sırayla (migrasyon sırasıyla: world/throne/longnight/godswood/fivekings/
// fireblood) indekslenir.
const AMBIENTS = [
  '#7d8f86', // sisli bozkır grisi-yeşili (world)
  '#c98b3f', // mum ışığı amberi (throne)
  '#5a7d9e', // buz mavisi (longnight)
  '#a4373f', // weirwood'un koyu kızıl yaprakları (godswood)
  '#5c4033', // kül ve kurumuş kan (fivekings)
  '#cf5a24', // ejderha alevi (fireblood)
];

// Diziyi tanıtan "Dragon Journey" bölümü. AKAN SAHNELER mimarisi
// (kullanıcı kararı v3 — "sayfa gerçekten kaysın"): pin YOK, sahneler
// doğal akışta ~100svh bantlar; bantlar ARASINDA ~100svh salt siyah
// boşluk (siyah nefes ekranı). Sahne elemanları girerken imza-süzülmeyle
// açığa çıkar (merkez oturuşunda tamamlanır, ScrollStepper ile aynı
// değerler), çıkarken yukarı kayarak yok olur — üstteki kaybolurken
// alttaki belirir. Scroll TAMAMEN MANUEL (kullanıcı kararı 2026-08:
// önceki yöne-duyarlı auto-snap kaldırıldı, kontrol tamamen kullanıcıda).
// Görsel, sahnenin görünür ömrü boyunca 1.0→1.5 zoom yapar (video-sadık);
// sis maskesi ve metin kompozisyonu aynen korundu. Yalnız
// transform/opacity/filter.
export function Intro({ entityId }) {
  const sectionRef = useRef(null);
  const [eyebrow, setEyebrow] = useState('');
  const [headline, setHeadline] = useState('');
  const [stats, setStats] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const [closing, setClosing] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchIntroContent(entityId).then((intro) => {
      if (cancelled) return;
      setEyebrow(intro.eyebrow ?? '');
      setHeadline(intro.headline ?? '');
      setStats(intro.stats);
      setWaypoints(intro.waypoints);
      setClosing(intro.closing ?? '');
    });
    return () => {
      cancelled = true;
    };
  }, [entityId]);

  useLayoutEffect(() => {
    if (waypoints.length === 0) return undefined;
    const section = sectionRef.current;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const scenes = gsap.utils.toArray(section.querySelectorAll('[data-scene]'));

        // Açılış metni bölüm görünüme girerken imza-dalga ile gelir
        // (learned-rules) — açılış sahnesi süzülme almaz.
        gsap.from(scenes[0].querySelectorAll('[data-wave-item]'), {
          opacity: 0,
          x: 140,
          y: 56,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          clearProps: 'opacity,transform',
          scrollTrigger: { trigger: section, start: 'top 78%', once: true },
        });

        scenes.forEach((scene, i) => {
          const img = scene.querySelector('[data-zoom]');
          const media = scene.querySelector('[data-media]');
          const copy = scene.querySelector('[data-copy]');
          const parts = [media, copy].filter(Boolean);
          const isFirst = i === 0;

          // GİRİŞ (imza-süzülme, ScrollStepper ile aynı dil): siyah
          // boşluktan gelen sahnenin elemanları alttan süzülerek açığa
          // çıkar, sahne merkezi viewport merkezine oturduğunda tamamlanır;
          // görselde blur→net focus-pull eşlik eder (grade değerleri
          // CSS'teki saturate/brightness taban filtresiyle uyumlu).
          if (!isFirst) {
            gsap.set(parts, { y: '14vh', autoAlpha: 0 });
            const reveal = gsap.timeline({
              scrollTrigger: {
                trigger: scene,
                start: 'top 80%',
                end: 'center center',
                scrub: 1.2,
              },
            });
            reveal.to(
              parts,
              { y: 0, autoAlpha: 1, duration: 0.85, ease: 'power2.out', stagger: 0.12 },
              0
            );
            if (img) {
              reveal.fromTo(
                img,
                { filter: 'blur(10px) saturate(0.6) brightness(0.82)' },
                {
                  filter: 'blur(0px) saturate(0.9) brightness(0.82)',
                  duration: 0.6,
                  ease: 'power1.inOut',
                },
                0.35
              );
            }
          }

          // ÇIKIŞ: sahne merkezden yukarı ayrılırken elemanları yukarı
          // kayıp yok olur — üstteki kaybolurken alttaki sahnenin
          // süzülmesi ortaya çıkar (kullanıcı tarifi). Giriş/çıkış scroll
          // aralıkları çakışmaz.
          gsap
            .timeline({
              scrollTrigger: {
                trigger: scene,
                start: 'center 42%',
                end: 'bottom 12%',
                scrub: 1.2,
              },
            })
            .to(parts, { y: '-8vh', autoAlpha: 0, duration: 1, ease: 'power1.in', stagger: 0.08 });

          // Kamera hareketi (video-sadık): görsel sahnenin görünür ömrü
          // boyunca 1.0 → 1.5 büyür — maske sarmalayıcıda sabit kalır,
          // zoom sis penceresinin altında olur.
          if (img) {
            gsap.fromTo(
              img,
              { scale: 1 },
              {
                scale: 1.5,
                ease: 'none',
                scrollTrigger: {
                  trigger: scene,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              }
            );
          }
        });
      });
      // Scroll TAMAMEN MANUEL (kullanıcı kararı 2026-08) — auto-snap
      // kaldırıldı, kontrol kullanıcıda kalır.
      // Reduced-motion: JS hiç kurulmaz — sahneler doğal akışta, tüm
      // içerik görünür (siyah aralıklar statik boşluk olarak kalır).
    }, sectionRef);

    return () => ctx.revert();
  }, [waypoints]);

  return (
    <section className={styles.intro} aria-label="Introduction" ref={sectionRef}>
      {/* Sahne 0 — açılış: premise + künye (Hero logosu TEKRARLANMAZ) */}
      <header className={`${styles.intro__scene} ${styles.intro__opening}`} data-scene>
        <div className={styles.intro__openingInner} data-copy>
          <p className={styles.intro__eyebrow} data-wave-item>
            {eyebrow}
          </p>
          <h2 className={styles.intro__headline} data-wave-item>
            {headline}
          </h2>
          <ul className={styles.intro__stats}>
            {stats.map((stat, i) => (
              <li key={i} className={styles.intro__stat} data-wave-item>
                <span className={styles.intro__statValue}>{stat.value}</span>
                <span className={styles.intro__statLabel}>{stat.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </header>

      {/* Hikâye sahneleri — hepsi aynı karede üst üste; timeline sırayla
          crossfade eder. Still çok yumuşak radial erimeyle siyah-karışık
          zemine karışır, metin koyu tarafta erimenin içinde durur. */}
      {waypoints.map((wp, i) => {
        const side = i % 2 === 0 ? 'left' : 'right';
        return (
          <article
            key={i}
            className={`${styles.intro__scene} ${styles.intro__beat} ${styles[`intro__beat--${side}`]}`}
            style={{ '--wp-ambient': AMBIENTS[i] }}
            data-scene
          >
            <div className={styles.intro__beatMedia} data-media>
              <img
                className={styles.intro__beatImage}
                src={wp.image}
                alt={wp.title}
                loading="lazy"
                decoding="async"
                data-zoom
              />
            </div>
            <div className={styles.intro__beatBody} data-copy>
              <h3 className={styles.intro__beatTitle}>{wp.title}</h3>
              <p className={styles.intro__beatText}>{wp.body}</p>
            </div>
          </article>
        );
      })}

      {/* Kapanış sahnesi — Characters'a devir */}
      <div className={`${styles.intro__scene} ${styles.intro__closing}`} data-scene>
        <p className={styles.intro__closingText} data-copy>
          {closing}
        </p>
      </div>
    </section>
  );
}
