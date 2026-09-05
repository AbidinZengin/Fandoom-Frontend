#!/usr/bin/env node
// Pluribus series entity'sini POST /api/series ile sıfırdan oluşturan tek
// seferlik script — create-house-of-the-dragon.mjs'in aynı deseni.
// Idempotent: slug zaten varsa hiçbir şey yapmadan çıkar.
//
// Kullanım (PowerShell):
//   $env:AUTH_TOKEN="..."; node scripts/create-pluribus.mjs
// Sadece deneme (Cloudinary'e yükler ama backend'e YAZMAZ):
//   node scripts/create-pluribus.mjs   (AUTH_TOKEN verilmezse)

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
const SERIES_SLUG = 'pluribus';

// TMDb posteri kullanıcı tarafından reddedildi (2026-09-05) — poster
// kullanıcının kendi bulduğu yerel dosya. Cover/backdrop için TMDb
// görseli onaylandı.
const POSTER_SOURCE_PATH = 'd:/İndirilenler/pluribus-dizisinin-yonetmeni-vince-gilligandan-ikinci-sezon-icin-turkiye-mesaji.webp';
const COVER_SOURCE_URL = 'https://image.tmdb.org/t/p/original/ulm1ex4JFYJByyaPyqTr47MFyEQ.jpg';

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

async function uploadToCloudinary(source, publicIdHint, ext = 'jpg') {
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
  form.append('file', blob, `${publicIdHint}.${ext}`);
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
  const posterUrl = await uploadToCloudinary(POSTER_SOURCE_PATH, 'pluribus-poster', 'webp');
  console.log(`  ✓ ${posterUrl}`);

  console.log("Cover Cloudinary'e yükleniyor...");
  const coverImageUrl = await uploadToCloudinary(COVER_SOURCE_URL, 'pluribus-cover');
  console.log(`  ✓ ${coverImageUrl}`);

  const body = {
    title: 'Pluribus',
    titleTr: 'Pluribus',
    originalTitle: 'Pluribus',
    synopsis:
      "A mysterious event rewires nearly everyone on Earth into a single, serene, uniformly content consciousness — overnight, the planet finds a peace it has never known. Carol Sturka, a prickly, self-isolating novelist, is one of the vanishingly few left unaffected, suddenly among the last 'real' people on the planet. Created by Vince Gilligan, this sci-fi drama asks what it costs to stay yourself in a world where happiness is no longer a choice but a condition.",
    synopsisTr:
      "Gizemli bir olay, gezegendeki hemen herkesi tek, huzurlu ve kusursuzca mutlu bir bilince dönüştürür — dünya bir gecede eşi görülmemiş bir uyuma kavuşur. Bu değişimden etkilenmeyen avuç içi kadar insandan biri, kırgın ve içine kapanık bir romancı olan Carol Sturka'dır; artık gezegenin son 'gerçek' insanlarından biri olarak yapayalnız kalmıştır. Vince Gilligan imzalı bu bilim-kurgu draması, mutluluğun bir seçenek değil bir zorunluluk haline geldiği bir dünyada farklı kalmanın bedelini sorguluyor.",
    firstAirDate: '2025-11-06',
    lastAirDate: null,
    status: 'ONGOING',
    posterUrl,
    coverImageUrl,
    trailerUrl: null,
    contentRating: 'TV-MA',
    originCountry: 'US',
    originalLanguage: 'en',
    externalRating: 7.9,
    externalVoteCount: 1079,
    externalRatingUpdatedAt: new Date().toISOString().slice(0, 19),
    imdbId: 'tt22202452',
    tmdbId: 225171,
    franchiseId: null,
    genreIds: [2, 5, 6, 7], // Drama, Sci-Fi, Mystery, Thriller
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
  console.log(`\n✓ Pluribus oluşturuldu (id: ${data.id}, slug: ${data.slug})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
