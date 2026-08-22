import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './Hero.module.css';

gsap.registerPlugin(ScrollTrigger);

// GoT'un SeasonEpisodes/Hero'sunun BİREBİR aynısı (kullanıcı kararı, 2026-08).
// Backdrop: kullanıcının verdiği mevcut asset (seasons-backdrop.jpg, çöl gün
// batımında RV) — SeasonRoute'ta zaten bu amaç için eklenmişti, yeni görsel
// aranmadı. Giriş: başlık → alt metin fade+rise, görselde hafif parallax
// (GoT ile aynı dil).
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
        <img className={styles.hero__image} src="/src/assets/breaking-bad/seasons-backdrop.jpg" alt="" />
      </div>
      <div className={styles.hero__overlay} />
      <div className={styles.hero__content}>
        <h1 className={styles.hero__title} ref={titleRef}>
          {t('series.seasonsHeading')}
        </h1>
        <p className={styles.hero__subtitle} ref={subtitleRef}>
          {t('series.seasonsHeroSubtitle', { show: 'Breaking Bad' })}
        </p>
      </div>
    </section>
  );
}
