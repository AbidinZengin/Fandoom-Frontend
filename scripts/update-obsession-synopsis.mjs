#!/usr/bin/env node
// Obsession film kaydının synopsis / synopsisTr alanlarını PUT /movies/:id ile
// günceller (kaynaklarla uyuşmayan eski metin düzeltmesi). Metin
// scripts/data/obsession-movie.json'dan okunur. Güvenlik önlemleri
// set-movie-directors.mjs ile aynı: token doğrulanır, film yedeklenir, PUT sonrası
// synopsis dışında bir alan değiştiyse orijinal gövde geri yazılır.
//
// Kullanım (PowerShell):
//   node scripts/update-obsession-synopsis.mjs --dry-run   (yazmaz)
//   $env:AUTH_TOKEN="..."; node scripts/update-obsession-synopsis.mjs

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadDotEnvLocal() {
  const path = resolve('.env.local');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadDotEnvLocal();

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;
const SLUG = 'obsession';
const DRY_RUN = process.argv.includes('--dry-run');
const EDITED = ['synopsis', 'synopsisTr'];

if (!DRY_RUN) {
  if (!AUTH_TOKEN) {
    console.error('AUTH_TOKEN yok.');
    process.exit(1);
  }
  try {
    const { exp } = JSON.parse(Buffer.from(AUTH_TOKEN.split('.')[1], 'base64url').toString());
    if (exp && exp * 1000 < Date.now()) {
      console.error('AUTH_TOKEN süresi dolmuş, hiçbir şey yazılmadı.');
      process.exit(1);
    }
  } catch {
    console.error('AUTH_TOKEN geçerli bir JWT değil.');
    process.exit(1);
  }
  const probe = await fetch(`${BACKEND_BASE_URL}/me`, { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } });
  if (probe.status === 401) {
    console.error('Backend tokeni reddetti (401), hiçbir şey yazılmadı.');
    process.exit(1);
  }
}

const authHeaders = { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` };

async function send(method, path, body) {
  const res = await fetch(`${BACKEND_BASE_URL}${path}`, { method, headers: authHeaders, body: JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
  return data;
}

// Sunucunun ürettiği, PUT gövdesine girmeyen alanlar karşılaştırma dışı.
const VOLATILE = new Set(['updatedAt', 'externalRatingUpdatedAt']);
function diffFields(before, after) {
  return Object.keys({ ...before, ...after }).filter(
    (k) => !VOLATILE.has(k) && !EDITED.includes(k) && JSON.stringify(before[k]) !== JSON.stringify(after[k]),
  );
}

const draft = JSON.parse(readFileSync(resolve('scripts/data/obsession-movie.json'), 'utf8'));
const movie = await fetch(`${BACKEND_BASE_URL}/movies/slug/${SLUG}`).then((r) => r.json());
mkdirSync(resolve('scripts/output/movie-backups'), { recursive: true });
writeFileSync(resolve(`scripts/output/movie-backups/${SLUG}.json`), JSON.stringify(movie, null, 2));

console.log(`== ${SLUG} (id: ${movie.id})`);
console.log('ESKİ synopsis:   ', movie.synopsis);
console.log('YENİ synopsis:   ', draft.synopsis);
console.log('ESKİ synopsisTr: ', movie.synopsisTr);
console.log('YENİ synopsisTr: ', draft.synopsisTr);

if (DRY_RUN) {
  console.log('\ndry-run: PUT yapılmadı (YAZILMADI).');
  process.exit(0);
}

const { id, createdAt, ...original } = movie;
void createdAt;
const body = { ...original, synopsis: draft.synopsis, synopsisTr: draft.synopsisTr };
await send('PUT', `/movies/${id}`, body);

const after = await fetch(`${BACKEND_BASE_URL}/movies/slug/${SLUG}`).then((r) => r.json());
const changed = diffFields(movie, after);
if (after.synopsis !== draft.synopsis || after.synopsisTr !== draft.synopsisTr || changed.length > 0) {
  console.error(`✗ Doğrulama başarısız. Değişen diğer alanlar: ${changed.join(', ') || '(yok)'}`);
  console.error('Orijinal gövde geri yazılıyor...');
  await send('PUT', `/movies/${id}`, original);
  console.error(`Geri yazıldı. Yedek: scripts/output/movie-backups/${SLUG}.json`);
  process.exit(1);
}
console.log('✓ synopsis / synopsisTr güncellendi, diğer alanlar aynı.');
