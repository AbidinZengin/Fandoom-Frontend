#!/usr/bin/env node
// Stranger Things series entity'sini POST /api/series ile sıfırdan
// oluşturan tek seferlik script — create-it-welcome-to-derry.mjs'in aynı
// deseni. Idempotent: slug zaten varsa hiçbir şey yapmadan çıkar.
//
// Kullanım (PowerShell):
//   $env:AUTH_TOKEN="..."; node scripts/create-stranger-things.mjs
// Sadece deneme (Cloudinary'e yükler ama backend'e YAZMAZ):
//   node scripts/create-stranger-things.mjs   (AUTH_TOKEN verilmezse)

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
const SERIES_SLUG = 'stranger-things';

// Kullanıcı onayı (2026-09-06): poster = TMDb yüksek çözünürlük alternatifi
// (cVxVGwHce6xnW8UaVUggaPXbmoE), cover = TMDb ana backdrop'ı
// (56v2KjBlU4XaOv9rVYEQypROD7P).
const POSTER_SOURCE_URL = 'https://image.tmdb.org/t/p/original/cVxVGwHce6xnW8UaVUggaPXbmoE.jpg';
const COVER_SOURCE_URL = 'https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg';

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
  const posterUrl = await uploadToCloudinary(POSTER_SOURCE_URL, 'stranger-things-poster');
  console.log(`  ✓ ${posterUrl}`);

  console.log("Cover Cloudinary'e yükleniyor...");
  const coverImageUrl = await uploadToCloudinary(COVER_SOURCE_URL, 'stranger-things-cover');
  console.log(`  ✓ ${coverImageUrl}`);

  const body = {
    title: 'Stranger Things',
    titleTr: 'Stranger Things',
    originalTitle: 'Stranger Things',
    synopsis:
      "In the small town of Hawkins, Indiana, a group of childhood friends stumbles into a nightmare far bigger than any of them when a boy disappears and a mysterious girl with strange powers appears in his place. Their search uncovers a secret government laboratory, a parallel dimension called the Upside Down, and a string of otherworldly creatures that grow more monstrous with each passing year. Spanning from 1983 through the late '80s, the series follows Hawkins' kids — and the adults who refuse to give up on them — as ordinary friendship becomes the town's last line of defense against forces neither science nor the government can fully explain.",
    synopsisTr:
      "Indiana'nın küçük kasabası Hawkins'te, bir grup çocukluk arkadaşı, bir çocuğun kaybolup yerine tuhaf güçlere sahip gizemli bir kızın çıkmasıyla hiçbirinin hazır olmadığı bir kâbusun içine sürüklenir. Aradıkları gerçek, gizli bir devlet laboratuvarını, Tersyüz Dünya adı verilen paralel bir boyutu ve her geçen yıl daha canavarlaşan bir dizi öte-dünya yaratığını gün yüzüne çıkarır. 1983'ten 80'lerin sonuna uzanan dizi, Hawkins'in çocuklarını — ve onlardan vazgeçmeyi reddeden yetişkinleri — sıradan bir dostluğun, bilimin de devletin de tam olarak açıklayamadığı güçlere karşı kasabanın son savunma hattına dönüştüğü bir yolculukta izler.",
    firstAirDate: '2016-07-15',
    lastAirDate: '2025-12-31',
    status: 'ENDED',
    posterUrl,
    coverImageUrl,
    trailerUrl: null,
    contentRating: 'TV-14',
    originCountry: 'US',
    originalLanguage: 'en',
    externalRating: 8.553,
    externalVoteCount: 21770,
    externalRatingUpdatedAt: new Date().toISOString().slice(0, 19),
    imdbId: 'tt4574334',
    tmdbId: 66732,
    franchiseId: null,
    genreIds: [1, 3, 4, 5, 6], // Fantasy, Action, Adventure, Sci-Fi, Mystery (TMDb: Action & Adventure, Mystery, Sci-Fi & Fantasy)
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
  console.log(`\n✓ Stranger Things oluşturuldu (id: ${data.id}, slug: ${data.slug})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
