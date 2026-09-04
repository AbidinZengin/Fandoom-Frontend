#!/usr/bin/env node
// House of the Dragon sezon posterlerini (kullanıcının verdiği TMDB
// görsel URL'lerini) Cloudinary'e yükleyip backend'deki ilgili season'a
// posterUrl olarak yazan tek seferlik asset aracı — fetch-season-posters.mjs
// ile aynı .env.local / Cloudinary imzalama deseni, TMDB API çağrısı yok
// (kaynak URL'ler doğrudan sabit).
//
// Kullanım (PowerShell):
//   $env:AUTH_TOKEN="..."; node scripts/upload-house-of-the-dragon-season-posters.mjs

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
const CLOUDINARY_FOLDER = 'fandoom/home';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;
const SERIES_SLUG = 'house-of-the-dragon';
const PUBLIC_ID_PREFIX = 'hotd';

const SEASON_POSTERS = {
  1: 'https://image.tmdb.org/t/p/original/cR3EoEBdMTh7qUeYWULLXYW40by.jpg',
  2: 'https://image.tmdb.org/t/p/original/xtAQ7j9Yd0j4Rjbvx1hW0ENpXjf.jpg',
  3: 'https://image.tmdb.org/t/p/original/577eXC8wFQT0eUrJcgznSiFPRmk.jpg',
};

const missing = [];
if (!CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
if (!CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
if (!AUTH_TOKEN) missing.push("AUTH_TOKEN (backend'e posterUrl yazmak için zorunlu)");
if (missing.length > 0) {
  console.error(`Eksik ortam değişkeni: ${missing.join(', ')}`);
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
    const sourceUrl = SEASON_POSTERS[season.seasonNumber];
    const label = `Season ${season.seasonNumber} — ${season.title}`;
    if (!sourceUrl) {
      console.log(`= ${label}: verilen listede yok, atlandı`);
      continue;
    }

    try {
      const cloudinaryUrl = await uploadToCloudinary(sourceUrl, `${PUBLIC_ID_PREFIX}-s${season.seasonNumber}-poster`);
      await putSeasonPoster(season, cloudinaryUrl);
      console.log(`✓ ${label}: ${cloudinaryUrl}`);
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
