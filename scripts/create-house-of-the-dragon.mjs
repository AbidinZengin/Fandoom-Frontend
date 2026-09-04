#!/usr/bin/env node
// House of the Dragon series entity'sini POST /api/series ile sıfırdan
// oluşturan tek seferlik script — seed-breaking-bad.mjs'in season/episode
// olmayan, tek-entity sürümü. Idempotent: slug zaten varsa hiçbir şey
// yapmadan çıkar.
//
// Kullanım (PowerShell):
//   $env:AUTH_TOKEN="..."; node scripts/create-house-of-the-dragon.mjs
// Sadece deneme (Cloudinary'e yükler ama backend'e YAZMAZ):
//   node scripts/create-house-of-the-dragon.mjs   (AUTH_TOKEN verilmezse)

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

const POSTER_SOURCE_URL = 'https://image.tmdb.org/t/p/original/577eXC8wFQT0eUrJcgznSiFPRmk.jpg';
const COVER_SOURCE_PATH = 'D:/İndirilenler/house-of-the-dragon--664f6316ed8d8.jpg';

const missing = [];
if (!CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
if (!CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
if (missing.length > 0) {
  console.error(`Eksik ortam değişkeni: ${missing.join(', ')}`);
  process.exit(1);
}
if (!AUTH_TOKEN) {
  console.warn("AUTH_TOKEN yok — sadece dry-run: Cloudinary'e yüklenir ama backend'e YAZILMAZ.\n");
}

function cloudinarySignature(params) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(toSign + CLOUDINARY_API_SECRET).digest('hex');
}

async function uploadToCloudinary(source, publicIdHint) {
  const blob = source.startsWith('http')
    ? await fetch(source).then((r) => {
        if (!r.ok) throw new Error(`Görsel indirilemedi: ${source}`);
        return r.blob();
      })
    : new Blob([readFileSync(source)]);

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
  const existing = await fetch(`${BACKEND_BASE_URL}/series/slug/${SERIES_SLUG}`);
  if (existing.ok) {
    const data = await existing.json();
    console.log(`Zaten var: ${SERIES_SLUG} (id: ${data.id}) — hiçbir şey yapılmadı.`);
    return;
  }

  console.log('Poster Cloudinary\'e yükleniyor...');
  const posterUrl = await uploadToCloudinary(POSTER_SOURCE_URL, 'house-of-the-dragon-poster');
  console.log(`  ✓ ${posterUrl}`);

  console.log("Cover Cloudinary'e yükleniyor...");
  const coverImageUrl = await uploadToCloudinary(COVER_SOURCE_PATH, 'house-of-the-dragon-cover');
  console.log(`  ✓ ${coverImageUrl}`);

  const body = {
    title: 'House of the Dragon',
    titleTr: 'House of the Dragon',
    originalTitle: 'House of the Dragon',
    synopsis:
      "House of the Dragon is set 172 years before the events of Game of Thrones and chronicles the reign of House Targaryen at the height of its power. When King Viserys I breaks with tradition to name his daughter Rhaenyra his heir, the decision ignites a succession crisis that splits the family — and the realm — into two warring factions. Based on George R.R. Martin's Fire & Blood, the series traces the road to civil war known as the Dance of the Dragons.",
    synopsisTr:
      "House of the Dragon, Game of Thrones olaylarından 172 yıl önce geçer ve Targaryen hanedanının gücünün zirvesindeki dönemini anlatır. Kral Viserys I, gelenekleri bozarak kızı Rhaenyra'yı veliaht ilan edince bu karar, aileyi -ve krallığı- birbirine düşman iki cepheye bölen bir veraset krizini ateşler. George R.R. Martin'in Fire & Blood adlı eserinden uyarlanan dizi, 'Ejderhaların Dansı' olarak bilinen iç savaşa giden yolu izler.",
    firstAirDate: '2022-08-21',
    lastAirDate: null,
    status: 'ONGOING',
    posterUrl,
    coverImageUrl,
    trailerUrl: null,
    contentRating: 'TV-MA',
    originCountry: 'US',
    originalLanguage: 'en',
    externalRating: 8.4,
    externalVoteCount: 7048,
    externalRatingUpdatedAt: new Date().toISOString().slice(0, 19),
    imdbId: 'tt11198330',
    tmdbId: 94997,
    franchiseId: 1,
    genreIds: [1, 2, 3, 4],
    producerIds: [],
  };

  if (!AUTH_TOKEN) {
    console.log('\ndry-run: aşağıdaki gövde backend\'e YAZILMADI:\n');
    console.log(JSON.stringify(body, null, 2));
    return;
  }

  const res = await fetch(`${BACKEND_BASE_URL}/series`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`${res.status}: ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
  }
  console.log(`\n✓ House of the Dragon oluşturuldu (id: ${data.id}, slug: ${data.slug})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
