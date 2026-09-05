#!/usr/bin/env node
// Tek seferlik düzeltme: FROM'un poster/cover görselini kullanıcının
// seçtiği alternatif TMDb posteriyle (mPFwg9BjfgSFcINA0U7i1lpQAIS yerine
// pnrv8tfOcWxu4CrB8N7xK0jYJsR) değiştirir. create-from.mjs ile aynı
// Cloudinary imzalama deseni; PUT /api/series/:id mevcut kaydı korur.
//
// Kullanım (PowerShell):
//   $env:AUTH_TOKEN="..."; node scripts/update-from-poster.mjs

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
const SERIES_SLUG = 'from';
const NEW_SOURCE_URL = 'https://image.tmdb.org/t/p/original/pnrv8tfOcWxu4CrB8N7xK0jYJsR.jpg';

if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET || !AUTH_TOKEN) {
  console.error('Eksik: CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET / AUTH_TOKEN');
  process.exit(1);
}

function cloudinarySignature(params) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(toSign + CLOUDINARY_API_SECRET).digest('hex');
}

async function uploadToCloudinary(source, publicIdHint) {
  const blob = await fetch(source).then((r) => {
    if (!r.ok) throw new Error(`Görsel indirilemedi: ${source}`);
    return r.blob();
  });
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

async function main() {
  const seriesRes = await fetch(`${BACKEND_BASE_URL}/series/slug/${SERIES_SLUG}`);
  if (!seriesRes.ok) throw new Error(`FROM series bulunamadı (slug: ${SERIES_SLUG})`);
  const series = await seriesRes.json();

  console.log('Yeni poster/cover Cloudinary\'e yükleniyor...');
  const posterUrl = await uploadToCloudinary(NEW_SOURCE_URL, 'from-poster-v2');
  console.log(`  ✓ ${posterUrl}`);

  const body = {
    title: series.title,
    titleTr: series.titleTr,
    originalTitle: series.originalTitle,
    synopsis: series.synopsis,
    synopsisTr: series.synopsisTr,
    firstAirDate: series.firstAirDate,
    lastAirDate: series.lastAirDate,
    status: series.status,
    posterUrl,
    coverImageUrl: posterUrl,
    trailerUrl: series.trailerUrl,
    contentRating: series.contentRating,
    originCountry: series.originCountry,
    originalLanguage: series.originalLanguage,
    externalRating: series.externalRating,
    externalVoteCount: series.externalVoteCount,
    imdbId: series.imdbId,
    tmdbId: series.tmdbId,
    franchiseId: series.franchiseId,
    genreIds: series.genreIds,
    producerIds: series.producerIds,
  };

  const res = await fetch(`${BACKEND_BASE_URL}/series/${series.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`${res.status}: ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
  }
  console.log(`\n✓ FROM güncellendi (id: ${data.id}) — poster ve cover artık aynı görsel.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
