// Game of Thrones intro "Dragon Journey" içerik seam'i — GET
// /api/cms/pages/SERIES_DETAIL'a bağlı. Her waypoint (image/title/body) ve
// her stat (value/label) aynı orderIndex'i paylaşan ayrı CMS kayıtlarından
// groupBySection ile birleştirilir (bkz. fandoom-backend CLAUDE.md).
import { fetchPageContent, groupBySection, findBySection } from '../../../../shared/api/cms';

const STAT_FIELDS = { INTRO_STAT_VALUE: 'value', INTRO_STAT_LABEL: 'label' };
const BEAT_FIELDS = { INTRO_BEAT_IMAGE: 'image', INTRO_BEAT_TITLE: 'title', INTRO_BEAT_BODY: 'body' };

export async function fetchIntroContent(entityId) {
  const items = await fetchPageContent('SERIES_DETAIL', entityId);
  return {
    eyebrow: findBySection(items, 'INTRO_EYEBROW'),
    headline: findBySection(items, 'INTRO_HEADLINE'),
    closing: findBySection(items, 'INTRO_CLOSING'),
    stats: groupBySection(items, STAT_FIELDS),
    waypoints: groupBySection(items, BEAT_FIELDS),
  };
}
