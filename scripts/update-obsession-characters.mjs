#!/usr/bin/env node
// Obsession karakterlerinin description / descriptionTr alanlarını
// PUT /characters/:id ile günceller (metinler scripts/data/obsession-characters.json'dan).
// Yalnızca bu iki alan değişir; görsel ve Cloudinary'e DOKUNULMAZ. Güvenlik:
// token yazmadan önce doğrulanır, kayıtlar yedeklenir, PUT sonrası kayıt yeniden
// okunur ve iki metin dışında alan değiştiyse orijinal gövde geri yazılır.
//
// Kullanım (PowerShell):
//   node scripts/update-obsession-characters.mjs --dry-run   (yazmaz)
//   node scripts/update-obsession-characters.mjs             (AUTH_TOKEN .env.local'dan)

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
const EDITED = ['description', 'descriptionTr'];

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

async function put(path, body) {
  const res = await fetch(`${BACKEND_BASE_URL}${path}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`PUT ${path} -> ${res.status}: ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
  return data;
}

const getCharacters = (movieId) => fetch(`${BACKEND_BASE_URL}/movies/${movieId}/characters`).then((r) => r.json());

// Sunucunun ürettiği alanlar PUT gövdesine girmez; karşılaştırmada yok sayılır.
const VOLATILE = new Set(['updatedAt', 'createdAt']);
function diffFields(before, after) {
  return Object.keys({ ...before, ...after }).filter(
    (k) => !VOLATILE.has(k) && !EDITED.includes(k) && JSON.stringify(before[k]) !== JSON.stringify(after[k]),
  );
}

const movie = await fetch(`${BACKEND_BASE_URL}/movies/slug/${SLUG}`).then((r) => r.json());
const { characters: drafts } = JSON.parse(readFileSync(resolve(`scripts/data/${SLUG}-characters.json`), 'utf8'));
const existing = await getCharacters(movie.id);

mkdirSync(resolve('scripts/output/movie-backups'), { recursive: true });
writeFileSync(resolve(`scripts/output/movie-backups/${SLUG}-characters.json`), JSON.stringify(existing, null, 2));

for (const draft of drafts) {
  const current = existing.find((c) => c.name === draft.name);
  if (!current) {
    console.log(`✗ ${draft.name}: backend'de bulunamadı, atlandı.`);
    continue;
  }
  console.log(`\n== ${draft.name} (id: ${current.id})`);
  console.log(`  ESKİ EN (${current.description?.length ?? 0}): ${current.description}`);
  console.log(`  YENİ EN (${draft.description.length}): ${draft.description}`);
  console.log(`  YENİ TR (${draft.descriptionTr.length}): ${draft.descriptionTr}`);
  if (DRY_RUN) continue;

  const { id, slug, ...original } = current;
  void slug;
  await put(`/characters/${id}`, { ...original, description: draft.description, descriptionTr: draft.descriptionTr });

  const after = (await getCharacters(movie.id)).find((c) => c.id === id);
  const changed = diffFields(current, after);
  if (after.description !== draft.description || after.descriptionTr !== draft.descriptionTr || changed.length > 0) {
    console.error(`  ✗ Doğrulama başarısız. Değişen diğer alanlar: ${changed.join(', ') || '(yok)'}`);
    console.error('  Orijinal gövde geri yazılıyor...');
    await put(`/characters/${id}`, original);
    console.error(`  Geri yazıldı. Yedek: scripts/output/movie-backups/${SLUG}-characters.json`);
    process.exit(1);
  }
  console.log(`  ✓ ${draft.name} güncellendi, diğer alanlar aynı.`);
}

console.log(DRY_RUN ? '\ndry-run: PUT yapılmadı (YAZILMADI).' : '\nBitti.');
