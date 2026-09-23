import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './SkipIntro.module.css';

gsap.registerPlugin(ScrollTrigger);

// Hero + Intro + ScrollStepper sinematik yolculuğu uzun (~11-13vh) —
// Highlights'a (asıl navigasyon, eski adıyla TabExhibit) direkt atlamak
// isteyen kullanıcı için kaçış kapısı. Hero (#got-hero) bitince belirir,
// Highlights'a (#got-highlights) varınca kaybolur (kullanıcı kararı) —
// aradaki bölgede sabit kalır.
export function SkipIntro() {
  const { t } = useTranslation();
  const btnRef = useRef(null);

  useLayoutEffect(() => {
    const btn = btnRef.current;
    const hero = document.getElementById('got-hero');
    const exhibit = document.getElementById('got-highlights');
    if (!hero || !exhibit) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add({ motionOk: '(prefers-reduced-motion: no-preference)' }, ({ conditions }) => {
        const duration = conditions.motionOk ? 0.4 : 0;
        gsap.set(btn, { autoAlpha: 0, y: 12 });

        const show = () => gsap.to(btn, { autoAlpha: 1, y: 0, duration, ease: 'power2.out' });
        const hide = () => gsap.to(btn, { autoAlpha: 0, y: 12, duration, ease: 'power2.in' });

        const heroTrigger = ScrollTrigger.create({
          trigger: hero,
          start: 'bottom top',
          onEnter: show,
          onLeaveBack: hide,
        });
        const exhibitTrigger = ScrollTrigger.create({
          trigger: exhibit,
          start: 'top top',
          onEnter: hide,
          onLeaveBack: show,
        });

        return () => {
          heroTrigger.kill();
          exhibitTrigger.kill();
        };
      });
    });

    return () => ctx.revert();
  }, []);

  const handleClick = () => {
    const exhibit = document.getElementById('got-highlights');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    exhibit?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <button type="button" className={styles.skipIntro} ref={btnRef} onClick={handleClick}>
      <span className={styles.skipIntro__label}>{t('series.skipIntro')}</span>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
