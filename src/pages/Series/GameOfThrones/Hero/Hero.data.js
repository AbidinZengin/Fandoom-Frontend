// Hero'nun veri erişim katmanı — GET /api/cms/pages/SERIES_DETAIL?entityId=..
// üzerinden HERO_BANNER (arka plan) ve LOGO görsellerini çeker. title/synopsis
// CMS'ten değil, entity'nin kendi verisinden gelir (bkz. GameOfThrones.jsx —
// oradan prop olarak geçilir), burada tekrar çekilmez.
import { fetchPageContent, findBySection } from '../../../../shared/api/cms';

export async function fetchHeroContent(entityId) {
  const items = await fetchPageContent('SERIES_DETAIL', entityId);
  return {
    heroImage: findBySection(items, 'HERO_BANNER'),
    logoImage: findBySection(items, 'LOGO'),
  };
}
