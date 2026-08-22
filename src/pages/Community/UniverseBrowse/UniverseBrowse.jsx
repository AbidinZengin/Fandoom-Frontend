import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import styles from './UniverseBrowse.module.css';

// "Evrene göre gez" kartları — evren burada KLASÖR değil, tıklanınca o evrenin
// thread'lerine önceden-süzülmüş bir görünüme açılan giriş noktası olması
// gereken bir vitrin (learned-rules [[topluluk-organizasyon]]). Filtre/URL
// şeması henüz kararlaştırılmadı (task_plan.md Open Question #1) — bu yüzden
// kart şimdilik navigasyonsuz, yapımların rozetini gösteren statik bir vitrin.
// Motion: utility register (0.3-0.4s) — kartlar scroll'a girince kademeli belirir.
export function UniverseBrowse({ universes }) {
  const { t } = useTranslation();
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-reveal]', {
          opacity: 0,
          y: 20,
          duration: 0.4,
          ease: 'power2.out',
          stagger: 0.06,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 85%', once: true },
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('[data-reveal]', { opacity: 1 });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className={styles['universe-browse']} ref={sectionRef}>
      <h2 className={styles['universe-browse__heading']} data-reveal>
        {t('community.browseByUniverse')}
      </h2>
      <ul className={styles['universe-browse__list']}>
        {universes.map((universe) => (
          <li key={universe.id} className={styles['universe-browse__card']} data-reveal>
            <h3 className={styles['universe-browse__name']}>{universe.name}</h3>
            <div className={styles['universe-browse__productions']}>
              {universe.productions.map((production) => (
                <span
                  key={production.slug}
                  className={styles['universe-browse__tag']}
                  style={{ '--prod-accent': production.theme?.accent }}
                >
                  {production.title}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
