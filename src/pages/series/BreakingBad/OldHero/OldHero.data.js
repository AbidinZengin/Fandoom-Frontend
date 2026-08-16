// fetchHeroImage (eski CMS HERO_BANNER fetch'i) kaldırıldı — hero görseli
// artık Hero.blocks.json'daki IMAGE bloğundan geliyor (bkz. mimari pivot,
// plan: lively-zooming-river.md). MOCK_RELEASE_YEAR hâlâ kullanımda.

// Backend'in series detail endpoint'inde henüz yayın yılı alanı yok (yalnız
// productions LİSTE endpoint'inde releaseDate belgeli, detail'da garanti
// değil) — kullanıcı kararıyla entegrasyona kadar mock, gerçek alan gelince
// burası değişir.
export const MOCK_RELEASE_YEAR = 2008;
