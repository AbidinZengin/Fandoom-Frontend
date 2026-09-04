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
// geçişini kullanıyor.
const CINEMATIC_SLUGS = new Set(['game-of-thrones', 'breaking-bad', 'house-of-the-dragon']);

// FOCUS_EXPAND (hover: yatay büyüme) — kullanıcı isteğiyle SADECE Breaking
// Bad'de, tıklama davranışından (yukarıdaki CINEMATIC_SLUGS) bağımsız.
const FOCUS_EXPAND_SLUGS = new Set(['breaking-bad']);

// posterUrl TMDb'den sabit küçük boyutlu bir transformla gelir (ör.
// .../t/p/w300_and_h450_face/...) — normal ~168px kart için yeterli ama
// focus-expand'da görsel çok daha büyük render edildiği için upscale
// bulanıklığı çıkıyor (kullanıcı raporu: "kalite aşırı düşüyor").
// TMDb URL'sindeki boyut segmenti daha büyük bir varyantla değiştirilir;
// TMDb dışı asset'lerde (ör. yerel /breaking-bad/...) URL değişmeden döner.
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

  // ---- FOCUS_EXPAND: mouseenter → hedef kart yatayda büyür, komşular
  // sıkışır (referans video 12s+). GSAP her karta doğrudan width/height
  // tween'ler (CSS flex-grow transition denendi, flex-model geçişi anlık
  // sıçrama yaratıyordu — terk edildi). Height de kilitlenir: width+height
  // ikisi de inline set olunca aspect-ratio devre dışı kalır, kart boyca
  // sabit kalır. mouseleave'de orijinal genişliğe geri tween'lenip
  // clearProps ile CSS'e (clamp responsive) devredilir.
  const hoverTween = useRef(null);
  const hoverOriginals = useRef(null);

  useEffect(() => () => hoverTween.current?.kill(), []);

  const onFocusExpandEnter = (e) => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    const row = rowRef.current;
    const cards = row ? [...row.children] : [];
    const targetIndex = cards.indexOf(e.currentTarget);
    if (targetIndex === -1) return;

    const rects = cards.map((c) => c.getBoundingClientRect());
    hoverOriginals.current = rects.map((r) => ({ width: r.width, height: r.height }));

    // Satırın TOPLAM genişliği sabit kalır (satır kayması yaşanmaz);
    // aktif kart bunun içinden viewport'a göre büyük bir pay alır, geri
    // kalanı komşulara eşit dağılır — komşular AŞIRI daralmasın diye alt
    // sınır var(--space-3xl) (kullanıcı düzeltmesi: "diğer elemanlar fazla
    // küçülüyor").
    const totalWidth = rects.reduce((sum, r) => sum + r.width, 0);
    const othersCount = Math.max(cards.length - 1, 1);
    const minSliver =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--space-3xl')) || 64;
    const maxExpandable = Math.max(totalWidth - minSliver * othersCount, minSliver);
    const expandedWidth = Math.min(window.innerWidth * 0.44, maxExpandable);
    const shareWidth = Math.max((totalWidth - expandedWidth) / othersCount, minSliver);

    hoverTween.current?.kill();
    const tl = gsap.timeline();
    cards.forEach((card, i) => {
      tl.to(
        card,
        {
          width: i === targetIndex ? expandedWidth : shareWidth,
          height: rects[i].height,
          duration: 0.55,
          ease: 'power3.out',
        },
        0
      );
    });
    hoverTween.current = tl;
  };

  const onFocusExpandLeave = () => {
    const row = rowRef.current;
    const originals = hoverOriginals.current;
    if (!row || !originals) return;
    hoverOriginals.current = null;

    hoverTween.current?.kill();
    const tl = gsap.timeline();
    [...row.children].forEach((card, i) => {
      const orig = originals[i];
      if (!orig) return;
      tl.to(
        card,
        {
          width: orig.width,
          height: orig.height,
          duration: 0.5,
          ease: 'power3.out',
          clearProps: 'width,height',
        },
        0
      );
    });
    hoverTween.current = tl;
  };

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
              data-focus-expand={FOCUS_EXPAND_SLUGS.has(p.slug) || undefined}
              aria-label={p.title}
              draggable={false}
              onMouseEnter={FOCUS_EXPAND_SLUGS.has(p.slug) ? onFocusExpandEnter : undefined}
              onMouseLeave={FOCUS_EXPAND_SLUGS.has(p.slug) ? onFocusExpandLeave : undefined}
              onFocus={FOCUS_EXPAND_SLUGS.has(p.slug) ? onFocusExpandEnter : undefined}
              onBlur={FOCUS_EXPAND_SLUGS.has(p.slug) ? onFocusExpandLeave : undefined}
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
                    src={FOCUS_EXPAND_SLUGS.has(p.slug) ? higherResPoster(p.posterUrl) : p.posterUrl}
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
