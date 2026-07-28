import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchExhibitContent } from './TabExhibit.data';
import styles from './TabExhibit.module.css';

gsap.registerPlugin(ScrollTrigger);

// Pin sonrası doğal-scroll bölümü: üstte ana başlık, solda dikey tab menüsü,
// sağda sabit sergi. Tab hover'ında (onMouseEnter / focus) ilgili görsel
// crossfade ile belirir; her tab aynı zamanda React Router <Link> — tıklama
// ilgili rotaya geçirir (hover ↔ tıklama bağımsız). Dokunmatik cihazda hover
// yoktur; tap doğrudan route'a gider (learned-rules: touch'ta hover kapalı).
// Giriş: sinematik süzülme — başlık önde, tab kolonu + sergi kademeli takip
// eder (fade + y, uzun soft ease; learned-rules section reveal kuralı).
export function TabExhibit({ entityId }) {
  const [active, setActive] = useState(0);
  const [exhibitTitle, setExhibitTitle] = useState('');
  const [tabItems, setTabItems] = useState([]);
  const sectionRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchExhibitContent(entityId).then(({ title, items }) => {
      if (cancelled) return;
      setExhibitTitle(title ?? '');
      setTabItems(items);
    });
    return () => {
      cancelled = true;
    };
  }, [entityId]);

  useLayoutEffect(() => {
    if (tabItems.length === 0) return undefined;
    const section = sectionRef.current;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Başlık imza-dalga ile TEK BLOK önden girer (learned-rules marka
        // hareket dili: x 140 / y 56, 0.9s power3.out); tab kolonu + sergi
        // ~0.15s arkasından mevcut kademeli reveal ile takip eder.
        gsap.from(section.querySelector('[data-title]'), {
          autoAlpha: 0,
          x: 140,
          y: 56,
          duration: 0.9,
          ease: 'power3.out',
          clearProps: 'opacity,visibility,transform',
          scrollTrigger: { trigger: section, start: 'top 72%', once: true },
        });
        gsap.from(section.querySelectorAll('[data-reveal]'), {
          autoAlpha: 0,
          y: 48,
          duration: 1.1,
          ease: 'power3.out',
          stagger: 0.16,
          delay: 0.15,
          clearProps: 'opacity,visibility,transform',
          scrollTrigger: { trigger: section, start: 'top 72%', once: true },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [tabItems]);

  return (
    <section className={styles.exhibit} aria-label={exhibitTitle} ref={sectionRef}>
      <header className={styles.exhibit__head} data-title>
        <h2 className={styles.exhibit__title}>{exhibitTitle}</h2>
      </header>

      <div className={styles.exhibit__layout}>
        {/* Sol: dikey navigasyon — her öğe bir rota Link'i */}
        <nav className={styles.exhibit__tabs} aria-label={exhibitTitle} data-reveal>
          {tabItems.map((item, i) => (
            <Link
              key={i}
              to={item.labelLinkUrl}
              className={styles.exhibit__tab}
              data-active={i === active ? '' : undefined}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
            >
              <span className={styles['exhibit__tab-line']} aria-hidden="true" />
              <span className={styles['exhibit__tab-label']}>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Sağ: sabit sergi — tüm görseller stack, aktif olan crossfade ile görünür */}
        <div className={styles.exhibit__stage} data-reveal>
          {tabItems.map((item, i) => (
            <div
              key={i}
              className={styles.exhibit__layer}
              data-active={i === active ? '' : undefined}
            >
              {item.image ? (
                <img
                  className={styles.exhibit__image}
                  src={item.image}
                  alt={item.label}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className={styles.exhibit__placeholder}>IMAGE</span>
              )}
            </div>
          ))}
          <span className={styles.exhibit__ghost} aria-hidden="true">
            {exhibitTitle}
          </span>
        </div>
      </div>
    </section>
  );
}
