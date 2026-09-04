// Local tasarım editörü yazma sunucusuna (scripts/design-server.mjs)
// istemci — backend/DB'yi devre dışı bırakan mimari pivotun parçası.
// Bu ASLA production'a taşınmaz: sadece `npm run design-server` local
// dev'de ayrıca çalışırken işe yarar.
const DESIGN_SERVER_URL = 'http://127.0.0.1:5175';

export async function fetchBlocks(blocksPath) {
  const res = await fetch(`${DESIGN_SERVER_URL}/blocks?path=${encodeURIComponent(blocksPath)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `design-server hata: ${res.status} — çalışıyor mu? (npm run design-server)`);
  }
  return res.json();
}

export async function saveBlocks(blocksPath, blocks) {
  const res = await fetch(`${DESIGN_SERVER_URL}/blocks?path=${encodeURIComponent(blocksPath)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(blocks),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `design-server hata: ${res.status} — çalışıyor mu? (npm run design-server)`);
  }
  return res.json();
}

// PageBuilder'ın "Yayınla" akışı — taslaktan (saveBlocks'a giden AYNI blok
// dizisi) yeni bir build oluşturur (design-server'da yanındaki
// *.builds.json'a eklenir, üzerine yazmaz — bkz. design-server.mjs).
export async function fetchBuilds(blocksPath) {
  const res = await fetch(`${DESIGN_SERVER_URL}/builds?path=${encodeURIComponent(blocksPath)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `design-server hata: ${res.status} — çalışıyor mu? (npm run design-server)`);
  }
  return res.json();
}

export async function publishBuild(blocksPath, blocks) {
  const res = await fetch(`${DESIGN_SERVER_URL}/builds?path=${encodeURIComponent(blocksPath)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(blocks),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `design-server hata: ${res.status} — çalışıyor mu? (npm run design-server)`);
  }
  return res.json();
}

// Faz 2 — "Kodu Üret" akışının design-server uçları. .status taşıyan hata:
// çağıran (LeftPanel) 409'u (hedef klasör zaten var) diğer hatalardan
// ayırt edebilsin diye — client.js'teki ApiError'ın aynı deseni.
export class DesignServerError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'DesignServerError';
    this.status = status;
  }
}

async function designServerRequest(path, options) {
  const res = await fetch(`${DESIGN_SERVER_URL}${path}`, options);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new DesignServerError(body?.message ?? `design-server hata: ${res.status} — çalışıyor mu? (npm run design-server)`, res.status);
  }
  return body;
}

// src/pages altındaki var olan sayfa/component yollarını listeler (ör.
// "series/GameOfThrones/Intro") — "Kodu Üret" hedef seçicisi bunu doldurur.
export async function fetchPages() {
  return designServerRequest('/pages');
}

// route'u ekran görüntüsü olarak yakalar (capture-page.mjs'i sarar),
// { image: 'data:image/png;base64,...' } döner — tuvalin arka planına
// referans olarak basılır.
export async function captureReference(route, width) {
  return designServerRequest('/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ route, width }),
  });
}

// Üretilen component'i src/pages/<targetDir>/<name>/ altına yazar — hedef
// klasör ZATEN VARSA DesignServerError(status:409) fırlatır. blocksPath +
// blocks İSTEĞE BAĞLI (mevcut çağıranlar bozulmaz) — verilirse design-server
// aynı istekte KAYNAK blok ağacını da .generated.json log'una ekler (bkz.
// design-server.mjs handleGenerate yorumu).
export async function generateComponent({ targetDir, name, jsx, css, blocksPath, blocks }) {
  return designServerRequest('/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetDir, name, jsx, css, path: blocksPath, blocks }),
  });
}

// CodegenPanel'in "Üretilen Component'ler" geçmiş listesi — bkz.
// GeneratedHistoryPanel.jsx.
export async function fetchGenerated(blocksPath) {
  const res = await fetch(`${DESIGN_SERVER_URL}/generated?path=${encodeURIComponent(blocksPath)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `design-server hata: ${res.status} — çalışıyor mu? (npm run design-server)`);
  }
  return res.json();
}
