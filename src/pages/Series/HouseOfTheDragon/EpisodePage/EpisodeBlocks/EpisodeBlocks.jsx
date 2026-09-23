import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { still } from '../EpisodePage.data';
import { fetchEpisodeBlocks } from './EpisodeBlocks.data';
import styles from './EpisodeBlocks.module.css';

gsap.registerPlugin(ScrollTrigger);

/**
 * EpisodeBrief'in altındaki derin-analiz scrollytelling'i.
 * BreakingBad/EpisodeBlocks'un BİREBİR aynısı — fetchEpisodeBlocks
 * production-agnostik olduğu için backend'de HotD bölümlerine içerik
 * yazıldığında bu component OTOMATİK render edilecek; içerik yoksa
 * (henüz yazılmadıysa) hiç render edilmez, sahte veri yok.
 *
 * Hareket şeması referansın (maglr breindossier) animasyon konfigürasyonu
 * DOM'dan çıkarılarak modellendi. Referansta 11.000px'lik sayfada topu topu
 * ~30 animasyonlu eleman var — yani hareket SEYREKTİR ve vurgu aracıdır:
 *
 *   • Gövde metni      → HİÇ animasyon almaz, statik akar.
 *   • Sahne başlığı    → aşağıdan yükselerek belirir (scroll'a bağlı, linear),
 *                        sonra normal akıp gider — yapışkan DEĞİL.
 *   • Alıntı çizgisi   → soldan açılarak süpürülür (`maskedMove` karşılığı).
 *   • Alıntı metni     → soldan kayarak belirir, eased, TEK SEFER.
 *   • Görsel           → hafif dikey parallax.
 *   • Sabitleme        → yalnız final sahnesinde (CSS sticky), vurgu için.
 */
