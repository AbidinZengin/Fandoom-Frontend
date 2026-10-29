import { useEffect, useRef, useState } from 'react';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import { useLocalizedNavigate as useNavigate } from '../../../shared/i18n/useLocalizedNavigate';
import gsap from 'gsap';
import { armCinematic, CINEMATIC_SLUGS } from '../../../motion/cinematic';
import { fetchMoodShelves, POSTER_POSITION } from './FeaturedCarousel.data';
import styles from './FeaturedCarousel.module.css';

// Cinematic geçişi olan hedefler: gerçek hero görseli olan seri sayfaları.
// CINEMATIC_SLUGS artık motion/cinematic.js'te (tek kaynak) — PageTransition de
// aynı listeyi kullanıp her girişte reveal'i arm ediyor. Buradaki tıklama
// ayrıca eski sayfayı ~0.3s karartır (carousel'e özgü ön hareket).
// Geçmiş: Breaking Bad'in HERO_FLIP klon mekaniği kaldırıldı, tüm yapımlar GoT'un
// kanıtlanmış imza-şerit geçişini kullanıyor (2026-09-11 kararı).

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
// MOCK ruh hali rafları: her raf kendi başlığı + poster satırıdır. Giriş
// dalgası Explore kapısı açıldıktan sonra (`play`) her raf görünüme girince
// bir kez oynar: başlık ve kartlar sağdan sola akarak yerleşir.
export function FeaturedCarousel({ play }) {
  const sectionRef = useRef(null);
  const navigate = useNavigate();
  const [shelves, setShelves] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchMoodShelves().then((data) => {
      if (!cancelled) setShelves(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Raflar asenkron geldiği için timeline'lar veri DOM'a düştükten sonra
  // kurulur. Raf seçimi hash'li module class'ı yerine data-attribute ile.
  useEffect(() => {
    if (!play || shelves.length === 0) return undefined;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        sectionRef.current.querySelectorAll('[data-shelf]').forEach((shelf) => {
          const tl = gsap.timeline({
            defaults: { ease: 'power3.out' },
            scrollTrigger: { trigger: shelf, start: 'top 80%', once: true },
          });
          tl.from(
            shelf.firstElementChild,
            { opacity: 0, x: 140, y: 56, duration: 0.9, clearProps: 'opacity,transform' },
            0
          ).from(
            shelf.lastElementChild.children,
            {
              opacity: 0,
              x: 140,
              y: 56,
              duration: 0.9,
              stagger: 0.12,
              clearProps: 'opacity,transform',
            },
            0.15
          );
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [play, shelves]);

  const renderCard = (p) => {
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
              style={{ objectPosition: POSTER_POSITION[p.slug] }}
              alt=""
              loading="lazy"
              draggable={false}
            />
          )}
        </div>
      </Link>
    );
  };

  return (
    <section className={styles.featured} ref={sectionRef}>
      {shelves.map((shelf) => (
        <div key={shelf.id} className={styles.featured__shelf} data-shelf>
          <h2 className={styles.featured__heading}>{shelf.title}</h2>
          <div className={styles.featured__row}>{shelf.productions.map(renderCard)}</div>
        </div>
      ))}
    </section>
  );
}
