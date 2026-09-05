import { fetchProductionDetail, fetchSeasonDetail } from '../../../shared/api/productions';

// Backend'de henüz "tüm sezon incelemelerini listele" diye toplu bir uç nokta
// yok (fetchSeasonDetail yalnız TEK sezon döner) — bu yüzden GEÇİCİ olarak
// FE'den bilinen dizi slug'ları tek tek gezilip seasonBlocks'u dolu olan
// sezonlar toplanır (kullanıcı kararı, 2026-09-05). Backend'e aggregate bir
// endpoint (ör. GET /api/reviews) eklenince bu dosya tek bir fetch çağrısına
// indirgenecek. game-of-thrones listede YOK — o dizi SeasonStory/"sezon
// incelemesi" desenine geçmedi (SeasonEpisodes/EpisodePage farklı mimari).
const REVIEW_SERIES_SLUGS = ['breaking-bad', 'house-of-the-dragon', 'severance', 'pluribus'];

export async function fetchSeasonReviews() {
  const seriesEntries = await Promise.all(
    REVIEW_SERIES_SLUGS.map(async (slug) => ({
      slug,
      series: await fetchProductionDetail('series', slug).catch(() => null),
    })),
  );

  const reviews = await Promise.all(
    seriesEntries.flatMap(({ slug, series }) => {
      if (!series?.seasons?.length) return [];
      return series.seasons.map(async (season) => {
        const detail = await fetchSeasonDetail(season.id).catch(() => null);
        if (!detail?.seasonBlocks?.length) return null;
        return {
          id: `${slug}-${season.seasonNumber}`,
          seriesSlug: slug,
          seriesTitle: series.title,
          seasonNumber: season.seasonNumber,
          title: detail.storyTitle || season.title,
          posterUrl: season.posterUrl,
        };
      });
    }),
  );

  return reviews.filter(Boolean);
}
