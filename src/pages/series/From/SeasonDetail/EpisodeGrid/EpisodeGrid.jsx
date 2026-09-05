import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../../shared/i18n/LocalizedLink';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './EpisodeGrid.module.css';

gsap.registerPlugin(ScrollTrigger);

const pad2 = (n) => String(n).padStart(2, '0');

/**
 * Sezonun bölüm listesi — BreakingBad/HouseOfTheDragon SeasonDetail/
 * EpisodeGrid ile BİREBİR aynı (standart imza şablonu), sadece route base'i
 * from.
 */
export function EpisodeGrid({ episodes, seasonNumber }) {
  const { t } = useTranslation();
  const listRef = useRef(null);

  useLayoutEffect(() => {
    if (!listRef.current) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(listRef.current.querySelectorAll(`.${styles.row}`), {
          opacity: 0,
          y: 16,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.06,
          clearProps: 'opacity,transform',
          scrollTrigger: { trigger: listRef.current, start: 'top 90%', once: true },
        });
      });
    }, listRef);

    return () => ctx.revert();
  }, [episodes]);

  if (!episodes?.length) return null;

  return (
    <div aria-label={t('series.episodesHeading')}>
      <p className={styles.panel__heading}>{t('series.episodesHeading')}</p>
      <ol className={styles.list} ref={listRef}>
        {episodes.map((ep) => (
          <li key={ep.id}>
            <Link
              to={`/series/from/seasons/${seasonNumber}/episodes/${ep.episodeNumber}`}
              className={styles.row}
            >
              {ep.stillImageUrl && (
                <img
                  className={styles.row__image}
                  src={ep.stillImageUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onLoad={(e) => {
                    e.currentTarget.dataset.loaded = 'true';
                  }}
                />
              )}
              <span className={styles.row__scrim} aria-hidden="true" />
              <span className={styles.row__number}>{pad2(ep.episodeNumber)}</span>
              <span className={styles.row__title}>{ep.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
