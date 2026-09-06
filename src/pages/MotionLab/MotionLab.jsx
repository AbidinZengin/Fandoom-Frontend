import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import styles from './MotionLab.module.css';

// Geçici deneme route'u (/motion-lab) — PinLoad Travel referans videosundan
// çıkarılan mekanizma burada placeholder içerikle tunelanır. Video bir
// otomatik-oynayan vitrin DEĞİL, gerçek bir sitenin scroll kaydı — TÜM
// fazlar (açılış dolly-zoom dahil) gerçek scroll'a bağlı. Açılış/kapanış
// zoom'u pin'li bir hero'nun scrub'lı ScrollTrigger'ı: ileri scroll zoom-in
// yapar, geri scroll AYNI scrub'ın tersine sarmasıyla kendiliğinden
// "rewind + zoom-out" üretir — ayrı bir rewind tween'i YOK, çünkü referans
// videodaki rewind de gerçek kullanıcının yukarı scroll etmesiydi. Sonraki
// bölümler ise native scroll + ScrollTrigger enter-reveal (Fandoom'un
// zaten kullandığı desen, bkz. Home/ContentSection). Yerleşim onaylanınca
// gerçek içerikle hedef component'e taşınır, bu sayfa silinir.

const EXPLORE_CARDS = ['Kyoto', 'Lofoten', 'Marrakesh'];
const OFFER_CARDS = [
  { title: 'Rehberli Turlar', text: 'Yerel uzmanlarla küçük gruplar.' },
  { title: '7/24 Destek', text: 'Yolculuk boyunca kesintisiz destek.' },
  { title: 'Esnek İptal', text: '48 saat öncesine kadar ücretsiz iptal.' },
];
const DESTINATION_CARDS = ['Santorini', 'Kapadokya', 'Patagonya'];
const BLOG_ITEMS = [
  'Sırt Çantasıyla Güneydoğu Asya',
  'Kış Aylarında İskandinavya',
  'Bütçe Dostu Avrupa Rotaları',
];

function RevealSection({ sectionRef, headingRef, bodyRef, heading, children }) {
  return (
    <section className={styles.section} ref={sectionRef}>
      <h2 className={styles.heading} ref={headingRef}>{heading}</h2>
      <div className={styles.cards} ref={bodyRef}>
        {children}
      </div>
    </section>
  );
}

