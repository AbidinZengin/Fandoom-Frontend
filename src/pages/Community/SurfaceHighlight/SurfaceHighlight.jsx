import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import gsap from 'gsap';
import styles from './SurfaceHighlight.module.css';

function renderMeta(item, t) {
  if (item.votes != null) return t('home.votes', { count: item.votes });
  if (item.replyCount != null) return t('community.replies', { count: item.replyCount });
  if (item.readTime) return item.readTime;
  if (item.date) return item.date;
  return null;
}

// Community hub'ının 5-yüzey karışık öne-çıkanlar vitrini — her yüzey kendi
// "Tümünü Gör" linkiyle spoke sayfasına devreder (hub-and-spoke, learned-rules
// [[topluluk-navigasyon]]). Boş yüzey "0 içerik" göstermez, davet copy'sine
// döner (ghost-town hissini önler). Motion: utility register (0.3-0.4s) —
// başlık+kartlar scroll'a girince kademeli belirir; kart hover zaten CSS
// transition'da (scale+glow, [[imza-uzama]] ailesi).
export function SurfaceHighlight({ surface }) {
  const { t } = useTranslation();
  const { label, to, items } = surface;
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
    <section className={styles['surface-highlight']} ref={sectionRef}>
      <header className={styles['surface-highlight__head']} data-reveal>
        <h2 className={styles['surface-highlight__title']}>{label}</h2>
        <Link to={to} className={styles['surface-highlight__view-all']}>
          {t('community.viewAll')} &rarr;
        </Link>
      </header>

      {items.length === 0 ? (
        <p className={styles['surface-highlight__empty']} data-reveal>
          {t('community.emptyState')}
        </p>
      ) : (
        <ul className={styles['surface-highlight__list']}>
          {items.map((item) => {
            const meta = renderMeta(item, t);
            return (
              <li key={item.id} className={styles['surface-highlight__item']} data-reveal>
                <h3 className={styles['surface-highlight__item-title']}>{item.title}</h3>
                {item.excerpt && (
                  <p className={styles['surface-highlight__item-excerpt']}>{item.excerpt}</p>
                )}
                <span className={styles['surface-highlight__item-meta']}>
                  {item.author}
                  {item.author && meta && ' · '}
                  {meta}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
