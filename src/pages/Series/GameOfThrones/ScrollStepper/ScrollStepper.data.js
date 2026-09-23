// ScrollStepper'ın içerik seam'i — GET /api/cms/pages/SERIES_DETAIL'a bağlı.
// Her kart (image/title/description) aynı orderIndex'i paylaşan üç ayrı CMS
// kaydından groupBySection ile birleştirilir (bkz. fandoom-backend CLAUDE.md).
import { fetchPageContent, groupBySection } from '../../../../shared/api/cms';

const FIELDS = {
  STEPPER_ITEM_IMAGE: 'image',
  STEPPER_ITEM_TITLE: 'title',
  STEPPER_ITEM_DESCRIPTION: 'description',
};

export async function fetchStepperItems(entityId) {
  const items = await fetchPageContent('SERIES_DETAIL', entityId);
  return groupBySection(items, FIELDS);
}
