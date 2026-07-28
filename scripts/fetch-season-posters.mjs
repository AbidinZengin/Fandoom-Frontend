#!/usr/bin/env node
// Sezon poster görsellerini TMDB'den bulup Cloudinary'e yükleyen ve
// posterUrl'i eksik olan sezonlar için backend'e yazan tek seferlik asset
// aracı — fetch-episode-stills.mjs ile aynı .env.local / kimlik deseni.
//
// Kullanım (PowerShell):
//   $env:TMDB_API_KEY="..."; $env:CLOUDINARY_API_KEY="..."; $env:CLOUDINARY_API_SECRET="..."; $env:AUTH_TOKEN="..."; node scripts/fetch-season-posters.mjs
// Veya repo kökündeki .env.local (gitignore'lu) otomatik okunur.
//
// Opsiyonel argüman: --season <n> (sadece o sezonu işler)
// Varsayılan davranış: yalnızca posterUrl'i BOŞ olan sezonlar işlenir —
// zaten posteri olan sezonlara (1-4) dokunulmaz.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
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

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'b0bc5njd';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'fandoom/home';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const TMDB_TV_ID = process.env.TMDB_TV_ID || '1399'; // Game of Thrones
const SERIES_SLUG = process.env.SERIES_SLUG || 'game-of-thrones';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;

const seasonFilterArg = process.argv.indexOf('--season');
const seasonFilter = seasonFilterArg !== -1 ? Number(process.argv[seasonFilterArg + 1]) : null;

const missing = [];
if (!TMDB_API_KEY) missing.push('TMDB_API_KEY');
if (!CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
if (!CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
if (!AUTH_TOKEN) missing.push('AUTH_TOKEN (backend\'e posterUrl yazmak için zorunlu)');
if (missing.length > 0) {
  console.error(`Eksik ortam değişkeni: ${missing.join(', ')}`);
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tmdbBestPoster(seasonNumber) {
  const url = `https://api.themoviedb.org/3/tv/${TMDB_TV_ID}/season/${seasonNumber}/images?api_key=${TMDB_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const posters = data.posters || [];
  if (posters.length === 0) return null;
  // Dikey posterlere (kart oranına uygun) öncelik, en yüksek çözünürlük.
  const sorted = [...posters].sort((a, b) => b.width * b.height - a.width * a.height);
  return `https://image.tmdb.org/t/p/original${sorted[0].file_path}`;
}

function cloudinarySignature(params) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(toSign + CLOUDINARY_API_SECRET).digest('hex');
}

async function uploadToCloudinary(imageUrl, publicIdHint) {
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Görsel indirilemedi: ${imageUrl}`);
  const blob = await imgRes.blob();

  const timestamp = Math.floor(Date.now() / 1000);
  const signParams = { folder: CLOUDINARY_FOLDER, timestamp };
  const signature = cloudinarySignature(signParams);

  const form = new FormData();
  form.append('file', blob, `${publicIdHint}.jpg`);
  form.append('api_key', CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('folder', CLOUDINARY_FOLDER);
  form.append('signature', signature);

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(uploadData.error?.message || 'Cloudinary upload başarısız');
  return uploadData.secure_url;
}

async function putSeasonPoster(season, posterUrl) {
  const res = await fetch(`${BACKEND_BASE_URL}/seasons/${season.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    body: JSON.stringify({ id: season.id, seasonNumber: season.seasonNumber, title: season.title, posterUrl }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(`PUT /seasons/${season.id} başarısız (${res.status}): ${body?.message || res.statusText}`);
  }
}

async function main() {
  console.log(`Series detayı çekiliyor: ${SERIES_SLUG}`);
  const series = await fetch(`${BACKEND_BASE_URL}/series/slug/${SERIES_SLUG}`).then((r) => r.json());

  for (const season of series.seasons) {
    if (seasonFilter && season.seasonNumber !== seasonFilter) continue;
    const label = `Season ${season.seasonNumber} — ${season.title}`;

    if (season.posterUrl) {
      console.log(`= ${label}: zaten posteri var, atlandı`);
      continue;
    }

    try {
      const posterUrl = await tmdbBestPoster(season.seasonNumber);
      if (!posterUrl) {
        console.log(`⚠ ${label}: TMDB'de poster yok, atlandı`);
        continue;
      }
      const cloudinaryUrl = await uploadToCloudinary(posterUrl, `got-s${season.seasonNumber}-poster`);
      await putSeasonPoster(season, cloudinaryUrl);
      console.log(`✓ ${label} (DB güncellendi)`);
    } catch (err) {
      console.log(`✗ ${label}: ${err.message}`);
    }
    await sleep(300);
  }

  console.log('\nBitti.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
