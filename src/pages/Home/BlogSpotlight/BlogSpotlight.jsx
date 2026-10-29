import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import { getBlogSpotlight } from './BlogSpotlight.data';
import styles from './BlogSpotlight.module.css';

gsap.registerPlugin(ScrollTrigger);

// Görsel yüklenene kadar koyu zemin, sonra fade-in (skeleton/blur-up yok).
// visible=false katmanlar yüklü olsa da görünmez — crossfade'in diğer yüzü.
function Cover({ src, alt, className, visible = true }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      className={`${className} ${loaded && visible ? styles['is-loaded'] : ''}`}
      src={src}
      alt={alt ?? ''}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
    />
  );
}

// Kimlik satırı: "BLACK SWAN · ANALİZ". Alanlar (productionTitle, format)
// özet yanıtında yoksa ilgili parça düşer; ikisi de yoksa satır hiç çıkmaz.
function identityOf(blog, t) {
  return [blog.productionTitle, blog.format && t(`blog.formats.${blog.format}`)]
    .filter(Boolean)
    .join(' · ');
}

// Meta satırı: "7 dk okuma · 12 Eki" (yıl yok — vitrin yakın zamanı gösterir).
function metaOf(blog, t, lang) {
  return [
    blog.readingTimeMinutes != null && t('blog.minRead', { count: blog.readingTimeMinutes }),
    blog.publishedAt &&
      new Date(blog.publishedAt).toLocaleDateString(lang, { day: 'numeric', month: 'short' }),
  ]
    .filter(Boolean)
    .join(' · ');
}

// Home'da Community (Theories) bölümünün üstünde blog'u öne çıkarır: solda
// manşet blog, sağda numaralı 3 blog. Sağdaki karta gelince manşet o bloga
// geçer (kapak crossfade) ve bölümün arkasındaki ambient zemin de onunla
// değişir. Giriş: imza-dalga.
export function BlogSpotlight() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef(null);
  const [data, setData] = useState(null);
  // 0 = Editor's Pick (varsayılan), 1..3 = sağdaki kartlar
  const [active, setActive] = useState(0);
  const resetTimerRef = useRef(null);

  // Alandan (manşet + liste) çıkınca kısa gecikmeyle Editor's Pick'e döner;
  // gecikme, kartlar/manşet arası geçişte titremeyi önler.
  const cancelReset = () => clearTimeout(resetTimerRef.current);
  const scheduleReset = () => {
    cancelReset();
    resetTimerRef.current = setTimeout(() => setActive(0), 350);
  };
  useEffect(() => cancelReset, []);

  useEffect(() => {
    let cancelled = false;
    getBlogSpotlight().then((result) => {
      if (!cancelled) setData(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // İmza-dalga giriş: elemanlar sağdan sola kademeli belirir (bir kez).
  useEffect(() => {
    if (!data) return undefined;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-reveal]', {
          opacity: 0,
          x: 120,
          y: 48,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          clearProps: 'opacity,transform',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 78%', once: true },
        });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [data]);

  if (!data) return null;
  const { lead, rest } = data;
  const items = [lead, ...rest];
  const current = items[active];

  return (
    <section className={styles['spotlight']} ref={sectionRef}>
      {/* Ambient zemin: aktif blogun çok bulanık, karartılmış hâli (bölüm kenarlarında zemine erir) */}
      <div className={styles['spotlight__ambient']} aria-hidden="true">
        {items.map((blog, i) => (
          <Cover
            key={blog.id}
            src={blog.imageUrl}
            alt=""
            visible={i === active}
            className={styles['spotlight__ambient-image']}
          />
        ))}
      </div>

      <header className={styles['spotlight__head']} data-reveal>
        <h2 className={styles['spotlight__heading']}>
          <span className={styles['spotlight__heading-top']}>{t('blog.editorsPick')}</span>
          <span className={styles['spotlight__heading-bottom']}>{t('blog.heading')}</span>
        </h2>
      </header>

      <div
        className={styles['spotlight__grid']}
        onMouseEnter={cancelReset}
        onMouseLeave={scheduleReset}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) scheduleReset();
        }}
      >
        <Link to={`/blog/${current.slug}`} className={styles['spotlight__lead']} data-reveal>
          {items.map((blog, i) => (
            <Cover
              key={blog.id}
              src={blog.imageUrl}
              alt={i === active ? blog.imageAlt : ''}
              visible={i === active}
              className={styles['spotlight__lead-image']}
            />
          ))}
          {/* key: aktif blog değişince metin yeniden fade-in olur */}
          <div className={styles['spotlight__lead-caption']} key={current.id}>
            {active === 0 && <span className={styles['spotlight__badge']}>{t('blog.editorsPick')}</span>}
            {identityOf(current, t) && (
              <span className={styles['spotlight__identity']}>{identityOf(current, t)}</span>
            )}
            <h3 className={styles['spotlight__lead-title']}>{current.title}</h3>
            <div className={styles['spotlight__lead-footer']}>
              {metaOf(current, t, i18n.language) && (
                <span className={styles['spotlight__meta']}>{metaOf(current, t, i18n.language)}</span>
              )}
              <span className={styles['spotlight__cta']}>
                {t('blog.learnMore')} <span aria-hidden="true">›</span>
              </span>
            </div>
          </div>
        </Link>

        <ol className={styles['spotlight__list']}>
          {rest.map((blog, i) => (
            <li
              key={blog.id}
              data-reveal
              data-active={active === i + 1}
              onMouseEnter={() => setActive(i + 1)}
              onFocus={() => setActive(i + 1)}
            >
              <Link to={`/blog/${blog.slug}`} className={styles['spotlight__row']}>
                <span className={styles['spotlight__row-index']} aria-hidden="true">
                  {String(i + 2).padStart(2, '0')}
                </span>
                <div className={styles['spotlight__row-text']}>
                  {identityOf(blog, t) && (
                    <span className={styles['spotlight__identity']}>{identityOf(blog, t)}</span>
                  )}
                  <h3 className={styles['spotlight__row-title']}>{blog.title}</h3>
                  {metaOf(blog, t, i18n.language) && (
                    <span className={styles['spotlight__meta']}>{metaOf(blog, t, i18n.language)}</span>
                  )}
                </div>
                <div className={styles['spotlight__row-media']}>
                  <Cover
                    src={blog.imageUrl}
                    alt={blog.imageAlt}
                    className={styles['spotlight__row-image']}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
