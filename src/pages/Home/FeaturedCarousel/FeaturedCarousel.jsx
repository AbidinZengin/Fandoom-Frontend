import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { armCinematic } from '../../../motion/cinematic';
import { fetchProductions } from './FeaturedCarousel.data';
import styles from './FeaturedCarousel.module.css';

// Cinematic geçişi olan hedefler: gerçek hero görseli olan seri sayfaları.
// (Şimdilik yalnız GoT — desen oturunca diğer sayfalara genişletilecek.)
const CINEMATIC_SLUGS = new Set(['game-of-thrones']);

// Referans (IMDb konsepti) yapısı: ortalanmış ince dikey poster dizisi.
// Giriş dalgası scroll'la değil Hero'daki Explore ile tetiklenir (`play`):
// başlık ve kartlar aynı dille sağdan sola akarak yerleşir.
export function FeaturedCarousel({ play }) {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const rowRef = useRef(null);
  const tlRef = useRef(null);
  const navigate = useNavigate();
  const [productions, setProductions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchProductions().then((data) => {
      if (!cancelled) setProductions(data.content);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Timeline paused kurulur: elemanlar gizli başlangıçta bekler, Explore
  // gelince oynar. .from immediateRender ile başlangıç state'ini basar.
  // productions'a bağımlı: veri asenkron geldiği için kartlar DOM'a
  // düşmeden timeline kurulamaz (rowRef.current.children boş olurdu).
  useEffect(() => {
    if (productions.length === 0) return undefined;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          paused: true,
          defaults: { ease: 'power3.out' },
        });

        // Başlık tek blok olarak kartlarla aynı dalgayı paylaşır; kartlar
        // soldan sağa stagger ile takip eder. 0.35s offset smooth scroll'un
        // bölüme varışını bekler.
        tl.from(
          headingRef.current,
          { opacity: 0, x: 140, y: 56, duration: 0.9, clearProps: 'opacity,transform' },
          0.35
        ).from(
          rowRef.current.children,
          {
            opacity: 0,
            x: 140,
            y: 56,
            duration: 0.9,
            stagger: 0.12,
            clearProps: 'opacity,transform',
          },
          0.5
        );

        tlRef.current = tl;

        return () => {
          tlRef.current = null;
        };
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(sectionRef.current, { opacity: 1 });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [productions]);

  // Explore basıldı: bölüme in, dalgayı başlat.
  useEffect(() => {
    if (!play) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    sectionRef.current.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    tlRef.current?.play();
  }, [play]);

  return (
    <section className={styles.featured} ref={sectionRef}>
      <h2 className={styles.featured__heading} ref={headingRef}>
        Featured Titles
      </h2>

      <div className={styles.featured__row} ref={rowRef}>
        {productions.map((p) => {
          const typeSegment = p.type === 'MOVIE' ? 'movies' : 'series';
          const href = `/${typeSegment}/${p.slug}`;
          return (
            <Link
              to={href}
              key={`${p.type}-${p.id}`}
              className={styles.featured__card}
              aria-label={p.title}
              draggable={false}
              onClick={(e) => {
                // Cinematic geçiş (referans: IMDb konsepti) — mevcut sayfa
                // ~0.3s kararır, sonra route değişir; şerit reveal'ini hedef
                // sayfanın Hero'su üstlenir. Reduced-motion'da Link'in normal
                // navigasyonuna dokunulmaz. '#root' modül dışı global id
                // olduğu için string seçici istisnası geçerlidir.
                if (
                  !CINEMATIC_SLUGS.has(p.slug) ||
                  window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ) {
                  return;
                }
                e.preventDefault();
                armCinematic();
                gsap.to('#root', {
                  opacity: 0.25,
                  duration: 0.3,
                  ease: 'power1.out',
                  onComplete: () => navigate(href),
                });
              }}
            >
              {/* Düz poster: metin overlay'i yok — kart görselin kendisidir.
                  Poster'i olmayan yapımlar görsel gelene dek koyu zeminde
                  bekler (learned-rules: placeholder/gradient üretilmez). */}
              <div className={styles['featured__card-media']}>
                {p.posterUrl && (
                  <img
                    className={styles['featured__card-poster']}
                    src={p.posterUrl}
                    alt=""
                    loading="lazy"
                    draggable={false}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
