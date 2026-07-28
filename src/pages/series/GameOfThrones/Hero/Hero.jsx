import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isCinematicArmed } from '../../../../motion/cinematic';
import { fetchHeroContent } from './Hero.data';
import styles from './Hero.module.css';

gsap.registerPlugin(ScrollTrigger);

export function Hero({ entityId, title, synopsis }) {
  const heroRef = useRef(null);
  const mediaRef = useRef(null);
  const imageRef = useRef(null);
  const contentRef = useRef(null);
  const logoRef = useRef(null);
  const synopsisRef = useRef(null);
  const [heroImage, setHeroImage] = useState(null);
  const [logoImage, setLogoImage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchHeroContent(entityId).then(({ heroImage: img, logoImage: logo }) => {
      if (cancelled) return;
      setHeroImage(img);
      setLogoImage(logo);
    });
    return () => {
      cancelled = true;
    };
  }, [entityId]);

  // useLayoutEffect: cinematic gelişte ilk boyamadan ÖNCE clip/scale
  // başlangıç değerleri basılmalı — useEffect tam ekran hero'nun bir
  // karelik flash'ına izin verirdi.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Başlık artık metalik logo görseli (kullanıcı kararı) — harf-harf
        // stagger geçersiz; logo clip/scale + fade ile açılır.
        if (isCinematicArmed()) {
          // Cinematic reveal: 1) merkezden ince dikey şerit tüm ekrana
          // genişler 2) hero görseli counter-zoom ile 2.3 → 1'e oturur
          // 3) logo hafif scale + fade ile belirir, sinopsis takip eder.
          const tl = gsap.timeline();

          tl.fromTo(
            heroRef.current,
            { clipPath: 'inset(0% 49.75% 0% 49.75%)' },
            {
              clipPath: 'inset(0% 0% 0% 0%)',
              duration: 0.55,
              ease: 'power3.in',
              clearProps: 'clipPath',
            },
            0
          )
            .fromTo(
              imageRef.current,
              { scale: 2.3 },
              { scale: 1, duration: 0.95, ease: 'power2.out', clearProps: 'transform' },
              0
            )
            .from(
              logoRef.current,
              { opacity: 0, scale: 0.92, duration: 0.8, ease: 'power2.out', clearProps: 'opacity,transform' },
              0.6
            )
            .from(
              synopsisRef.current,
              { opacity: 0, y: 16, duration: 0.7, ease: 'power2.out', clearProps: 'opacity,transform' },
              1.4
            );
        }

        // Parallax: throne arka planı scroll'a göre YAVAŞ sürüklenir → hero
        // içeriği (logo/sinopsis) normal akışta kayarken görsel geride kalır
        // (derinlik). Medya sarmalayıcıya uygulanır (img'in counter-zoom
        // scale'inden ayrı eleman → çakışma yok); medya CSS'te overscan'lı.
        gsap.fromTo(
          mediaRef.current,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: 'none',
            scrollTrigger: {
              trigger: heroRef.current,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          }
        );

        // Scrub-fade (referans videolar): hero içeriği scroll'la yukarı
        // kayarken silinir, GERİ scroll'da geri gelir (scrub → çift yönlü).
        // Giriş animasyonları çocukları (logo/sinopsis) hedefler, bu tween
        // sarmalayıcıyı — çakışma yok. immediateRender kapalı: giriş
        // tween'lerinin başlangıç durumunu ezmesin.
        gsap.fromTo(
          contentRef.current,
          { opacity: 1, y: 0 },
          {
            opacity: 0,
            y: -60,
            ease: 'none',
            immediateRender: false,
            scrollTrigger: {
              trigger: heroRef.current,
              start: '15% top',
              end: '65% top',
              scrub: true,
            },
          }
        );

        if (!isCinematicArmed()) {
          // Varsayılan giriş (doğrudan URL / normal navigasyon):
          // logo -> synopsis, fade + rise.
          const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

          tl.from(
            logoRef.current,
            { opacity: 0, y: 28, duration: 0.9, clearProps: 'opacity,transform' },
            0
          ).from(
            synopsisRef.current,
            { opacity: 0, y: 16, duration: 0.7, clearProps: 'opacity,transform' },
            0.35
          );
        }
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set([logoRef.current, synopsisRef.current], { opacity: 1, y: 0 });
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className={styles['got-hero']} ref={heroRef}>
      <div className={styles['got-hero__media']} ref={mediaRef} aria-hidden="true">
        <img
          ref={imageRef}
          className={styles['got-hero__image']}
          src={heroImage ?? undefined}
          alt=""
          fetchPriority="high"
        />
        <div className={styles['got-hero__overlay']} />
      </div>

      <div className={styles['got-hero__content']} ref={contentRef}>
        {/* Başlık = yapımın resmi metalik logosu (CMS'ten). alt yapım
            adını taşır → ekran okuyucu ve SEO korunur. */}
        <img
          ref={logoRef}
          className={styles['got-hero__logo']}
          src={logoImage ?? undefined}
          alt={title}
          fetchPriority="high"
        />
        <p className={styles['got-hero__synopsis']} ref={synopsisRef}>
          {synopsis}
        </p>
      </div>
    </section>
  );
}
