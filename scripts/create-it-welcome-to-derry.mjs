#!/usr/bin/env node
// IT: Welcome to Derry series entity'sini POST /api/series ile sıfırdan
// oluşturan tek seferlik script — create-from.mjs'in aynı deseni.
// Idempotent: slug zaten varsa hiçbir şey yapmadan çıkar.
//
// Kullanım (PowerShell):
//   $env:AUTH_TOKEN="..."; node scripts/create-it-welcome-to-derry.mjs
// Sadece deneme (Cloudinary'e yükler ama backend'e YAZMAZ):
//   node scripts/create-it-welcome-to-derry.mjs   (AUTH_TOKEN verilmezse)

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
const SERIES_SLUG = 'it-welcome-to-derry';

// Kullanıcı onayı (2026-09-06): poster = kanalizasyon grubu görseli,
// cover = Pennywise + kırmızı balon görseli — TMDb'nin logosuz/metinsiz
// posterleri, iki farklı görsel.
const POSTER_SOURCE_URL = 'https://image.tmdb.org/t/p/original/xcxFRWCE4ccsaGEEPnvvRR32f6Y.jpg';
const COVER_SOURCE_URL = 'https://image.tmdb.org/t/p/original/2fOKVDoc2O3eZmBZesWPuE5kgPN.jpg';

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
  const posterUrl = await uploadToCloudinary(POSTER_SOURCE_URL, 'it-welcome-to-derry-poster');
  console.log(`  ✓ ${posterUrl}`);

  console.log("Cover Cloudinary'e yükleniyor...");
  const coverImageUrl = await uploadToCloudinary(COVER_SOURCE_URL, 'it-welcome-to-derry-cover');
  console.log(`  ✓ ${coverImageUrl}`);

  const body = {
    title: 'IT: Welcome to Derry',
    titleTr: 'IT: Derry\'ye Hoş Geldiniz',
    originalTitle: 'IT: Welcome to Derry',
    synopsis:
      "Derry, Maine, 1962: a quiet mill town where children keep vanishing and no one wants to ask why. When a boy disappears without a trace, a handful of outcast kids refuse to let the town's silence bury him, and their search drags them toward something ancient that has been feeding beneath Derry for centuries. As a covert U.S. Air Force operation moves in with an agenda of its own, uneasy adults and a small circle of believers are forced into an alliance against an evil that wears whatever face gets it what it wants. Set decades before Stephen King's IT, this prequel unearths the town's buried history one disappearance at a time.",
    synopsisTr:
      "1962, Derry, Maine: çocukların birer birer kaybolduğu, kimsenin nedenini sormak istemediği sakin bir değirmen kasabası. Bir çocuk iz bırakmadan ortadan kaybolunca, kasabanın dışladığı bir avuç çocuk susmayı reddeder; arayışları onları Derry'nin altında yüzyıllardır beslenen kadim bir kötülüğe sürükler. Kasabaya kendi gündemiyle gizlice yerleşen bir Hava Kuvvetleri operasyonu araya girerken, tedirgin yetişkinler ve küçük bir inanç çevresi işine yarayan her surata bürünen bu kötülüğe karşı istemsiz bir ittifak kurmak zorunda kalır. Stephen King'in IT'sinden onlarca yıl önce geçen bu prequel, kasabanın gömülü tarihini kayboluş kayboluş gün yüzüne çıkarır.",
    firstAirDate: '2025-10-26',
    lastAirDate: null,
    status: 'ONGOING',
    posterUrl,
    coverImageUrl,
    trailerUrl: null,
    contentRating: 'TV-MA',
    originCountry: 'US',
    originalLanguage: 'en',
    externalRating: 8.2,
    externalVoteCount: 1626,
    externalRatingUpdatedAt: new Date().toISOString().slice(0, 19),
    imdbId: 'tt19244304',
    tmdbId: 200875,
    franchiseId: null,
    genreIds: [2, 6, 8], // Drama, Mystery, Horror
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
  console.log(`\n✓ IT: Welcome to Derry oluşturuldu (id: ${data.id}, slug: ${data.slug})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
