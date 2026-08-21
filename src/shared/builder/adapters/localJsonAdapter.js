import { fetchBlocks, saveBlocks, fetchBuilds, publishBuild } from '../../api/designServer';

// Local design-server'a (127.0.0.1:5175) yazan Storage Adapter — şablon
// tasarımları için (ör. Series Hero). fetchBlocks/saveBlocks'ı sarar,
// ApiAdapter ile AYNI {load, save} arayüzünü sağlar (store adaptöre kör).
// filePath design-server'ın guard'ına uyması için 'src/**/*.blocks.json'
// deseninde olmalı (aksi halde design-server 400 döner).
//
// listBuilds/publish SADECE PageBuilder'ın "Geçmiş" panelinin kullandığı
// EK metotlar (bkz. store.js publishBuild/loadBuilds/restoreBuild) — bu
// adaptörü {load,save} ile kullanan diğer tüketiciler (SeriesHeroEditor)
// bunlara hiç dokunmaz, mevcut davranışları değişmez.
export function createLocalJsonAdapter(filePath) {
  return {
    load: () => fetchBlocks(filePath),
    save: (data) => saveBlocks(filePath, data),
    listBuilds: () => fetchBuilds(filePath),
    publish: (data) => publishBuild(filePath, data),
  };
}
