import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedNavigate as useNavigate } from '../../../../shared/i18n/useLocalizedNavigate';
import { Footer } from '../../../../components/Footer/Footer';
import { RelatedContent } from '../../../../components/RelatedContent/RelatedContent';
import { armInPageNav } from '../../../../motion/cinematic';
import { fetchProductionDetail, fetchSeasonDetail, getRelatedBlogs, theme } from './SeasonDetail.data';
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

// Sezonun kendi sayfası — BreakingBad/SeasonDetail/SeasonDetail.jsx ile
// BİREBİR aynı (kullanıcı kararı: bu artık yapım-sezon detay sayfaları için
// standart imza şablonu — sadece slug/route/theme yapıma göre değişir).
// Statik iskelet — motion (sis geçişi, crossfade) bu turda YOK.
export default function SeasonDetail() {
  const { t } = useTranslation();
  const { seasonNumber: seasonNumberParam } = useParams();
  const navigate = useNavigate();
  const seasonNumber = Number(seasonNumberParam);

  const [series, setSeries] = useState(null);
  const [seasonDetail, setSeasonDetail] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [relatedBlogs, setRelatedBlogs] = useState(null);
  const episodes = seasonDetail?.episodes ?? null;

  useEffect(() => {
    let cancelled = false;
    fetchProductionDetail('series', 'house-of-the-dragon')
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
    setSeasonDetail(null);
    fetchSeasonDetail(season.id).then((detail) => {
      if (!cancelled) setSeasonDetail(detail);
    });
    return () => {
      cancelled = true;
    };
  }, [series, seasonNumber]);

  useEffect(() => {
    if (!seasonNumber) return undefined;
    let cancelled = false;
    setRelatedBlogs(null);
    getRelatedBlogs({ seasonNumber })
      .then((items) => {
        if (!cancelled) setRelatedBlogs(items);
      })
      .catch(() => {
        if (!cancelled) setRelatedBlogs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [seasonNumber]);

  // learned-rules: "Yapım sayfaları TAM TEMA kurar."
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
          <h1 className={styles.notfound__title}>{t('common.seasonNotFound')}</h1>
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

  const goToSeason = (target) => {
    if (!target) return;
    armInPageNav();
    navigate(`/series/house-of-the-dragon/seasons/${target.seasonNumber}`);
  };

  const yearRange = airYearRange(episodes);

  return (
    <>
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.hero__media} aria-hidden="true">
            {currentSeason.posterUrl && <img className={styles.hero__image} src={currentSeason.posterUrl} alt="" />}
            <div className={styles.hero__overlay} />
          </div>

          <div className={styles.hero__content}>
            <button
              type="button"
              className={styles.hero__back}
              onClick={() => navigate('/series/house-of-the-dragon')}
            >
              &#8249; {t('series.seasonsHeading')}
            </button>
            <p className={styles.hero__kicker}>{t('series.seasonMeta', { number: pad2(seasonNumber) })}</p>
            <h1 className={styles.hero__title}>{currentSeason.title}</h1>
            {seasonDetail?.storyDek && <p className={styles.hero__dek}>{seasonDetail.storyDek}</p>}

            {(episodes?.length || yearRange) && (
              <div className={styles.hero__stats}>
                {episodes?.length ? (
                  <span className={styles.hero__stat}>{t('series.episodesCount', { count: episodes.length })}</span>
                ) : null}
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
                aria-label={t('series.previousSeason')}
              >
                &#8249;
              </button>
              <button
                type="button"
                className={styles.hero__arrow}
                onClick={() => goToSeason(nextSeason)}
                disabled={!nextSeason}
                aria-label={t('series.nextSeason')}
              >
                &#8250;
              </button>
            </div>
          </div>

          <a href="#episodes" className={styles.hero__cta}>
            {t('series.exploreEpisodesCta')}
          </a>
        </section>

        <div className={styles.content}>
          <div className={styles.content__main}>
            <SeasonStory
              storyKicker={seasonDetail?.storyKicker}
              storyTitle={seasonDetail?.storyTitle}
              seasonBlocks={seasonDetail?.seasonBlocks}
              episodes={episodes}
            />
          </div>

          <aside className={styles.content__sidebar} id="episodes">
            <EpisodeGrid episodes={episodes} seasonNumber={seasonNumber} />
          </aside>
        </div>

        <RelatedContent items={relatedBlogs} />
      </div>

      <Footer />
    </>
  );
}
