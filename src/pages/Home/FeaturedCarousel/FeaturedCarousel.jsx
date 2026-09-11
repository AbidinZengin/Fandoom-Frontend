import { useEffect, useRef, useState } from 'react';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import { useLocalizedNavigate as useNavigate } from '../../../shared/i18n/useLocalizedNavigate';
import gsap from 'gsap';
import { armCinematic } from '../../../motion/cinematic';
import { fetchProductions } from './FeaturedCarousel.data';
import styles from './FeaturedCarousel.module.css';

// Cinematic geçişi olan hedefler: gerçek hero görseli olan seri sayfaları.
// DÜZELTME (manuel): Breaking Bad'in özel HERO_FLIP mekaniği (büyüyen poster
// klonu) kaldırıldı — hedef geometrisi eski OldHero kart düzenine göre
// kuruluydu ve yeni Hero'da klonu temizleyen kod yoktu (ekranda kalıcı siyah
// perde + poster kalıyordu). Artık GoT ile aynı, kanıtlanmış imza-şerit
// geçişini kullanıyor. DÜZELTME (manuel, 2026-09-11): GoT'un TAM kalıbı
// (şerit açılışı + counter-zoom + kademeli reveal + scroll parallax +
// scrub-fade) diğer 5 diziye de taşındı — hepsi cinematic hedefi oldu.
const CINEMATIC_SLUGS = new Set([
  'game-of-thrones',
  'breaking-bad',
  'house-of-the-dragon',
  'severance',
  'pluribus',
  'from',
  'it-welcome-to-derry',
  'stranger-things',
]);

// Yatay odak-büyüme (hover) ARTIK TÜM kartlarda — önceden sadece Breaking
// Bad'de vardı, kullanıcı isteğiyle (2026-09-11) hepsine entegre edildi.
// Tıklama davranışından (yukarıdaki CINEMATIC_SLUGS) bağımsız.

// posterUrl TMDb'den sabit küçük boyutlu bir transformla gelir (ör.
// .../t/p/w300_and_h450_face/...) — normal ~168px kart için yeterli ama
// hover'da görsel çok daha büyük render edildiği için upscale bulanıklığı
// çıkıyor (kullanıcı raporu: "kalite aşırı düşüyor"). TMDb URL'sindeki
// boyut segmenti daha büyük bir varyantla değiştirilir; TMDb dışı
// asset'lerde (ör. yerel /breaking-bad/...) URL değişmeden döner.
const higherResPoster = (url, size = 'w1280') =>
  url ? url.replace(/\/t\/p\/[^/]+\//, `/t/p/${size}/`) : url;

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
                const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

                // Cinematic geçiş (referans: IMDb konsepti) — mevcut sayfa
                // ~0.3s kararır, sonra route değişir; şerit reveal'ini hedef
                // sayfanın Hero'su üstlenir. '#root' modül dışı global id
                // olduğu için string seçici istisnası geçerlidir.
                if (!CINEMATIC_SLUGS.has(p.slug) || reduced) {
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
                    src={higherResPoster(p.posterUrl)}
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