export default function MotionLab() {
  const labRef = useRef(null);

  const heroRef = useRef(null);
  const heroNavRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroTextRef = useRef(null);
  const heroCtaRef = useRef(null);

  const exploreRef = useRef(null);
  const exploreHeadingRef = useRef(null);
  const exploreCardsRef = useRef(null);

  const offerRef = useRef(null);
  const offerHeadingRef = useRef(null);
  const offerCardsRef = useRef(null);

  const aboutRef = useRef(null);
  const aboutHeadingRef = useRef(null);
  const aboutMediaRef = useRef(null);

  const destRef = useRef(null);
  const destHeadingRef = useRef(null);
  const destCardsRef = useRef(null);

  const blogRef = useRef(null);
  const blogHeadingRef = useRef(null);
  const blogListRef = useRef(null);
  const blogFooterRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Hero: sayfa açılışında hemen görünür, scroll'a bağlı değil (Home/Hero.jsx deseni).
        gsap.timeline({ defaults: { ease: 'power2.out' } })
          .from(heroNavRef.current, { autoAlpha: 0, duration: 0.3 })
          .from(heroTitleRef.current, { autoAlpha: 0, duration: 0.4 }, 0.15)
          .from(heroTextRef.current, { autoAlpha: 0, duration: 0.4 }, 0.3)
          .from(heroCtaRef.current, { autoAlpha: 0, duration: 0.35 }, 0.45);

        // Standart bölüm reveal kalıbı (analiz raporundaki ★ desen): gerçek
        // scroll ile section görünüre girince heading, ardından kart grubu
        // stagger ile beliriyor — sadece opacity, translateY/blur yok.
        const revealOnScroll = (sectionEl, headingEl, bodyChildren) => {
          gsap.timeline({
            scrollTrigger: { trigger: sectionEl, start: 'top 75%', once: true },
          })
            .from(headingEl, { autoAlpha: 0, duration: 0.3 })
            .from(bodyChildren, { autoAlpha: 0, duration: 0.4, stagger: 0.08 }, '<0.1');
        };

        revealOnScroll(exploreRef.current, exploreHeadingRef.current, exploreCardsRef.current.children);
        revealOnScroll(offerRef.current, offerHeadingRef.current, offerCardsRef.current.children);
        revealOnScroll(aboutRef.current, aboutHeadingRef.current, [aboutMediaRef.current]);
        revealOnScroll(destRef.current, destHeadingRef.current, destCardsRef.current.children);
        revealOnScroll(blogRef.current, blogHeadingRef.current, blogListRef.current.children);

        gsap.from(blogFooterRef.current, {
          autoAlpha: 0,
          duration: 0.4,
          scrollTrigger: { trigger: blogFooterRef.current, start: 'top 90%', once: true },
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(
          [
            heroNavRef.current, heroTitleRef.current, heroTextRef.current, heroCtaRef.current,
            exploreHeadingRef.current, offerHeadingRef.current, aboutHeadingRef.current,
            destHeadingRef.current, blogHeadingRef.current, blogFooterRef.current,
          ],
          { autoAlpha: 1 }
        );
      });
    }, labRef);

    return () => ctx.revert();
  }, []);

  return (
    <main className={styles.lab} ref={labRef}>
      <section className={styles.hero} ref={heroRef}>
        <div className={styles.hero__nav} ref={heroNavRef}>Toury</div>
        <h1 className={styles.hero__title} ref={heroTitleRef}>Yol Hikayeni Keşfet</h1>
        <p className={styles.hero__text} ref={heroTextRef}>Dünyanın en güzel rotalarını birlikte planlayalım.</p>
        <button type="button" className={styles.hero__cta} ref={heroCtaRef}>Keşfet</button>
      </section>

      <RevealSection sectionRef={exploreRef} headingRef={exploreHeadingRef} bodyRef={exploreCardsRef} heading="Explore Destinations">
        {EXPLORE_CARDS.map((name) => (
          <div className={styles.card} key={name}>{name}</div>
        ))}
      </RevealSection>

      <RevealSection sectionRef={offerRef} headingRef={offerHeadingRef} bodyRef={offerCardsRef} heading="Neler Sunuyoruz">
        {OFFER_CARDS.map((item) => (
          <div className={styles.card} key={item.title}>
            <strong>{item.title}</strong>
            <span>{item.text}</span>
          </div>
        ))}
      </RevealSection>

      <section className={styles.section} ref={aboutRef}>
        <h2 className={styles.heading} ref={aboutHeadingRef}>Hakkımızda</h2>
        <div className={styles.about__media} ref={aboutMediaRef}>
          <span className={styles.about__play} aria-hidden="true">▶</span>
        </div>
      </section>

      <RevealSection sectionRef={destRef} headingRef={destHeadingRef} bodyRef={destCardsRef} heading="Öne Çıkan Rotalar">
        {DESTINATION_CARDS.map((name) => (
          <div className={styles.card} key={name}>{name}</div>
        ))}
      </RevealSection>

      <section className={styles.section} ref={blogRef}>
        <h2 className={styles.heading} ref={blogHeadingRef}>Blogdan Son Yazılar</h2>
        <div className={styles.blog__list} ref={blogListRef}>
          {BLOG_ITEMS.map((title) => (
            <div className={styles.blog__item} key={title}>{title}</div>
          ))}
        </div>
      </section>

      <footer className={styles.footer} ref={blogFooterRef}>
        © Toury — Motion Lab placeholder footer
      </footer>
    </main>
  );
}
