import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Footer } from '../../../../components/Footer/Footer';
import { armInPageNav } from '../../../../motion/cinematic';
import { fetchProductionDetail, fetchSeasonDetail, theme } from './SeasonDetail.data';
import { getSeasonStory } from './SeasonStory/SeasonStory.data';
import { SeasonStory } from './SeasonStory/SeasonStory';
import { EpisodeGrid } from './EpisodeGrid/EpisodeGrid';
import styles from './SeasonDetail.module.css';

const pad2 = (n) => String(n).padStart(2, '0');

// Hero'daki "trust bar" istatistiği — uydurma alan yok, sadece zaten çekilen
// episodes[].airDate'ten türetilen gerçek yayın yılı aralığı.
const airYearRange = (episodes) => {
  if (!episodes?.length) return null;
  const years = episodes.map((ep) => new Date(ep.airDate).getFullYear()).filter((y) => !Number.isNaN(y));
  if (!years.length) return null;
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? String(min) : `${min}–${max}`;
};

// Sezonun kendi sayfası — SeasonRoute'taki (BreakingBad ana sayfası) sezon
// satırından tıklanınca açılır. Kullanıcı kararıyla (2026-08) SeasonStory
// gerçek bir TV inceleme yazısı formatına/sesine geçti (referans: House of
// the Dragon S3 incelemesi örneği) — bkz. SeasonStory.jsx/.data.js. Statik
// iskelet — motion (sis geçişi, crossfade) bu turda YOK, component-dev
// aşaması; sonraki tur motion-expert'e ait.
export default function SeasonDetail() {
  const { seasonNumber: seasonNumberParam } = useParams();
  const navigate = useNavigate();
  const seasonNumber = Number(seasonNumberParam);

  const [series, setSeries] = useState(null);
  const [episodes, setEpisodes] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchProductionDetail('series', 'breaking-bad')
      .then((data) => {
        if (!cancelled) setSeries(data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!series) return undefined;
    const season = series.seasons.find((s) => s.seasonNumber === seasonNumber);
    if (!season) {
      setNotFound(true);
      return undefined;
    }
    let cancelled = false;
    setEpisodes(null);
    fetchSeasonDetail(season.id).then((detail) => {
      if (!cancelled) setEpisodes(detail.episodes);
    });
    return () => {
      cancelled = true;
    };
  }, [series, seasonNumber]);

  // learned-rules: "Yapım sayfaları TAM TEMA kurar" — BreakingBad.jsx/GoT
  // EpisodePage ile aynı davranış, zemin siyahta kalır.
  useEffect(() => {
    if (!series) return undefined;
    const root = document.documentElement;
    const prev = {
      bg: root.style.getPropertyValue('--bg'),
      accent: root.style.getPropertyValue('--accent'),
      cardBg: root.style.getPropertyValue('--card-bg'),
    };

    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--card-bg', theme.cardBg);

    return () => {
      root.style.setProperty('--bg', prev.bg || '#050505');
      root.style.setProperty('--accent', prev.accent || '#a02cd8');
      root.style.setProperty('--card-bg', prev.cardBg || '#101012');
    };
  }, [series]);

  if (notFound) {
    return (
      <>
        <div className={styles.notfound}>
          <h1 className={styles.notfound__title}>Season not found.</h1>
        </div>
        <Footer />
      </>
    );
  }

  if (!series) return null;

  const currentSeason = series.seasons.find((s) => s.seasonNumber === seasonNumber);
  if (!currentSeason) return null;

  const seasonIdx = series.seasons.findIndex((s) => s.seasonNumber === seasonNumber);
  const prevSeason = series.seasons[seasonIdx - 1];
  const nextSeason = series.seasons[seasonIdx + 1];
  const story = getSeasonStory(seasonNumber);

  const goToSeason = (target) => {
    if (!target) return;
    armInPageNav();
    navigate(`/series/breaking-bad/seasons/${target.seasonNumber}`);
  };

  const yearRange = airYearRange(episodes);

  return (
    <>
      {/* Sadece bu sayfaya özel açık/sıcak "travel landing" teması (kullanıcı
          kararı, referans: Dribbble #24876957) — Navbar/Footer site standardı
          koyu chrome'da kalır, bkz. .page token seti (SeasonDetail.module.css). */}
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.hero__media} aria-hidden="true">
            {currentSeason.posterUrl && <img className={styles.hero__image} src={currentSeason.posterUrl} alt="" />}
            <div className={styles.hero__overlay} />
          </div>

          <div className={styles.hero__content}>
            <button type="button" className={styles.hero__back} onClick={() => navigate('/series/breaking-bad')}>
              &#8249; Seasons
            </button>
            <p className={styles.hero__kicker}>{`SEASON ${pad2(seasonNumber)}`}</p>
            <h1 className={styles.hero__title}>{currentSeason.title}</h1>
            {story?.dek && <p className={styles.hero__dek}>{story.dek}</p>}

            {(episodes?.length || yearRange) && (
              <div className={styles.hero__stats}>
                {episodes?.length ? <span className={styles.hero__stat}>{episodes.length} Bölüm</span> : null}
                {episodes?.length && yearRange ? <span className={styles.hero__statDivider} aria-hidden="true" /> : null}
                {yearRange ? <span className={styles.hero__stat}>{yearRange}</span> : null}
              </div>
            )}

            <div className={styles.hero__nav}>
              <button
                type="button"
                className={styles.hero__arrow}
                onClick={() => goToSeason(prevSeason)}
                disabled={!prevSeason}
                aria-label="Previous season"
              >
                &#8249;
              </button>
              <button
                type="button"
                className={styles.hero__arrow}
                onClick={() => goToSeason(nextSeason)}
                disabled={!nextSeason}
                aria-label="Next season"
              >
                &#8250;
              </button>
            </div>
          </div>

          <a href="#episodes" className={styles.hero__cta}>
            Bölümleri Keşfet ›
          </a>
        </section>

        <div className={styles.content}>
          <div className={styles.content__main}>
            <SeasonStory seasonNumber={seasonNumber} episodes={episodes} />
          </div>

          <aside className={styles.content__sidebar} id="episodes">
            <EpisodeGrid episodes={episodes} seasonNumber={seasonNumber} />

            {/* Blog özelliği henüz yok (kullanıcı: "şuan blogu yok sonra
                olacak") — sahte veri doldurulmaz, bekleme iskeleti durur. */}
            <div className={styles.related}>
              <p className={styles.related__heading}>Featured</p>
              <div className={styles.related__placeholder} aria-hidden="true">
                <p className={styles.related__note}>İlgili blog içeriği yakında burada olacak.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </>
  );
}
