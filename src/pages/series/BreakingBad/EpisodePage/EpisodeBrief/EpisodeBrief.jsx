import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { still } from '../EpisodePage.data';
import styles from './EpisodeBrief.module.css';

gsap.registerPlugin(ScrollTrigger);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2011-04-17" → "17 Apr 2011". Date yerine string parse: airDate saat
// taşımayan bir tarih (LocalDate), new Date() ile UTC'ye çevrilince
// kullanıcının saat dilimine göre bir gün kayabiliyordu.
function formatAirDate(isoDate) {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

const pad2 = (n) => String(n).padStart(2, '0');

/**
 * Hero'nun altındaki "karar bloğu" — GoT'un EpisodeBrief'inin BİREBİR
 * aynısı (kullanıcı kararı, 2026-08). TEK kasıtlı fark: platform-marka
 * rozeti (GoT'ta HBO Max, kullanıcının verdiği gerçek icons8 asset'i) BB
 * için YOK — AMC'nin eşdeğer bir logo asset'i verilmedi, sahte/placeholder
 * logo üretilmedi (learned-rules [asset]). IMDb puanı gerçek veriyle var
 * olduğu sürece aynen render edilir.
 *
 * Tipografi: başlık + gövde marka fontu Montserrat'ta (GoT'un özel display
 * fontu burada yok, zaten yalnız GoT'a ait).
 */
export function EpisodeBrief({ episode, seasonNumber, genres, rating }) {
  const { t } = useTranslation();
  const hasEpisode = Boolean(episode);
  const rootRef = useRef(null);
  const figureRef = useRef(null);
  const headerRef = useRef(null);
  const synopsisRef = useRef(null);
  const metaRowRef = useRef(null);

  // Section görünüme girerken TEK SEFERLİK fade+rise reveal'i (GoT Hero'nun
  // karakteri — imza-dalga x-kayması DEĞİL), başlıktan içeriğe kademeli.
  //
  // Önceki scrub'lı "gel-git" timeline'ı KALDIRILDI: hero artık cover card →
  // fixed header dönüşümünü scroll'un ilk 90vh'sinde sürüyor ve bu blok tam o
  // aralıkta görünüme giriyor. İki scroll-bağlı katman üst üste binince blok,
  // hero küçülürken sönüp geri geliyordu. Tek yönlü giriş çakışmayı yapısal
  // olarak bitirir — dönüşüm boyunca sahnede tek bir scroll-bağlı hareket
  // kalır (hero'nunki).
  useLayoutEffect(() => {
    if (!rootRef.current) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      const items = [
        headerRef.current,
        figureRef.current,
        synopsisRef.current,
        metaRowRef.current,
      ].filter(Boolean);

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(items, {
          opacity: 0,
          y: 28,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          clearProps: 'opacity,transform',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 80%',
            once: true,
          },
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(items, { opacity: 1, x: 0, y: 0 });
      });
    }, rootRef);

    return () => ctx.revert();
  }, [hasEpisode]);

  if (!episode) return null;

  const airDate = formatAirDate(episode.airDate);
  const meta = [
    t('series.seasonMeta', { number: pad2(seasonNumber) }),
    t('series.episodeMeta', { number: pad2(episode.episodeNumber) }),
    episode.durationMinutes ? t('series.minutesShort', { count: episode.durationMinutes }) : null,
    airDate,
  ].filter(Boolean);

  return (
    <section className={styles.brief} id="episode-brief" ref={rootRef}>
      <div className={styles.brief__inner}>
        {episode.stillImageUrl && (
          <figure className={styles.brief__figure} ref={figureRef}>
            <img
              className={styles.brief__image}
              src={still(episode.stillImageUrl, 900)}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </figure>
        )}

        <div className={styles.brief__body}>
          <header className={styles.brief__header} ref={headerRef}>
            <h2 className={styles.brief__title}>{episode.title}</h2>
          </header>

          {episode.synopsis && (
            <p className={styles.brief__synopsis} ref={synopsisRef}>
              {episode.synopsis}
            </p>
          )}

          <p className={styles.brief__meta}>{meta.join(' · ')}</p>

          {/* Genre backend'de dizi (production) seviyesinde tutuluyor,
              bölümün kendi alanı YOK — isimler EpisodePage'te
              resolveGenreNames ile çözülüp prop'la gelir. Puan AYRI yıldızlı
              değer olarak IMDb rozetinin ÖNÜNDE durur. Puan yoksa değer/
              yıldız/IMDb grubu hiç basılmaz — sahte/boş rozet gösterilmez. */}
          <div className={styles.brief__metaRow} ref={metaRowRef}>
            <div className={styles.brief__genres}>
              {genres?.map((genre) => (
                <span key={genre} className={styles.brief__genrePill}>
                  {genre}
                </span>
              ))}
            </div>

            {rating && (
              <div className={styles.brief__badges}>
                <span className={styles.brief__rating} aria-label={t('series.imdbRatingAriaLabel', { rating })}>
                  <span className={styles.brief__ratingValue}>{rating}</span>
                  <span className={styles.brief__ratingStar} aria-hidden="true">
                    ★
                  </span>
                  <span className={styles.brief__imdb} aria-hidden="true">
                    IMDB
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
