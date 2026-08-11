// Highlights'ın içerik seam'i (eski adıyla TabExhibit) — GET
// /api/cms/pages/SERIES_DETAIL'a bağlı.
// Her tab (image/label) aynı orderIndex'i paylaşan iki ayrı CMS kaydından
// groupBySection ile birleştirilir; rota (`to`) EXHIBIT_ITEM_LABEL kaydının
// linkUrl alanında tutulur (groupBySection bunu otomatik `labelLinkUrl`
// olarak ekler — bkz. fandoom-backend CLAUDE.md).
import { fetchPageContent, groupBySection, findBySection } from '../../../../shared/api/cms';

const FIELDS = {
  EXHIBIT_ITEM_IMAGE: 'image',
  EXHIBIT_ITEM_LABEL: 'label',
};

// GEÇİCİ mock veri: CMS'te kart başlığı/açıklaması için ayrı bir alan yok
// (EXHIBIT_ITEM_LABEL sadece kısa etiket taşır) — kullanıcı kararıyla
// backend'e alan istenene kadar burada sabit editöryel metinle dolduruluyor
// (bkz. learned-rules "Highlights" bölümü). Anahtar CMS etiketiyle eşleşir;
// eşleşmeyen/yeni bir etiket gelirse başlık olarak etiketin kendisi kullanılır,
// açıklama boş kalır (kırılmaz fallback — sayfa çökmez, sadece açıklama sönük).
const MOCK_COPY = {
  'Seasons — Episodes': {
    title: 'Nine Seasons. One Throne.',
    description:
      'Follow every battle, betrayal and broken vow across the complete run of Game of Thrones.',
  },
  Characters: {
    title: 'The Players of the Game',
    description: 'Kings, queens, knights and pretenders — meet the ones who shaped Westeros.',
  },
  Westeros: {
    title: 'A Continent at War',
    description: 'Chart the Seven Kingdoms, from the Wall to Dorne, and the houses that rule them.',
  },
  Theories: {
    title: 'What the Books Left Unsaid',
    description: "The fandom's sharpest theories on prophecies, parentage and the fate of the realm.",
  },
  Blogs: {
    title: 'Deep Dives, Delivered',
    description: 'Long-form essays and analysis on the lore, craft and legacy of the series.',
  },
  News: {
    title: 'From the Front Lines',
    description: 'The latest announcements, casting news and behind-the-scenes updates.',
  },
};

function withMockCopy(item) {
  const copy = MOCK_COPY[item.label];
  return { ...item, title: copy?.title ?? item.label, description: copy?.description ?? '' };
}

export async function fetchExhibitContent(entityId) {
  const items = await fetchPageContent('SERIES_DETAIL', entityId);
  const tabItems = groupBySection(items, FIELDS);

  // "Westeros" tabının linkUrl'i backend CMS kaydında hâlâ placeholder
  // (/series) — WorldMap route'u ayrılınca gerçek hedefe burada override
  // edilir (backend kaydı düzeltilene kadar).
  const westeros = tabItems.find((item) => item.label === 'Westeros');
  if (westeros) westeros.labelLinkUrl = '/series/game-of-thrones/westeros';

  return {
    title: findBySection(items, 'EXHIBIT_TITLE'),
    items: tabItems.map(withMockCopy),
  };
}
