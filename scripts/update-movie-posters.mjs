#!/usr/bin/env node
// Film poster görsellerini değiştirir (update-movie-covers.mjs'in posterUrl kopyası):
// yeni TMDb görselini Cloudinary'e yükler, filmin posterUrl alanını PUT /movies/:id
// ile günceller. Güvenlik:
// token doğrulanır, filmin önceki hâli scripts/output/movie-backups/ altına
// yedeklenir, PUT sonrası posterUrl dışında alan değiştiyse orijinal gövde
// geri yazılır (set-movie-directors.mjs ile aynı desen). Kullanıcı onaylı seçim
// (2026-10-16): Sinister.
//
// Kullanım (PowerShell):
//   node scripts/update-movie-posters.mjs             # dry-run: HİÇBİR ŞEY yazmaz
//   $env:AUTH_TOKEN="..."; node scripts/update-movie-posters.mjs --write

import { createHash } from 'node:crypto';
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

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'b0bc5njd';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_FOLDER = 'fandoom/home';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;
const DRY_RUN = !process.argv.includes('--write');

const TMDB = 'https://image.tmdb.org/t/p/original';
const POSTERS = {
  sinister: `${TMDB}/nzx10sca3arCeYBAomHan4Q6wa1.jpg`,
};

if (DRY_RUN) {
  console.warn("dry-run (--write yok): Cloudinary ve backend'e HİÇBİR ŞEY yazılmaz.\n");
} else {
  if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('Eksik ortam değişkeni: CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET');
    process.exit(1);
  }
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

async function uploadToCloudinary(source, publicIdHint) {
  const blob = await fetch(source).then((r) => {
    if (!r.ok) throw new Error(`Görsel indirilemedi: ${source}`);
    return r.blob();
  });
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `folder=${CLOUDINARY_FOLDER}&timestamp=${timestamp}`;
  const signature = createHash('sha1').update(toSign + CLOUDINARY_API_SECRET).digest('hex');

  const form = new FormData();
  form.append('file', blob, `${publicIdHint}.jpg`);
  form.append('api_key', CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('folder', CLOUDINARY_FOLDER);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Cloudinary upload başarısız');
  return data.secure_url;
}

const authHeaders = { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` };

async function putMovie(id, body) {
  const res = await fetch(`${BACKEND_BASE_URL}/movies/${id}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`PUT /movies/${id} -> ${res.status}: ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
}

// Sunucunun ürettiği alanlar karşılaştırma dışı.
const VOLATILE = new Set(['updatedAt', 'externalRatingUpdatedAt']);

for (const [slug, source] of Object.entries(POSTERS)) {
  console.log(`\n== ${slug}`);
  const movie = await fetch(`${BACKEND_BASE_URL}/movies/slug/${slug}`).then((r) => r.json());
  mkdirSync(resolve('scripts/output/movie-backups'), { recursive: true });
  writeFileSync(resolve(`scripts/output/movie-backups/${slug}.json`), JSON.stringify(movie, null, 2));

  if (DRY_RUN) {
    console.log(`  dry-run: ${source} Cloudinary'e yüklenecek, PUT /movies/${movie.id} posterUrl güncellenecek (YAZILMADI).`);
    console.log(`  mevcut poster: ${movie.posterUrl}`);
    continue;
  }

  const posterUrl = await uploadToCloudinary(source, `${slug}-poster-2`);
  console.log(`  ✓ yüklendi: ${posterUrl}`);

  const { id, createdAt, ...original } = movie;
  void createdAt;
  await putMovie(id, { ...original, posterUrl });

  const after = await fetch(`${BACKEND_BASE_URL}/movies/slug/${slug}`).then((r) => r.json());
  const changed = Object.keys({ ...movie, ...after }).filter(
    (k) => !VOLATILE.has(k) && k !== 'posterUrl' && JSON.stringify(movie[k]) !== JSON.stringify(after[k]),
  );
  if (after.posterUrl !== posterUrl || changed.length > 0) {
    console.error(`  ✗ Doğrulama başarısız. Değişen diğer alanlar: ${changed.join(', ') || '(yok)'}. Orijinal geri yazılıyor...`);
    await putMovie(id, original);
    process.exit(1);
  }
  console.log(`  ✓ ${slug} güncellendi, diğer alanlar aynı.`);
}

console.log('\nBitti.');
