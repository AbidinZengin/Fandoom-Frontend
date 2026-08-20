import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getSeasonStory } from './SeasonStory.data';
import styles from './SeasonStory.module.css';

gsap.registerPlugin(ScrollTrigger);

/**
 * Sezonun "inceleme" bölümü — gerçek bir TV inceleme yazısı formatı/sesi
 * (kullanıcı referansı: House of the Dragon S3 incelemesi): giriş + alt-
 * başlıklı bölümler (fotoğraf+altyazı+kredi, gövde metni, pull-quote) +
 * kapanış yargısı. `photo.episodeNumber`, `episodes` prop'undaki GERÇEK
 * bölüm verisinden (stillImageUrl) o fotoğrafı bulur — sahte görsel yok,
 * zaten var olan bölüm fotoğrafları farklı bir bağlamda kullanılıyor.
 * Basit fade+y reveal — pin/scroll-scrub mekaniği yok (bu turda kaldırıldı).
 */
export function SeasonStory({ seasonNumber, episodes }) {
  const rootRef = useRef(null);
  const [content, setContent] = useState(null);

  useEffect(() => {
    setContent(getSeasonStory(seasonNumber));
  }, [seasonNumber]);

  const hasContent = Boolean(content);

  useLayoutEffect(() => {
    if (!hasContent || !rootRef.current) return undefined;

    const ctx = gsap.context((self) => {
      const mm = gsap.matchMedia();
      const reveals = self.selector('[data-reveal]');

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        reveals.forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 32,
            duration: 0.8,
            ease: 'power3.out',
            clearProps: 'opacity,transform',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          });
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(reveals, { opacity: 1, y: 0 });
      });
    }, rootRef);

    return () => ctx.revert();
  }, [hasContent]);

  if (!content) return null;

  const findStill = (episodeNumber) => episodes?.find((ep) => ep.episodeNumber === episodeNumber)?.stillImageUrl;

  return (
    <section className={styles.review} id="season-story" ref={rootRef}>
      <div className={styles.review__lede} data-reveal="">
        <p className={styles.review__kicker}>{content.kicker}</p>
        <h2 className={styles.review__title}>{content.title}</h2>
        {content.lede.map((paragraph) => (
          <p key={paragraph.slice(0, 32)} className={styles.review__ledeText}>
            {paragraph}
          </p>
        ))}
      </div>

      <div className={styles.review__sections}>
        {content.sections.map((section) => {
          const stillUrl = findStill(section.photo.episodeNumber);
          return (
            <article key={section.id} className={styles.section} data-reveal="">
              <h3 className={styles.section__heading}>{section.heading}</h3>

              <figure className={styles.section__figure}>
                {stillUrl ? (
                  <img
                    className={styles.section__image}
                    src={stillUrl}
                    alt={section.photo.caption}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className={styles.section__placeholder} aria-hidden="true" />
                )}
                <figcaption className={styles.section__caption}>
                  {section.photo.caption}
                  <span className={styles.section__credit}>{section.photo.credit}</span>
                </figcaption>
              </figure>

              {section.paragraphs.map((paragraph, pIdx) => (
                <p key={paragraph.slice(0, 32)} data-lead={pIdx === 0 ? 'true' : undefined}>
                  {paragraph}
                </p>
              ))}

              {section.pullQuote && <blockquote className={styles.section__quote}>{section.pullQuote}</blockquote>}
            </article>
          );
        })}
      </div>

      <div className={styles.review__verdict} data-reveal="">
        <p className={styles.review__verdictLabel}>Sonuç</p>
        {content.verdict.map((paragraph) => (
          <p key={paragraph.slice(0, 32)}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
