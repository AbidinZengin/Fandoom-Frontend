// Bölüm sayfasının altındaki derin-analiz scrollytelling'inin veri erişim
// katmanı — GET /api/episodes/:id'in döndürdüğü düz `episodeBlocks[]`
// listesini sahne sahne gruplar (backend'deki "ardışık aynı sceneKey = tek
// sahne" deseni). Boş/yazılmamış bölümler için `null` döner — EpisodeBlocks
// hiç render edilmez. BreakingBad/HouseOfTheDragon EpisodeBlocks.data.js ile
// BİREBİR aynı — fetchEpisodeDetail production-agnostik (IT: Welcome to
// Derry bölümleri için de aynı uç).
import { fetchEpisodeDetail } from '../../../../../shared/api/productions';

// Ardışık aynı sceneKey'li bloklar TEK sahne oluşturur — liste zaten
// backend'de orderIndex sırasıyla geldiği için burada yeniden sıralanmaz.
function groupBlocksByScene(blocks) {
  const groups = [];
  let current = null;
  for (const block of blocks) {
    if (!current || current.key !== block.sceneKey) {
      current = { key: block.sceneKey, items: [] };
      groups.push(current);
    }
    current.items.push(block);
  }
  return groups;
}

// Sahne içindeki bloklar blockType'a göre EpisodeBlocks.jsx'in beklediği
// title/media/text/quote alanlarına dağıtılır. TEXT/LEAD_TEXT birden fazla
// olabildiği için diziye eklenir; diğerleri sahnede tekil kabul edilir.
function buildScene({ key, items }) {
  const scene = {
    id: key,
    tone: (items[0].tone ?? 'DEEP').toLowerCase(),
    pinned: items.some((block) => block.pinned),
    kicker: items.find((block) => block.sceneKicker)?.sceneKicker ?? '',
    text: [],
  };

  for (const block of items) {
    switch (block.blockType) {
      case 'TITLE':
        scene.title = { text: block.content, col: block.col, row: block.row };
        break;
      case 'MEDIA':
        scene.media = {
          url: block.mediaUrl,
          alt: block.mediaAlt,
          col: block.col,
          row: block.row,
          ratio: block.mediaRatio,
        };
        break;
      case 'QUOTE':
        scene.quote = { text: block.content, col: block.col, row: block.row };
        break;
      case 'TEXT':
      case 'LEAD_TEXT':
      default:
        scene.text.push({
          col: block.col,
          row: block.row,
          lead: block.blockType === 'LEAD_TEXT' ? true : undefined,
          paragraphs: block.content.split('\n\n'),
        });
    }
  }

  return scene;
}

// Bölüm değişse de aynı id'ye geri dönülürse (sezon oku ileri-geri) tekrar
// istek atmasın diye promise düzeyinde önbelleklenir — EpisodePage.data.js'
// teki `cached` deseninin aynısı.
const cache = new Map();

export function fetchEpisodeBlocks(episodeId) {
  if (!cache.has(episodeId)) {
    cache.set(
      episodeId,
      fetchEpisodeDetail(episodeId)
        .then((detail) => {
          if (!detail.episodeBlocks?.length) return null;
          return {
            kicker: detail.storyKicker,
            title: detail.storyTitle,
            thesis: detail.storyThesis,
            scenes: groupBlocksByScene(detail.episodeBlocks).map(buildScene),
          };
        })
        .catch((err) => {
          cache.delete(episodeId);
          throw err;
        })
    );
  }
  return cache.get(episodeId);
}
