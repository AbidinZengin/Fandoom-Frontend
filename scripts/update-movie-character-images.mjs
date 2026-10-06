#!/usr/bin/env node
// Filmin MEVCUT karakter kayıtlarının görselini yeniler: scripts/data/<film-slug>-characters.json
// içindeki localImagePath kırpmasını Cloudinary'e yükler, karakteri PUT /characters/:id ile
// günceller (yalnız imageUrl değişir; diğer alanlar backend'deki hâliyle geri gönderilir).
// Eski Cloudinary görselleri SİLİNMEZ. Backend'de olmayan karakter atlanır (onları
// seed-movie-characters.mjs ekler). Token yüklemeden önce doğrulanır.
//
// Kullanım (PowerShell):
//   node scripts/update-movie-character-images.mjs <film-slug>            # dry-run
//   $env:AUTH_TOKEN="..."; node scripts/update-movie-character-images.mjs <film-slug> --write

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
    if (!(key in process.env)) process.env[key] = trimmed.slice(eq + 1).trim();
  }
}
loadDotEnvLocal();

const MOVIE_SLUG = process.argv[2];
const DRY_RUN = !process.argv.includes('--write');
if (!MOVIE_SLUG || !existsSync(resolve(`scripts/data/${MOVIE_SLUG}-characters.json`))) {
  console.error('Kullanım: node scripts/update-movie-character-images.mjs <film-slug> [--write]');
  process.exit(1);
}

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'b0bc5njd';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_FOLDER = `fandoom/characters/${MOVIE_SLUG}`;
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;

if (!DRY_RUN) {
  if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('Eksik Cloudinary ortam değişkeni.');
    process.exit(1);
  }
  if (!AUTH_TOKEN) {
    console.error('AUTH_TOKEN yok.');
    process.exit(1);
  }
  const { exp } = JSON.parse(Buffer.from(AUTH_TOKEN.split('.')[1], 'base64url').toString());
  if (exp * 1000 < Date.now()) {
    console.error('AUTH_TOKEN süresi dolmuş, hiçbir şey yüklenmedi.');
    process.exit(1);
  }
}

async function uploadToCloudinary(path, hint) {
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `folder=${CLOUDINARY_FOLDER}&timestamp=${timestamp}`;
  const form = new FormData();
  form.append('file', new Blob([readFileSync(path)]), `${hint}.jpg`);
  form.append('api_key', CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('folder', CLOUDINARY_FOLDER);
  form.append('signature', createHash('sha1').update(toSign + CLOUDINARY_API_SECRET).digest('hex'));
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Cloudinary upload başarısız');
  return data.secure_url;
}

async function put(id, body) {
  const res = await fetch(`${BACKEND_BASE_URL}/characters/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${res.status}: ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
  return data;
}

const movie = await fetch(`${BACKEND_BASE_URL}/movies/slug/${MOVIE_SLUG}`).then((r) => r.json());
const existing = await fetch(`${BACKEND_BASE_URL}/movies/${movie.id}/characters`).then((r) => r.json());
const { characters } = JSON.parse(readFileSync(resolve(`scripts/data/${MOVIE_SLUG}-characters.json`), 'utf8'));

for (const ch of characters) {
  const record = existing.find((c) => c.name === ch.name);
  if (!record) {
    console.log(`= ${ch.name}: backend'de yok, atlandı (seed ekler)`);
    continue;
  }
  if (DRY_RUN) {
    console.log(`dry-run: ${ch.name} (id ${record.id}) görseli ${ch.localImagePath} ile yenilenecek (YAZILMADI).`);
    continue;
  }
  try {
    const imageUrl = await uploadToCloudinary(resolve(ch.localImagePath), ch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-v2');
    await put(record.id, {
      name: record.name,
      description: record.description,
      descriptionTr: record.descriptionTr,
      quote: record.quote,
      imageUrl,
      subjectType: record.subjectType,
      subjectId: record.subjectId,
      billingOrder: record.billingOrder,
    });
    console.log(`  ✓ ${ch.name} güncellendi (id: ${record.id})`);
  } catch (err) {
    console.log(`  ✗ ${ch.name}: ${err.message}`);
  }
}
console.log('\nBitti. Eski Cloudinary görselleri silinmedi.');
