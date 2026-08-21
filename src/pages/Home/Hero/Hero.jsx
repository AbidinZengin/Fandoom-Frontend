import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { FandoomLogo } from '../../../components/FandoomLogo/FandoomLogo';
import styles from './Hero.module.css';

export function Hero({ onExplore }) {
  const heroRef = useRef(null);
  const { t } = useTranslation();
  const ctaRef = useRef(null);
  const ctaFloatRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

        // Absolute positions on the timeline (logo -> tagline -> subline -> CTA),
        // overlapping so the whole sequence lands at ~0.9s total.
        // clearProps is scoped to exactly the props this tween animates
        // (opacity, transform) — NOT 'all', since these targets (FandoomLogo's
        // internals especially) carry their own inline typography styles
        // (fontSize, letterSpacing, etc.) that must survive the animation.
        // FandoomLogo'nun class'ları module dışı (düz string) — string seçici
        // çalışır; module'a taşınan CTA ise ref ile hedeflenir.
        tl.from(
          '.fandoom-logo__mark',
          { opacity: 0, y: 204, duration: 0.8, clearProps: 'opacity,transform' },
          0
        )
          .from(
            '.fandoom-logo__tagline',
            { opacity: 0, y: 156, duration: 0.8, clearProps: 'opacity,transform' },
            0.3
          )
          .from(
            '.fandoom-logo__subline',
            { opacity: 0, y: 156, duration: 0.8, clearProps: 'opacity,transform' },
            0.45
          )
          // clearProps so GSAP's inline transform doesn't shadow the CSS :hover lift.
          .from(
            ctaRef.current,
            { opacity: 0, y: 12, duration: 0.25, clearProps: 'opacity,transform' },
            0.65
          );

        // CTA idle float: giriş oturduktan sonra sonsuz, yumuşak aşağı-yukarı
        // salınım. Wrapper'a uygulanır — butonun kendi transform'u CSS :hover
        // lift'e ait, aynı elemanda GSAP inline transform onu ezerdi.
        gsap.to(ctaFloatRef.current, {
          y: 14,
          duration: 1.8,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: 0.9,
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(
          ['.fandoom-logo__mark', '.fandoom-logo__tagline', '.fandoom-logo__subline'],
          { opacity: 1, y: 0 }
        );
        gsap.set(ctaRef.current, { opacity: 1, y: 0 });
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className={styles.hero} ref={heroRef}>
      <div className={`${styles.hero__sparkle} ${styles['hero__sparkle--tr']}`} aria-hidden="true">
        <SparkleIcon />
      </div>
      <div className={`${styles.hero__sparkle} ${styles['hero__sparkle--bl']}`} aria-hidden="true">
        <SparkleIcon />
      </div>

      <div className={styles.hero__content}>
        <FandoomLogo showTagline={true} glowOpacity={0.55} />
        {/* Float wrapper: idle salınım burada yaşar, hover lift butonda kalır */}
        <div ref={ctaFloatRef}>
          <button
            type="button"
            className={styles.hero__cta}
            ref={ctaRef}
            onClick={onExplore}
          >
            {t('home.heroCta')}
          </button>
        </div>
      </div>
    </section>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 34 34" width="100%" height="100%">
      <path
        d="M 17 1 C 18.5 10 24 15.5 33 17 C 24 18.5 18.5 24 17 33 C 15.5 24 10 18.5 1 17 C 10 15.5 15.5 10 17 1 Z"
        fill="currentColor"
      />
    </svg>
  );
}
