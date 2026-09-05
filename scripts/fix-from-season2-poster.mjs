#!/usr/bin/env node
// Tek seferlik düzeltme: fetch-season-posters.mjs dil filtresi olmadan en
// yüksek çözünürlüklü posteri seçtiği için From Season 2'ye yanlışlıkla
// Portekizce ("ORIGEM" yazılı) bir poster atanmıştı. TMDb'nin kendi resmi
// season.poster_path'i (İngilizce/nötr) ile değiştirir.
//
// Kullanım (PowerShell):
//   $env:AUTH_TOKEN="..."; node scripts/fix-from-season2-poster.mjs

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
const SOURCE_URL = 'https://image.tmdb.org/t/p/original/cJmfLHnF95XkoIr9as2bBK5cPeK.jpg';

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
  const series = await fetch(`${BACKEND_BASE_URL}/series/slug/from`).then((r) => r.json());
  const season2 = series.seasons.find((s) => s.seasonNumber === 2);
  if (!season2) throw new Error('Season 2 bulunamadı');

  const posterUrl = await uploadToCloudinary(SOURCE_URL, 'from-s2-poster-v2');
  console.log(`  ✓ ${posterUrl}`);

  const res = await fetch(`${BACKEND_BASE_URL}/seasons/${season2.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AUTH_TOKEN}` },
    body: JSON.stringify({ id: season2.id, seasonNumber: season2.seasonNumber, title: season2.title, airDate: season2.airDate, posterUrl }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(`PUT /seasons/${season2.id} başarısız (${res.status}): ${body?.message || res.statusText}`);
  }
  console.log('✓ Season 2 posteri düzeltildi.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
