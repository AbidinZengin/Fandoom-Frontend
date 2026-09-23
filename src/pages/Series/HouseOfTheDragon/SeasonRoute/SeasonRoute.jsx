import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchProductionDetail } from '../../../../shared/api/productions';
import { armInPageNav } from '../../../../motion/cinematic';
import styles from './SeasonRoute.module.css';

const pad2 = (n) => String(n).padStart(2, '0');

// Breaking Bad SeasonRoute'un birebir kopyası (kullanıcı isteği). Backdrop:
// Demir Taht odası görseli, kullanıcı verdi, Cloudinary'e yüklendi
// (fandoom/home klasörü, BB'nin seasons-backdrop.jpg'siyle aynı desen).
// "focus" dek metni backend'in SeasonSummaryResponse.storyDek'inden gelir
// (Accept-Language'e göre TEK dile çözümlenmiş) — YEREL SeasonStory.data.js
// mock'una BİLEREK bağlanmaz, o hep İngilizce dönüyordu (dil değişince
// güncellenmiyordu, bkz. 2026-08-30 bug raporu).
const BACKDROP_URL = 'https://res.cloudinary.com/b0bc5njd/image/upload/v1787947117/fandoom/home/zv8n67jajopikhgheivi.jpg';

// Breaking Bad SeasonRoute'taki ArrowIcon ile birebir aynı.
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4.5" y1="12" x2="19" y2="12" />
      <polyline points="13.5 6.5 19.5 12 13.5 17.5" />
    </svg>
  );
}

export default function SeasonRoute() {
  const { t } = useTranslation();
  const [series, setSeries] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const pageRef = useRef(null);
  const trackRef = useRef(null);
  const focusRef = useRef(null);
  const isFirstActiveRender = useRef(true);

  useEffect(() => {
    let cancelled = false;
    fetchProductionDetail('series', 'house-of-the-dragon').then((data) => {
      if (!cancelled) setSeries(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const seasons = series?.seasons ?? [];
  const activeSeason = seasons[activeIndex] ?? null;

  useLayoutEffect(() => {
    if (!seasons.length) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from([`.${styles.kicker}`, `.${styles.title}`], {
          opacity: 0,
          y: 28,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: pageRef.current, start: 'top 55%', once: true },
        });

        // Soldan açığa çıkma (Severance portu) — kicker/title/kartlarla AYNI
        // fade in/out mantığı (opacity + scrollTrigger once), y yerine x.
        gsap.from(`.${styles.focus}`, {
          opacity: 0,
          x: -64,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: pageRef.current, start: 'top 45%', once: true },
        });

        // İmza "dalga" animasyonu (learned-rules #imza-dalga, Severance portu).
        gsap.from(trackRef.current.querySelectorAll(`.${styles.cardWrap}`), {
          opacity: 0,
          x: 140,
          y: 56,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: pageRef.current, start: 'top 45%', once: true },
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set([`.${styles.kicker}`, `.${styles.title}`, `.${styles.focus}`, `.${styles.cardWrap}`], {
          opacity: 1,
          y: 0,
          clearProps: 'transform',
        });
      });
    }, pageRef);

    const timerId = setTimeout(() => ScrollTrigger.refresh(), 250);

    return () => {
      clearTimeout(timerId);
      ctx.revert();
    };
  }, [seasons.length]);

  // Odak panelinin SOLDAN açığa çıkışı — ilk mount'ta yukarıdaki
  // scroll-trigger zaten aynı işi yaptığı için burada atlanıyor, sadece
  // activateSeason'ın tetiklediği SONRAKİ değişimlerde çalışır.
  useEffect(() => {
    if (isFirstActiveRender.current) {
      isFirstActiveRender.current = false;
      return;
    }
    if (!focusRef.current) return;
    gsap.fromTo(
      focusRef.current,
      { x: -64, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.45, ease: 'power3.out' }
    );
  }, [activeIndex]);

  // Kart hover/focus ile sezon değişince odak paneli geçiş yapar (Severance
  // portu): önceki sezon SAĞA kayıp kaybolur, yeni sezon SOLDAN açığa çıkar.
  const activateSeason = (i) => {
    if (i === activeIndex) return;
    const focus = focusRef.current;
    if (!focus) {
      setActiveIndex(i);
      return;
    }
    gsap.to(focus, {
      x: 80,
      opacity: 0,
      duration: 0.28,
      ease: 'power2.in',
      onComplete: () => setActiveIndex(i),
    });
  };

  if (!series) return null;

  const scrollByCard = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector(`.${styles.cardWrap}`);
    const step = (card?.offsetWidth ?? 220) + 24;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section className={styles.page} ref={pageRef}>
      {BACKDROP_URL && <img className={styles.backdrop} src={BACKDROP_URL} alt="" aria-hidden="true" />}
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.header}>
        <p className={styles.kicker}>{t('series.seasonsHeading')}</p>
        <h2 className={styles.title}>{t('series.everySeasonEveryEpisode')}</h2>
      </div>

      <div className={styles.bottom}>
        {activeSeason && (
          <div className={styles.focus} ref={focusRef}>
            <h3 className={styles.focus__title}>{activeSeason.title}</h3>
            {activeSeason.storyDek && <p className={styles.focus__dek}>{activeSeason.storyDek}</p>}
            <Link
              to={`/series/house-of-the-dragon/seasons/${activeSeason.seasonNumber}`}
              onClick={() => armInPageNav()}
              className={styles.focus__cta}
            >
              {t('series.exploreSeasonCta')} <ArrowIcon />
            </Link>
          </div>
        )}

        <div className={styles.carousel}>
          <div className={styles.track} ref={trackRef}>
            {seasons.map((season, i) => (
              <div className={styles.cardWrap} key={season.id}>
                <button
                  type="button"
                  className={styles.card}
                  aria-label={t('series.seasonLabel', { number: season.seasonNumber, title: season.title })}
                  aria-current={i === activeIndex || undefined}
                  onMouseEnter={() => activateSeason(i)}
                  onFocus={() => activateSeason(i)}
                  onClick={() => activateSeason(i)}
                >
                  {season.posterUrl && (
                    <img className={styles.card__image} src={season.posterUrl} alt="" loading="lazy" />
                  )}
                  <span className={styles.card__number}>{pad2(season.seasonNumber)}</span>
                </button>
                <span className={styles.card__caption}>{season.title}</span>
              </div>
            ))}
          </div>

          <div className={styles.navRow}>
            <button
              type="button"
              className={styles.navArrow}
              data-dir="left"
              onClick={() => scrollByCard(-1)}
              aria-label={t('common.previous')}
            >
              <ArrowIcon />
            </button>
            <button type="button" className={styles.navArrow} onClick={() => scrollByCard(1)} aria-label={t('common.next')}>
              <ArrowIcon />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
