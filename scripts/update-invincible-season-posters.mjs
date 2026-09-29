#!/usr/bin/env node
// Invincible sezon kartı posterlerini elle seçilmiş İngilizce, sezon yazısız
// TMDb posterleriyle değiştirir. fetch-season-posters.mjs en yüksek
// çözünürlüğü seçtiği için S1/S2'ye Çince (zh) poster gelmişti.
// Cloudinary'e yükler, PUT /api/seasons/:id ile posterUrl'i günceller.
// AUTH_TOKEN yoksa hiçbir şey yazmaz, sadece planı basar.
//
// Kullanım (PowerShell):
//   $env:AUTH_TOKEN="..."; node scripts/update-invincible-season-posters.mjs

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

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'b0bc5njd';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_FOLDER = 'fandoom/seasons/invincible';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;
const SERIES_SLUG = 'invincible';

// Kullanıcı: "season cardlarının imageleri kötü, değiştir" (2026-09-30).
// Kartta zaten "0N / Season N" etiketi olduğu için sezon yazısız posterler seçildi.
const POSTERS = {
  1: '/yDWJYRAwMNKbIYT8ZB33qy84uzO.jpg', // en, 1366x2048
  2: '/dMOpdkrDC5dQxqNydgKxXjBKyAc.jpg', // en, 2000x3000
  3: '/w9XQ7ehwaxqV6WJSAUE0qLTQHgq.jpg', // en, 2000x3000
  4: '/4tblBrslcKSifMVZ3TmtT2ukMor.jpg', // en, 2000x3000
};

if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('Eksik ortam değişkeni: CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET');
  process.exit(1);
}
if (!AUTH_TOKEN) {
  console.log('AUTH_TOKEN yok — dry-run, hiçbir şey yazılmadı. Plan:');
  for (const [n, p] of Object.entries(POSTERS)) console.log(`  Sezon ${n}: https://image.tmdb.org/t/p/original${p}`);
  process.exit(0);
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
  const signature = cloudinarySignature({ folder: CLOUDINARY_FOLDER, timestamp });

  const form = new FormData();
  form.append('file', blob, `${publicIdHint}.jpg`);
  form.append('api_key', CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('folder', CLOUDINARY_FOLDER);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Cloudinary upload başarısız');
  return data.secure_url;
}

async function main() {
  const series = await fetch(`${BACKEND_BASE_URL}/series/slug/${SERIES_SLUG}`).then((r) => r.json());

  for (const season of series.seasons) {
    const path = POSTERS[season.seasonNumber];
    if (!path) continue;

    const posterUrl = await uploadToCloudinary(`https://image.tmdb.org/t/p/original${path}`, `invincible-season-${season.seasonNumber}`);
    // PUT tüm kaynağı değiştirir — alanlar düşmesin diye mevcut sezon spread'lenir.
    const res = await fetch(`${BACKEND_BASE_URL}/seasons/${season.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AUTH_TOKEN}` },
      body: JSON.stringify({ ...season, posterUrl }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(`PUT /seasons/${season.id} başarısız (${res.status}): ${body?.message || res.statusText}`);
    }
    console.log(`✓ Sezon ${season.seasonNumber} güncellendi: ${posterUrl}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
