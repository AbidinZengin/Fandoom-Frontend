#!/usr/bin/env node
// Film entity'lerini POST /api/movies ile oluşturan tek seferlik script —
// create-the-boys.mjs'in aynı deseni, dört film için döngü. Gövdeler
// scripts/data/<slug>-movie.json'dan okunur (kullanıcı onaylı veri,
// 2026-09-23). Idempotent: slug zaten varsa o filmi atlar.
//
// Kullanım (PowerShell):
//   node scripts/create-movies.mjs           # dry-run: HİÇBİR ŞEY yazmaz (token olsa bile)
//   node scripts/create-movies.mjs --write   # Cloudinary + backend'e YAZAR (AUTH_TOKEN gerekir)
//
// Dry-run Cloudinary'e de YÜKLEMEZ — sadece slug'ların
// backend'de olup olmadığını okur ve gönderilecek gövdeleri yazdırır.

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
// Yazma YALNIZCA açık --write bayrağıyla olur — .env.local'daki AUTH_TOKEN tek başına
// yazma izni DEĞİLDİR (ilk sürümde token'a bağlıydı ve istemeden Cloudinary'e yükledi).
const DRY_RUN = !process.argv.includes('--write');

const MOVIE_SLUGS = ['black-swan', 'dune-part-two', 'the-batman', 'blade-runner-2049'];

if (DRY_RUN) {
  console.warn('dry-run (--write yok): Cloudinary ve backend\'e HİÇBİR ŞEY yazılmaz.\n');
} else {
  const missing = [];
  if (!CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
  if (!CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
  if (missing.length > 0) {
    console.error(`Eksik ortam değişkeni: ${missing.join(', ')}`);
    process.exit(1);
  }
}

function cloudinarySignature(params) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(toSign + CLOUDINARY_API_SECRET).digest('hex');
}

async function uploadToCloudinary(source, publicIdHint, ext = 'jpg') {
  const blob = await fetch(source).then((r) => {
    if (!r.ok) throw new Error(`Görsel indirilemedi: ${source}`);
    return r.blob();
  });

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

async function createMovie(slug) {
  const {
    slug: MOVIE_SLUG,
    posterSourceUrl: POSTER_SOURCE_URL,
    coverSourceUrl: COVER_SOURCE_URL,
    _not,
    ...movieFields
  } = JSON.parse(readFileSync(resolve(`scripts/data/${slug}-movie.json`), 'utf8'));

  const existing = await fetch(`${BACKEND_BASE_URL}/movies/slug/${MOVIE_SLUG}`);
  if (existing.ok) {
    const data = await existing.json();
    console.log(`[${slug}] Zaten var (id: ${data.id}) — atlandı.`);
    return;
  }

  if (DRY_RUN) {
    const body = {
      ...movieFields,
      posterUrl: `<Cloudinary'e yüklenecek: ${POSTER_SOURCE_URL}>`,
      coverImageUrl: `<Cloudinary'e yüklenecek: ${COVER_SOURCE_URL}>`,
      externalRatingUpdatedAt: new Date().toISOString().slice(0, 19),
    };
    console.log(`[${slug}] dry-run — POST ${BACKEND_BASE_URL}/movies gövdesi (YAZILMADI):`);
    console.log(JSON.stringify(body, null, 2), '\n');
    return;
  }

  console.log(`[${slug}] Poster Cloudinary'e yükleniyor...`);
  const posterUrl = await uploadToCloudinary(POSTER_SOURCE_URL, `${slug}-poster`);
  console.log(`  ✓ ${posterUrl}`);

  console.log(`[${slug}] Cover Cloudinary'e yükleniyor...`);
  const coverImageUrl = await uploadToCloudinary(COVER_SOURCE_URL, `${slug}-cover`);
  console.log(`  ✓ ${coverImageUrl}`);

  const body = {
    ...movieFields,
    posterUrl,
    coverImageUrl,
    externalRatingUpdatedAt: new Date().toISOString().slice(0, 19),
  };

  const res = await fetch(`${BACKEND_BASE_URL}/movies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`[${slug}] ${res.status}: ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
  }
  console.log(`✓ ${data.title} oluşturuldu (id: ${data.id}, slug: ${data.slug})\n`);
}

async function main() {
  for (const slug of MOVIE_SLUGS) {
    await createMovie(slug);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
