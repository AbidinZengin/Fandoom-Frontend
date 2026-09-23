import { useLayoutEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './SeasonStory.module.css';

gsap.registerPlugin(ScrollTrigger);

// seasonBlocks[] (backend, sceneKey+orderIndex ile düz dizi) ->
// { lede[], sections[{id,heading,photo,paragraphs[],pullQuote}], verdict[] }.
// content alanı backend'de Accept-Language'e göre TEK dile çözümlenir —
// burada EN/TR seçimi YAPILMAZ, block.content olduğu gibi render edilir.
function parseSeasonBlocks(blocks) {
  if (!blocks?.length) return null;
  const sorted = [...blocks].sort((a, b) => a.orderIndex - b.orderIndex);
  const lede = [];
  const verdict = [];
  const sectionsByKey = new Map();

  for (const block of sorted) {
    if (block.blockType === 'LEDE_TEXT') {
      lede.push(...block.content.split('\n\n'));
      continue;
    }
    if (block.blockType === 'VERDICT_TEXT') {
      verdict.push(...block.content.split('\n\n'));
      continue;
    }

    let section = sectionsByKey.get(block.sceneKey);
    if (!section) {
      section = { id: block.sceneKey, heading: '', photo: null, paragraphs: [], pullQuote: null };
      sectionsByKey.set(block.sceneKey, section);
    }

    switch (block.blockType) {
      case 'SECTION_HEADING':
        section.heading = block.content;
        break;
      case 'MEDIA':
        section.photo = {
          episodeNumber: block.mediaEpisodeRef,
          caption: block.mediaCaption,
          credit: block.mediaCredit,
        };
        break;
      case 'SECTION_LEAD_TEXT':
        section.paragraphs.push(block.content);
        break;
      case 'SECTION_TEXT':
        section.paragraphs.push(...block.content.split('\n\n'));
        break;
      case 'QUOTE':
        section.pullQuote = block.content;
        break;
      default:
        break;
    }
  }

  return { lede, sections: [...sectionsByKey.values()], verdict };
}

/**
 * Sezonun "derin okuma" bölümü — BreakingBad/HouseOfTheDragon SeasonStory
 * ile BİREBİR aynı (standart imza şablonu). İçerik backend'den (seasonBlocks)
 * gelir; Severance için bu içerik henüz yazılmadı (sezon incelemesi ayrı bir
 * sonraki adım), bu yüzden `content` null kalır ve section HİÇ render edilmez.
 */
export function SeasonStory({ storyKicker, storyTitle, seasonBlocks, episodes }) {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  const content = useMemo(() => parseSeasonBlocks(seasonBlocks), [seasonBlocks]);
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
        <p className={styles.review__kicker}>{storyKicker}</p>
        <h2 className={styles.review__title}>{storyTitle}</h2>
        {content.lede.map((paragraph) => (
          <p key={paragraph.slice(0, 32)} className={styles.review__ledeText}>
            {paragraph}
          </p>
        ))}
      </div>

      <div className={styles.review__sections}>
        {content.sections.map((section) => {
          const stillUrl = section.photo ? findStill(section.photo.episodeNumber) : null;
          return (
            <article key={section.id} className={styles.section} data-reveal="">
              <h3 className={styles.section__heading}>{section.heading}</h3>

              {section.photo && (
                <figure className={styles.section__figure}>
                  {stillUrl ? (
                    <img
                      className={styles.section__image}
                      src={stillUrl}
                      alt={section.photo.caption ?? ''}
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
              )}

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
        <p className={styles.review__verdictLabel}>{t('series.reckoningLabel')}</p>
        {content.verdict.map((paragraph) => (
          <p key={paragraph.slice(0, 32)}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
