import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchProductionDetail } from '../../../../shared/api/productions';
import { armInPageNav } from '../../../../motion/cinematic';
import styles from './SeasonRoute.module.css';

const pad2 = (n) => String(n).padStart(2, '0');

// Tam arka plan görseli — kullanıcının verdiği asset (çöl gün batımında RV).
const BACKDROP_URL = '/src/assets/breaking-bad/seasons-backdrop.jpg';

// Kullanıcının referans verdiği Flaticon "arrow-small-right" (uicons rr)
// ikonunun görsel stiline sadık, ÖZGÜN çizim — yuvarlak uçlu/köşeli
// çizgi+ok başı (ilk deneme strokeWidth 3.5 "kalın olmuş" diye
// düzeltildi, 2.5'e indirildi). Flaticon dosyası birebir indirilmedi
// (ücretsiz katman attribution gerektiriyor, prod site için uygun değil) —
// aynı görsel, kendi SVG'imizle. Explore butonunda ve carousel navigasyon
// oklarında ortak kullanılır, `dir="left"` için CSS'te (`.navArrow[data-dir=
// 'left'] svg`) yatayda aynalanır.
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4.5" y1="12" x2="19" y2="12" />
      <polyline points="13.5 6.5 19.5 12 13.5 17.5" />
    </svg>
  );
}

// DÜZELTME (manuel, 2026-08-20, 3. tur): kullanıcının Dribbble "Seasonal
// Itineraries" referansına (travel sitesi analizi, bu oturumun başındaki
// research) BİREBİR sadık yeniden tasarım — önceki iki tur (liste+önizleme
// paneli, sonra hover+blur-backdrop paneli) tamamen terk edildi. Artık tek
// tam-genişlik bölüm: sol üstte kicker+büyük başlık, sol altta AKTİF
// sezonun başlığı+açıklaması+outline "Explore Season" butonu, sağda yatay
// kaydırmalı, beyaz ince çerçeveli (arka plan dolgusu YOK, sadece görsel+
// kenarlık) kart carousel'i + altında iki dairesel ok. Kart üstüne HOVER/
// focus sol metni günceller (bir önceki turdan taşınan kural); navigasyon
// yalnız Explore butonunda. Kartların kendisi (Highlights emsali: "TÜM
// kartlar normal parlaklıkta durur, ayırt edici tek şey metin overlay'i")
// aktif/pasif farkı GÖSTERMEZ — ayırt edici tek şey sol paneldeki metindir.
export default function SeasonRoute() {
  const { t } = useTranslation();
  const [series, setSeries] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const pageRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchProductionDetail('series', 'breaking-bad').then((data) => {
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

      // DÜZELTME (kullanıcı kararı, 2026-09-06): scroll-snap artık İSTENİYOR
      // (BreakingBad'e ÖZEL istisna — bkz. BreakingBad.jsx body snap'i).
      // Önceki once:true y-translate reveal + scrub-parallax + scrub-fade
      // YERİNE referans videoya sadık TEKRARLANAN desen: sahne aktif olunca
      // başlık→kart grubu stagger opacity fade-in (y/translate YOK, pozisyon
      // sabit), arka planda yavaş Ken-Burns mikro-zoom (scale 1→1.02) "hold"
      // boyunca sürer; çıkınca tersine sarar, tekrar girince AYNEN tekrarlanır.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: pageRef.current,
            start: 'top center',
            end: 'bottom center',
            toggleActions: 'play reverse play reverse',
          },
        });

        tl.from([`.${styles.kicker}`, `.${styles.title}`], {
          opacity: 0,
          duration: 0.28,
          ease: 'power1.out',
          stagger: 0.06,
        }).from(
          [`.${styles.focus}`, ...trackRef.current.querySelectorAll(`.${styles.cardWrap}`)],
          { opacity: 0, duration: 0.6, ease: 'power1.out', stagger: 0.08 },
          '-=0.05'
        );

        gsap.fromTo(
          `.${styles.backdrop}`,
          { scale: 1 },
          {
            scale: 1.02,
            duration: 6,
            ease: 'power1.inOut',
            scrollTrigger: {
              trigger: pageRef.current,
              start: 'top center',
              end: 'bottom center',
              toggleActions: 'play reverse play reverse',
            },
          }
        );
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set([`.${styles.kicker}`, `.${styles.title}`, `.${styles.focus}`, `.${styles.cardWrap}`], {
          opacity: 1,
          clearProps: 'opacity',
        });
        gsap.set(`.${styles.backdrop}`, { scale: 1, clearProps: 'transform' });
      });
    }, pageRef);

    const timerId = setTimeout(() => ScrollTrigger.refresh(), 250);

    return () => {
      clearTimeout(timerId);
      ctx.revert();
    };
  }, [seasons.length]);

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
      {BACKDROP_URL && (
        <div className={styles.backdropFrame}>
          <img className={styles.backdrop} src={BACKDROP_URL} alt="" aria-hidden="true" />
        </div>
      )}
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.header}>
        <p className={styles.kicker}>{t('series.seasonsHeading')}</p>
        <h2 className={styles.title}>{t('series.everySeasonEveryEpisode')}</h2>
      </div>

      <div className={styles.bottom}>
        {activeSeason && (
          <div className={styles.focus}>
            <h3 className={styles.focus__title}>{activeSeason.title}</h3>
            {activeSeason.storyDek && <p className={styles.focus__dek}>{activeSeason.storyDek}</p>}
            <Link
              to={`/series/breaking-bad/seasons/${activeSeason.seasonNumber}`}
              onClick={() => armInPageNav()}
              className={styles.focus__cta}
            >
              {t('series.exploreSeasonCta')} <ArrowIcon />
            </Link>
          </div>
        )}

        <div className={styles.carousel}>
          <div className={styles.track} ref={trackRef}>
            {/* Tüm sezonlar sırayla, 1'den başlayarak — carousel'in EKRANDAKİ
                başlangıç konumu (.focus'un genişletilmiş genişliği yüzünden)
                sağa kaymış olsa da kart sırası/DOM'u normal, hiçbir kart
                gizlenmiyor/kaydırılmıyor (kullanıcı düzeltmesi). */}
            {seasons.map((season, i) => (
              <div className={styles.cardWrap} key={season.id}>
                <button
                  type="button"
                  className={styles.card}
                  aria-label={t('series.seasonLabel', { number: season.seasonNumber, title: season.title })}
                  aria-current={i === activeIndex || undefined}
                  onMouseEnter={() => setActiveIndex(i)}
                  onFocus={() => setActiveIndex(i)}
                  onClick={() => setActiveIndex(i)}
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
