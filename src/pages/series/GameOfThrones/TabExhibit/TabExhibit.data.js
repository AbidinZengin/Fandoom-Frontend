// TabExhibit'in içerik seam'i — GET /api/cms/pages/SERIES_DETAIL'a bağlı.
// Her tab (image/label) aynı orderIndex'i paylaşan iki ayrı CMS kaydından
// groupBySection ile birleştirilir; rota (`to`) EXHIBIT_ITEM_LABEL kaydının
// linkUrl alanında tutulur (groupBySection bunu otomatik `labelLinkUrl`
// olarak ekler — bkz. fandoom-backend CLAUDE.md).
import { fetchPageContent, groupBySection, findBySection } from '../../../../shared/api/cms';

const FIELDS = {
  EXHIBIT_ITEM_IMAGE: 'image',
  EXHIBIT_ITEM_LABEL: 'label',
};

export async function fetchExhibitContent(entityId) {
  const items = await fetchPageContent('SERIES_DETAIL', entityId);
  return {
    title: findBySection(items, 'EXHIBIT_TITLE'),
    items: groupBySection(items, FIELDS),
  };
}
