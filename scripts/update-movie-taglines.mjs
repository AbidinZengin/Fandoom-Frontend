#!/usr/bin/env node
// Film tagline (Atmosphere başlığı) güncelleme: scripts/data/<slug>-movie.json içindeki
// tagline / taglineTr alanlarını PUT /movies/:id ile backend'e yazar. Güvenlik:
// token doğrulanır, filmin önceki hâli scripts/output/movie-backups/ altına
// yedeklenir, PUT sonrası tagline/taglineTr dışında alan değiştiyse orijinal gövde
// geri yazılır (update-movie-covers.mjs ile aynı desen). Kullanıcı onaylı metinler
// (2026-10-05).
//
// Kullanım (PowerShell):
//   node scripts/update-movie-taglines.mjs              # dry-run: HİÇBİR ŞEY yazmaz
//   $env:AUTH_TOKEN="..."; node scripts/update-movie-taglines.mjs --write

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
    if (!(key in process.env)) process.env[key] = trimmed.slice(eq + 1).trim();
  }
}
loadDotEnvLocal();

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;
const DRY_RUN = !process.argv.includes('--write');

const SLUGS = ['midsommar', 'pearl', 'nightcrawler', 'gone-girl', 'the-shining', 'a-clockwork-orange', 'eyes-wide-shut'];

if (DRY_RUN) {
  console.warn("dry-run (--write yok): backend'e HİÇBİR ŞEY yazılmaz.\n");
} else {
  if (!AUTH_TOKEN) {
    console.error('AUTH_TOKEN yok.');
    process.exit(1);
  }
  const { exp } = JSON.parse(Buffer.from(AUTH_TOKEN.split('.')[1], 'base64url').toString());
  if (exp * 1000 < Date.now()) {
    console.error('AUTH_TOKEN süresi dolmuş, hiçbir şey yazılmadı.');
    process.exit(1);
  }
}

const authHeaders = { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` };

async function putMovie(id, body) {
  const res = await fetch(`${BACKEND_BASE_URL}/movies/${id}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`PUT /movies/${id} -> ${res.status}: ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
}

// Sunucunun ürettiği alanlar karşılaştırma dışı.
const VOLATILE = new Set(['updatedAt', 'externalRatingUpdatedAt']);
const TARGET = new Set(['tagline', 'taglineTr']);

for (const slug of SLUGS) {
  const { tagline, taglineTr } = JSON.parse(readFileSync(resolve(`scripts/data/${slug}-movie.json`), 'utf8'));
  console.log(`\n== ${slug}`);
  const movie = await fetch(`${BACKEND_BASE_URL}/movies/slug/${slug}`).then((r) => r.json());
  mkdirSync(resolve('scripts/output/movie-backups'), { recursive: true });
  writeFileSync(resolve(`scripts/output/movie-backups/${slug}-tagline.json`), JSON.stringify(movie, null, 2));

  console.log(`  mevcut : ${movie.tagline} | ${movie.taglineTr}`);
  console.log(`  yeni   : ${tagline} | ${taglineTr}`);
  if (DRY_RUN) continue;

  const { id, createdAt, ...original } = movie;
  void createdAt;
  await putMovie(id, { ...original, tagline, taglineTr });

  const after = await fetch(`${BACKEND_BASE_URL}/movies/slug/${slug}`).then((r) => r.json());
  const changed = Object.keys({ ...movie, ...after }).filter(
    (k) => !VOLATILE.has(k) && !TARGET.has(k) && JSON.stringify(movie[k]) !== JSON.stringify(after[k]),
  );
  if (after.tagline !== tagline || after.taglineTr !== taglineTr || changed.length > 0) {
    console.error(`  ✗ Doğrulama başarısız. Değişen diğer alanlar: ${changed.join(', ') || '(yok)'}. Orijinal geri yazılıyor...`);
    await putMovie(id, original);
    process.exit(1);
  }
  console.log(`  ✓ ${slug} güncellendi, diğer alanlar aynı.`);
}

console.log('\nBitti.');
