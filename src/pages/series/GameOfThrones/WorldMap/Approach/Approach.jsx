import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { APPROACH_CONTENT } from './Approach.data';
import styles from './Approach.module.css';

gsap.registerPlugin(ScrollTrigger);

// White Desert'in "TO THE END OF THE EARTH" başlık sahnesinin GoT
// karşılığı — sayfa başlığından hemen sonra, pinned harita sahnesinden
// önce. Skip butonu SkipIntro.jsx ile AYNI show/hide deseni: bu section'a
// girince belirir, Explore'a (#got-explore) varınca kaybolur; tıklanınca
// pinned harita yolculuğunun TAMAMINI atlayıp doğrudan Explore'un başına
// iner (kullanıcı kararı — Seal kapanışını görmeden).
export function Approach() {
  const sectionRef = useRef(null);
  const skipRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const skip = skipRef.current;
    const explore = document.getElementById('got-explore');

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add({ motionOk: '(prefers-reduced-motion: no-preference)' }, ({ conditions }) => {
        const duration = conditions.motionOk ? 0.4 : 0;

        gsap.from(section.querySelectorAll('[data-wave-item]'), {
          opacity: 0,
          x: 140,
          y: 56,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          clearProps: 'opacity,transform',
          scrollTrigger: { trigger: section, start: 'top 75%', once: true },
        });

        if (!explore) return undefined;

        gsap.set(skip, { autoAlpha: 0, y: 12 });
        const show = () => gsap.to(skip, { autoAlpha: 1, y: 0, duration, ease: 'power2.out' });
        const hide = () => gsap.to(skip, { autoAlpha: 0, y: 12, duration, ease: 'power2.in' });

        const enterTrigger = ScrollTrigger.create({ trigger: section, start: 'top 60%', onEnter: show, onLeaveBack: hide });
        const exitTrigger = ScrollTrigger.create({ trigger: explore, start: 'top top', onEnter: hide, onLeaveBack: show });

        return () => {
          enterTrigger.kill();
          exitTrigger.kill();
        };
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleSkip = () => {
    const explore = document.getElementById('got-explore');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    explore?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <section className={styles.approach} aria-label="Approach to Westeros" ref={sectionRef}>
      <div className={styles.approach__body}>
        <span className={styles.approach__kicker} data-wave-item>
          {APPROACH_CONTENT.kicker}
        </span>
        <h2 className={styles.approach__heading} data-wave-item>
          {APPROACH_CONTENT.headline}
        </h2>
        <p className={styles.approach__description} data-wave-item>
          {APPROACH_CONTENT.description}
        </p>
      </div>

      <button type="button" className={styles.approach__skip} ref={skipRef} onClick={handleSkip}>
        <span>Skip</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </section>
  );
}
