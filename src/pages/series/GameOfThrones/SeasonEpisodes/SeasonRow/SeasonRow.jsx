import { useEffect, useRef, useState } from 'react';
import { LocalizedLink as Link } from '../../../../../shared/i18n/LocalizedLink';
import gsap from 'gsap';
import { fetchSeasonDetail } from '../SeasonEpisodes.data';
import styles from './SeasonRow.module.css';

const formatDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Inline accordion satırı: ilk açılışta bölüm listesi lazy-fetch edilir ve
// sonraki aç/kapatlarda tekrar istenmez (episodes state'i kalıcı önbellek).
// Chevron dönüşü + backdrop tint fade'i saf CSS transition'dır (transform/
// opacity, bkz. SeasonRow.module.css); body'nin height:auto açılımı gerçek
// bir reflow gerektirdiği için (altındaki satırlar yer değiştirir) motion-
// expert kuralının bilinçli istisnası olarak GSAP ile yapılır.
export function SeasonRow({ season, backdropImage, isOpen, onToggle }) {
  const [episodes, setEpisodes] = useState(null);
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef(null);
  const innerRef = useRef(null);
  const isFirstRender = useRef(true);
  const isOpenRef = useRef(isOpen);

  // Aç/kapa: yükseklik + içerik fade+rise birlikte, kapanışta içerik önce
  // söner (metin sıkışırken görünmez) sonra kutu kapanır — "Complete Cycles".
  useEffect(() => {
    isOpenRef.current = isOpen;
    const el = bodyRef.current;
    const inner = innerRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      gsap.set(el, { height: isOpen ? 'auto' : 0 });
      gsap.set(inner, { opacity: isOpen ? 1 : 0, y: isOpen ? 0 : 10 });
      return undefined;
    }

    gsap.killTweensOf([el, inner]);
    if (reduced) {
      gsap.set(el, { height: isOpen ? 'auto' : 0 });
      gsap.set(inner, { opacity: isOpen ? 1 : 0, y: 0 });
    } else if (isOpen) {
      gsap
        .timeline()
        .to(el, { height: 'auto', duration: 0.55, ease: 'power2.out' }, 0)
        .to(inner, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.12);
    } else {
      gsap
        .timeline()
        .to(inner, { opacity: 0, y: 10, duration: 0.2, ease: 'power1.in' }, 0)
        .to(el, { height: 0, duration: 0.4, ease: 'power2.in' }, 0.08);
    }

    return () => gsap.killTweensOf([el, inner]);
  }, [isOpen]);

  // Bölümler async geldiğinde (fetch loading placeholder'dan sonra) kutu
  // zaten 'auto' yüksekliğe kilitlenmiş olur — yeni içerik gelince yeniden
  // ölç ve YUMUŞAK büyü, aksi halde içerik render olunca kutu anlık
  // sıçrardı (kullanıcının "kasıyor" dediği asıl sebep buydu).
  useEffect(() => {
    if (!isOpenRef.current || episodes === null) return undefined;
    const el = bodyRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.killTweensOf(el);
    if (reduced) {
      gsap.set(el, { height: 'auto' });
    } else {
      gsap.fromTo(el, { height: el.offsetHeight }, { height: 'auto', duration: 0.45, ease: 'power2.out' });
    }
    return () => gsap.killTweensOf(el);
  }, [episodes]);

  const handleToggle = () => {
    onToggle();
    if (episodes === null && !loading) {
      setLoading(true);
      fetchSeasonDetail(season.id).then((detail) => {
        setEpisodes(detail.episodes);
        setLoading(false);
      });
    }
  };

  return (
    <div className={styles.row} data-open={isOpen || undefined} data-row>
      <button
        type="button"
        className={styles.row__header}
        onClick={handleToggle}
        aria-expanded={isOpen}
      >
        {/* Poster yoksa (backend'de posterUrl null) ne thumbnail ne tint
            render edilir — filler/placeholder görsel kullanılmaz. */}
        {backdropImage && (
          <>
            <span
              className={styles.row__backdrop}
              style={{ backgroundImage: `url(${backdropImage})` }}
              aria-hidden="true"
            />
            {/* loading="lazy" görsel viewport'a yaklaşana dek isteği ertelediği
                için hızlı scroll'da bir kare boş görünebilir (veri/URL sorunu
                DEĞİL — Cloudinary/DB tarafı sağlam) — yüklenince fade-in ile
                belirir, öncesinde boşluk sabit durur (learned-rules). */}
            <img
              className={styles.row__poster}
              src={backdropImage}
              alt=""
              loading="lazy"
              decoding="async"
              onLoad={(e) => {
                e.currentTarget.dataset.loaded = 'true';
              }}
            />
          </>
        )}
        <span className={styles.row__number}>{String(season.seasonNumber).padStart(2, '0')}</span>
        <span className={styles.row__titleBlock}>
          <span className={styles.row__title}>{season.title}</span>
          {episodes && <span className={styles.row__meta}>{episodes.length} Episodes</span>}
        </span>
        <span className={styles.row__chevron} aria-hidden="true">
          &#9662;
        </span>
      </button>

      <div className={styles.row__body} ref={bodyRef}>
        <div className={styles.row__bodyInner} ref={innerRef}>
          {loading && <p className={styles.row__status}>Loading episodes…</p>}
          {episodes?.map((ep) => {
            const href = `/series/game-of-thrones/seasons/${season.seasonNumber}/episodes/${ep.episodeNumber}`;
            return (
              <Link
                to={href}
                key={ep.id}
                className={styles.episode}
                data-has-image={ep.stillImageUrl ? '' : undefined}
              >
                {/* stillImageUrl yoksa (backend null) ne görsel ne scrim
                    render edilir — filler/placeholder kullanılmaz. Varsa
                    TAM ARKA PLAN olur (sol thumbnail değil). */}
                {ep.stillImageUrl && (
                  <>
                    <img
                      className={styles.episode__bg}
                      src={ep.stillImageUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onLoad={(e) => {
                        e.currentTarget.dataset.loaded = 'true';
                      }}
                    />
                    <div className={styles.episode__scrim} aria-hidden="true" />
                  </>
                )}
                <span className={styles.episode__number}>{String(ep.episodeNumber).padStart(2, '0')}</span>
                <div className={styles.episode__body}>
                  <h4 className={styles.episode__title}>{ep.title}</h4>
                  <p className={styles.episode__meta}>
                    {formatDate(ep.airDate)} · {ep.durationMinutes} min
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