export function EpisodeBlocks({ episodeId }) {
  const rootRef = useRef(null);
  const introRef = useRef(null);
  const [content, setContent] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setContent(null);
    fetchEpisodeBlocks(episodeId).then((data) => {
      if (!cancelled) setContent(data);
    });
    return () => {
      cancelled = true;
    };
  }, [episodeId]);

  const hasContent = Boolean(content);

  useLayoutEffect(() => {
    if (!rootRef.current) return undefined;

    const ctx = gsap.context((self) => {
      const mm = gsap.matchMedia();
      const headers = self.selector('[data-scene-header]');
      const quoteBlocks = self.selector('[data-quote]');
      const images = self.selector('[data-image]');

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Bölüm girişi: EpisodeBrief ile aynı tek seferlik imza.
        gsap.from(introRef.current.children, {
          opacity: 0,
          y: 28,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          clearProps: 'opacity,transform',
          scrollTrigger: { trigger: introRef.current, start: 'top 80%', once: true },
        });

        // Sahne başlığı: aşağıdan yükselerek belirir, scroll'a bağlı (linear).
        // Çıkış animasyonu YOK — belirdikten sonra sayfayla birlikte akar.
        headers.forEach((header) => {
          gsap.fromTo(
            header,
            { opacity: 0, y: 64 },
            {
              opacity: 1,
              y: 0,
              ease: 'none',
              scrollTrigger: {
                trigger: header,
                start: 'top bottom',
                end: 'top 62%',
                scrub: 1.2,
              },
            },
          );
        });

        // Alıntı: çizgi soldan süpürülür, hemen ardından metin soldan kayarak
        // belirir. Başlıkla AYNI dilde scroll'a bağlı (scrub) — geri sarınca
        // baştan oynar, tek seferlik DEĞİL.
        quoteBlocks.forEach((block) => {
          const rule = block.querySelector('[data-quote-rule]');
          const text = block.querySelector('[data-quote-text]');
          const scene = block.closest('[data-tone]');
          // Sabitlenen (sticky) alıntı kendi konumunu değiştirdiği için
          // ölçüm sahneden alınır, aksi hâlde tetikleyici kayıyor.
          const isPinned = scene?.dataset.pinned === 'true';

          gsap
            .timeline({
              scrollTrigger: {
                trigger: isPinned ? scene : block,
                start: isPinned ? 'top 72%' : 'top bottom',
                end: isPinned ? 'top 24%' : 'top 55%',
                scrub: 1.2,
              },
            })
            .fromTo(rule, { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 0.45 }, 0)
            .fromTo(
              text,
              { opacity: 0, x: -48 },
              { opacity: 1, x: 0, ease: 'none', duration: 0.55 },
              0.3,
            );
        });
      });

      // Parallax yalnız masaüstünde — dar ekranda kompozisyon tek kolona düşer
      // (CSS 900px eşiğiyle ÇİFT, birlikte değişmeli).
      mm.add(
        {
          motionOk: '(prefers-reduced-motion: no-preference)',
          desktop: '(min-width: 901px)',
        },
        (mmCtx) => {
          const { motionOk, desktop } = mmCtx.conditions;
          if (!motionOk || !desktop) return;

          images.forEach((image) => {
            gsap.fromTo(
              image,
              { yPercent: -3.5 },
              {
                yPercent: 3.5,
                ease: 'none',
                scrollTrigger: {
                  trigger: image.closest('figure') ?? image,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              },
            );
          });
        },
      );

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(headers, { opacity: 1, y: 0 });
        quoteBlocks.forEach((block) => {
          gsap.set(block.querySelector('[data-quote-rule]'), { scaleX: 1 });
          gsap.set(block.querySelector('[data-quote-text]'), { opacity: 1, x: 0 });
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, [hasContent]);

  if (!content) return null;

  return (
    <section className={styles.blocks} id="episode-blocks" ref={rootRef}>
      <div className={`${styles.blocks__grid} ${styles.blocks__intro}`}>
        <div className={styles.blocks__introInner} ref={introRef}>
          <p className={styles.blocks__kicker}>{content.kicker}</p>
          <h2 className={styles.blocks__title}>{content.title}</h2>
          <p className={styles.blocks__thesis}>{content.thesis}</p>
        </div>
      </div>

      <ol className={styles.blocks__scenes}>
        {content.scenes.map((scene) => (
          <li
            key={scene.id}
            className={styles.scene}
            data-tone={scene.tone}
            data-pinned={scene.pinned ? 'true' : undefined}
          >
            <div className={`${styles.blocks__grid} ${styles.scene__grid}`}>
              <header
                className={styles.scene__header}
                data-scene-header=""
                style={{ gridColumn: scene.title.col, gridRow: scene.title.row }}
              >
                <p className={styles.scene__kicker}>{scene.kicker}</p>
                <h3 className={styles.scene__title}>{scene.title.text}</h3>
              </header>

              {/* Finalde görsel ve alıntı TEK sabitlenen blokta durur; metin
                  kolonu yanlarından akar. Diğer sahnelerde ikisi grid'e ayrı
                  ayrı yerleşir. */}
              <div
                className={scene.pinned ? styles.scene__pinned : styles.scene__mediaCell}
                style={{ gridColumn: scene.media.col, gridRow: scene.media.row }}
              >
                <figure
                  className={styles.scene__figure}
                  style={{ aspectRatio: scene.media.ratio }}
                >
                  <img
                    className={styles.scene__image}
                    data-image=""
                    src={still(scene.media.url, 1280)}
                    alt={scene.media.alt}
                    loading="lazy"
                    decoding="async"
                  />
                </figure>

                {scene.pinned && scene.quote && (
                  <p className={styles.scene__quote} data-quote="">
                    <span className={styles.scene__quoteRule} data-quote-rule="" aria-hidden="true" />
                    <span data-quote-text="">{scene.quote.text}</span>
                  </p>
                )}
              </div>

              {scene.text.map((block) => (
                <div
                  key={block.col + block.row + block.paragraphs[0].slice(0, 24)}
                  className={styles.scene__block}
                  data-lead={block.lead ? 'true' : undefined}
                  style={{ gridColumn: block.col, gridRow: block.row }}
                >
                  {block.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                  ))}
                </div>
              ))}

              {!scene.pinned && scene.quote && (
                <p
                  className={styles.scene__quote}
                  data-quote=""
                  style={{ gridColumn: scene.quote.col, gridRow: scene.quote.row }}
                >
                  <span className={styles.scene__quoteRule} data-quote-rule="" aria-hidden="true" />
                  <span data-quote-text="">{scene.quote.text}</span>
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
