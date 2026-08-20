import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './EpisodeGrid.module.css';

gsap.registerPlugin(ScrollTrigger);

const pad2 = (n) => String(n).padStart(2, '0');

/**
 * Sezonun bölüm listesi — backend'den gelen gerçek veri (fetchSeasonDetail
 * .episodes). Kullanıcı referansıyla (2026-08) sayfanın sağ sidebar'ına
 * taşındı: tam genişlikte kısa banner satırlar (görsel dolu genişlik, solda
 * numara "sekmesi", başlık görselin üzerine bindirilmiş) — önceki büyük
 * paket-kartı grid'in YERİNE geçti. Artık EpisodePage kuruldu (kullanıcı:
 * "buradan geçiş yapılacak") — satırlar /series/breaking-bad/seasons/
 * :seasonNumber/episodes/:episodeNumber'a gerçek Link.
 */
export function EpisodeGrid({ episodes, seasonNumber }) {
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
    <div aria-label="Episodes">
      <p className={styles.panel__heading}>Episodes</p>
      <ol className={styles.list} ref={listRef}>
        {episodes.map((ep) => (
          <li key={ep.id}>
            <Link
              to={`/series/breaking-bad/seasons/${seasonNumber}/episodes/${ep.episodeNumber}`}
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
