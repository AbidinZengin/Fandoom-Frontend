import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './Hero.module.css';

gsap.registerPlugin(ScrollTrigger);

// Backdrop, bu sekmeyle zaten eşleşen mevcut asset (exhibit-seasons.jpg);
// yeni görsel aranmadı (kullanıcı kararı). Giriş: başlık → alt metin
// fade+rise (learned-rules: "her sayfanın hero'su ilk açılışta giriş
// animasyonu alır"); görselde hafif parallax (main GoT Hero ile aynı dil).
export function Hero() {
  const { t } = useTranslation();
  const heroRef = useRef(null);
  const mediaRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
        tl.from(titleRef.current, {
          opacity: 0,
          y: 28,
          duration: 0.9,
          clearProps: 'opacity,transform',
        }).from(
          subtitleRef.current,
          { opacity: 0, y: 16, duration: 0.7, clearProps: 'opacity,transform' },
          0.35
        );

        gsap.fromTo(
          mediaRef.current,
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: 'none',
            scrollTrigger: {
              trigger: heroRef.current,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set([titleRef.current, subtitleRef.current], { opacity: 1, y: 0 });
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className={styles.hero} ref={heroRef}>
      <div className={styles.hero__media} ref={mediaRef} aria-hidden="true">
        <img className={styles.hero__image} src="/got/exhibit-seasons.jpg" alt="" />
      </div>
      <div className={styles.hero__overlay} />
      <div className={styles.hero__content}>
        <h1 className={styles.hero__title} ref={titleRef}>
          {t('series.seasonsHeading')}
        </h1>
        <p className={styles.hero__subtitle} ref={subtitleRef}>
          {t('series.seasonsHeroSubtitle', { show: 'Game of Thrones' })}
        </p>
      </div>
    </section>
  );
}
