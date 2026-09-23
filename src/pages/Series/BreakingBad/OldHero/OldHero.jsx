import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { readHeroFlip } from '../../../../motion/cinematic';
import heroBlocksData from './OldHero.blocks.json';
import { ANIMATION_PRESETS, HeroBlockRenderer } from './heroBlockRenderers';
import styles from './OldHero.module.css';

gsap.registerPlugin(ScrollTrigger);

// Mimari pivot (2026-08): içerik artık backend'den fetch EDİLMİYOR —
// Hero.blocks.json'dan doğrudan import ediliyor. Bu dosya
// /admin/series-hero editöründeki "Save" ile local design-server
// (scripts/design-server.mjs) üzerinden yazılır; Vite HMR değişikliği
// anında yansıtır. Kullanıcı kararı: şu an tek kullanıcı, canlıya alma
// derdi yok, hedef tasarım hızı — backend/DB/auth katmanı bilerek
// atlandı (bkz. plan: lively-zooming-river.md).
const heroBlocks = Array.isArray(heroBlocksData) ? heroBlocksData : [];

/**
 * Sayfanın hero'su. İçerik "Series Hero" slotunun blok listesinden
 * (heroBlocks) gelir — her blok Dinamik Render Motoru'yla
 * (heroBlockRenderers.jsx, type→component registry) çizilir. Liste boşsa
 * (henüz yapılandırılmamış) hiçbir şey render edilmez — sahte/placeholder
 * içerik üretilmez.
 */
export function OldHero({ genres, seasonCount, releaseYear }) {
  const rootRef = useRef(null);
  const figureRef = useRef(null);
  const [flip] = useState(() => readHeroFlip());
  const handoff = Boolean(flip);

  const hasCustomBlocks = heroBlocks.length > 0;
  const imageBlock = heroBlocks.find((b) => b.type === 'IMAGE');
  const ambientSrc = imageBlock?.content?.imageUrl;

  // Devir (FeaturedCarousel flip) klonunu kaldırma — poster≠key-art
  // olduğu için instant değil kısa bir crossfade (bkz. cinematic.js).
  useLayoutEffect(() => {
    if (!handoff) return undefined;
    const img = figureRef.current?.querySelector('img');
    if (!img) return undefined;

    let cancelled = false;
    const takeOver = () => {
      if (cancelled) return;
      const clone = document.querySelector('img[data-hero-flip]');
      const scrim = document.querySelector('div[data-hero-flip]');
      const drop = () => document.querySelectorAll('body > [data-hero-flip]').forEach((el) => el.remove());

      if (!clone || !scrim || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        drop();
        return;
      }

      gsap
        .timeline({ onComplete: drop })
        .to(clone, { opacity: 0, duration: 0.4, ease: 'power2.out' }, 0)
        .to(scrim, { opacity: 0, duration: 0.4, ease: 'power2.out' }, 0);
    };

    Promise.resolve()
      .then(() => (img.decode ? img.decode() : Promise.reject(new Error('no decode'))))
      .then(takeOver)
      .catch(() => {
        if (img.complete) takeOver();
        else {
          img.onload = takeOver;
          img.onerror = takeOver;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [handoff]);

  // Her blok KENDİ animation preset'ini taşır (bkz. Hero.blocks.json +
  // ANIMATION_PRESETS) — tek blanket tween yerine per-block uygulama.
  // gsap.context ile temizlik: hem normal unmount'ta hem (Risk #2, plan
  // dosyasında işaretli) Vite HMR ile Hero.blocks.json değiştiğinde
  // önceki tween'lerin revert edilip yeniden kurulmasını garantiler.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        heroBlocks.forEach((block) => {
          const target = figureRef.current?.querySelector(`[data-hero-block-id="${block.id}"]`);
          if (!target) return;

          if (handoff) {
            gsap.set(target, { opacity: 1, y: 0, yPercent: 0 });
            return;
          }

          const preset = block.animation?.preset ? ANIMATION_PRESETS[block.animation.preset] : null;
          if (!preset) return;
          preset.apply(target, block.animation.params, {
            scrollTrigger: { trigger: rootRef.current, start: 'top bottom', end: 'bottom top', scrub: true },
          });
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        const targets = figureRef.current?.querySelectorAll('[data-hero-block]');
        if (targets?.length) gsap.set(targets, { opacity: 1, y: 0, yPercent: 0 });
      });
    }, rootRef);

    return () => ctx.revert();
    // heroBlocks modül-seviyeli sabit (statik JSON import) — normal
    // render ömründe hiç değişmez, dependency olarak GEREKMEZ (oxlint).
    // Vite HMR, Hero.blocks.json değiştiğinde bu modülü YENİDEN
    // DEĞERLENDİRİP component'i taze bir closure'la kurar; bu effect de
    // o yeni kurulumda sıfırdan çalışır (Risk #2, plan dosyasında
    // işaretli — canlı doğrulama Task 7'de).
  }, [handoff]);

  const metaLine = [
    releaseYear,
    seasonCount ? `${seasonCount} Season${seasonCount > 1 ? 's' : ''}` : null,
    ...(genres ?? []),
  ]
    .filter(Boolean)
    .join(' · ');

  if (!hasCustomBlocks) return null;

  return (
    <section className={styles.hero} ref={rootRef}>
      {ambientSrc && (
        <div className={styles.hero__media} aria-hidden="true">
          <img className={styles.hero__ambient} src={ambientSrc} alt="" />
          <div className={styles.hero__overlay} />
        </div>
      )}

      <figure className={styles.hero__figure} ref={figureRef}>
        {heroBlocks.map((block) => (
          <HeroBlockRenderer key={block.id} block={block} context={{ metaLine }} />
        ))}
      </figure>
    </section>
  );
}
