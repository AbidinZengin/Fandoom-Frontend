import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RelatedContent } from '../../../../../components/RelatedContent/RelatedContent';
import { HouseSigils } from './HouseSigils/HouseSigils';
import { fetchExploreBlogs, EXPLORE_TEASERS, EXPLORE_INTRO, ARTIFACTS } from './Explore.data';
import styles from './Explore.module.css';

gsap.registerPlugin(ScrollTrigger);

// Westeros sayfasının 3. elemanı — kullanıcının asıl vakit geçireceği keşif
// hub'ı (harita + mühür sonrası). Kaynak: kullanıcının attığı kaba AI-üretimi
// wireframe (metin katmanları placeholder/gibberish, sadece kutu iskeleti
// okundu) — gerçek tasarım dili mevcut component'lerden (Highlights'ın
// "Explore ›" teaser dili, RelatedContent'in Dive Deeper mekaniği,
// HouseSigils'in relocate edilmiş hâli) ödünç alındı, yeni bir görsel dil
// icat edilmedi.
//
// Motion: learned-rules [imza-dalga] — sayfa Hero'nun ALTINDA (WorldMap +
// Seal'dan sonra) göründüğü için Characters.jsx'in mount-time gsap.from'u
// DEĞİL, Highlights.jsx'teki ScrollTrigger tetiklemesi kullanılır (section
// gerçekten viewport'a girdiğinde oynar). Değerler (x:140, y:56, duration:0.9,
// power3.out, stagger:0.12) birebir korunur.
//
// Houses ve Dive Deeper kendi `<section>`'ını taşıdığı için Explore tek bir
// dev sarmalayıcı DEĞİL, Characters.jsx'teki gibi üst-seviye kardeş section
// dizisi döner — bu yüzden İKİ ayrı gsap.context/ScrollTrigger scope'u var
// (explore + artifacts); Houses ve RelatedContent kendi motion'larını zaten
// taşıyor, buradan dokunulmuyor.
export function Explore() {
  const [blogs, setBlogs] = useState(null);
  const exploreRef = useRef(null);
  const artifactsRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchExploreBlogs().then((data) => {
      if (!cancelled) setBlogs(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const featured = blogs?.slice(0, 3) ?? [];
  const diveDeeper = blogs?.slice(3) ?? [];

  useLayoutEffect(() => {
    if (!blogs) return undefined;
    const section = exploreRef.current;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(section.querySelectorAll('[data-title]'), {
          opacity: 0,
          x: 140,
          y: 56,
          duration: 0.9,
          ease: 'power3.out',
          clearProps: 'opacity,transform',
          scrollTrigger: { trigger: section, start: 'top 75%', once: true },
        });
        gsap.from(section.querySelectorAll('[data-reveal]'), {
          opacity: 0,
          x: 140,
          y: 56,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          delay: 0.15,
          clearProps: 'opacity,transform',
          scrollTrigger: { trigger: section, start: 'top 75%', once: true },
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(section.querySelectorAll('[data-title], [data-reveal]'), { opacity: 1, x: 0, y: 0 });
      });
    }, exploreRef);

    return () => ctx.revert();
  }, [blogs]);

  useLayoutEffect(() => {
    const section = artifactsRef.current;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(section.querySelectorAll('[data-title]'), {
          opacity: 0,
          x: 140,
          y: 56,
          duration: 0.9,
          ease: 'power3.out',
          clearProps: 'opacity,transform',
          scrollTrigger: { trigger: section, start: 'top 75%', once: true },
        });
        gsap.from(section.querySelectorAll('[data-reveal]'), {
          opacity: 0,
          x: 140,
          y: 56,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          delay: 0.15,
          clearProps: 'opacity,transform',
          scrollTrigger: { trigger: section, start: 'top 75%', once: true },
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(section.querySelectorAll('[data-title], [data-reveal]'), { opacity: 1, x: 0, y: 0 });
      });
    }, artifactsRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <section id="got-explore" className={styles.explore} ref={exploreRef}>
        <div className={styles.explore__inner}>
          {/* Sınırlı (page padding içinde) banner — viewport kenarına
              dayanmıyor, sayfanın diğer bloklarıyla aynı hizada. İki AYRI
              overlay bloğu (kullanıcı düzeltmesi, beşinci tur): "Explore the
              Westeros" başlığı SOL ALTTA sabit kalır, logo+açıklama SAĞDA
              ayrı bir blok. Banner'ın kendi "Explore" CTA'sı kaldırıldı —
              History/Timeline'ın kendi CTA'ları zaten var. */}
          <div className={styles.explore__banner}>
            <img
              className={styles.explore__bannerImage}
              src={EXPLORE_INTRO.banner}
              alt=""
              loading="lazy"
              decoding="async"
            />
            <div className={styles.explore__bannerScrim} aria-hidden="true" />

            <div className={styles.explore__bannerHeading} data-title>
              <span className={styles.explore__kicker}>Realm Guide</span>
              <h2 className={styles.explore__heading}>Explore the Westeros</h2>
            </div>

            <div className={styles.explore__bannerIntro} data-reveal>
              <img
                className={styles.explore__bannerLogo}
                src={EXPLORE_INTRO.logo}
                alt="Game of Thrones"
                loading="lazy"
                decoding="async"
              />
              <p className={styles.explore__bannerText}>{EXPLORE_INTRO.description}</p>
            </div>
          </div>

          <div className={styles.explore__grid}>
            <div className={styles.explore__primary}>
              {/* "History"/"Timeline" artık kartın İÇİNDE küçük bir kicker
                  değil, kartın ÜSTÜNDE duran büyük bir bölüm başlığı
                  (kullanıcı düzeltmesi, üçüncü tur) — Artifacts/Houses'daki
                  dış başlık deseniyle tutarlı. */}
              {EXPLORE_TEASERS.map((teaser) => (
                <div className={styles.teaserGroup} key={teaser.id} data-reveal>
                  <h3 className={styles.teaserGroup__label}>{teaser.label}</h3>

                  <Link
                    to={teaser.to}
                    className={styles.teaser}
                    data-has-image={Boolean(teaser.image) || undefined}
                  >
                    {teaser.image && (
                      <div className={styles.teaser__media}>
                        <img
                          className={styles.teaser__image}
                          src={teaser.image}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    )}
                    <div className={styles.teaser__body}>
                      <h4 className={styles.teaser__title}>{teaser.title}</h4>
                      <p className={styles.teaser__description}>{teaser.description}</p>
                      <span className={styles.teaser__cta}>
                        Explore <span>›</span>
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {featured.length > 0 && (
              <aside className={styles.featured} data-reveal>
                <h3 className={styles.featured__heading}>Featured</h3>
                <ul className={styles.featured__list}>
                  {featured.map((item) => (
                    <li key={item.id}>
                      <Link to={`/blog/${item.slug}`} className={styles.featuredCard}>
                        <div className={styles.featuredCard__cover}>
                          <img
                            className={styles.featuredCard__image}
                            src={item.imageUrl}
                            alt={item.imageAlt}
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        <div className={styles.featuredCard__body}>
                          <h4 className={styles.featuredCard__title}>{item.title}</h4>
                          <span className={styles.featuredCard__meta}>
                            {item.readingTimeMinutes} dk okuma
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>
        </div>
      </section>

      <HouseSigils />

      <section className={styles.artifacts} ref={artifactsRef}>
        <div className={styles.artifacts__inner}>
          <div data-title>
            <span className={styles.artifacts__kicker}>Artifacts</span>
            <h3 className={styles.artifacts__heading}>Efsanevi Eşyalar</h3>
          </div>

          <ul className={styles.artifacts__grid}>
            {ARTIFACTS.map((artifact) => (
              <li className={styles.artifactCard} key={artifact.id} data-reveal>
                <div className={styles.artifactCard__media}>
                  <div className={styles.artifactCard__frame}>
                    <img
                      className={styles.artifactCard__image}
                      src={artifact.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
                <h4 className={styles.artifactCard__title}>{artifact.title}</h4>
                <p className={styles.artifactCard__description}>{artifact.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <RelatedContent items={diveDeeper} heading="Dive Deeper" />
    </>
  );
}
