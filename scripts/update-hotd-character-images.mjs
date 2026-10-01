#!/usr/bin/env node
// Larys/Jacaerys/Aemond'ın kötü kadrajlı ilk görsellerini (aşırı yakın kesim
// profil / iki-kişilik kırpma) daha net dizi kareleriyle değiştirir.
// update-pluribus-characters.mjs'in aynı deseni.
//
// Kullanım (PowerShell):
//   $env:AUTH_TOKEN="..."; node scripts/update-hotd-character-images.mjs

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
const CLOUDINARY_FOLDER = 'fandoom/characters/house-of-the-dragon';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;
const SERIES_SLUG = 'house-of-the-dragon';

const UPDATES = [
  { name: 'Larys Strong', localImagePath: 'C:/Users/dell/.claude/jobs/eaed868d/tmp/hotd_real/larys2.jpg', oldPublicId: 'fandoom/characters/house-of-the-dragon/enetndjqfekm2b5m35c1' },
  { name: 'Jacaerys Velaryon', localImagePath: 'C:/Users/dell/.claude/jobs/eaed868d/tmp/hotd_real/jace2.jpg', oldPublicId: 'fandoom/characters/house-of-the-dragon/kg3t5d6lesh04htxpa0t' },
  { name: 'Aemond Targaryen', localImagePath: 'C:/Users/dell/.claude/jobs/eaed868d/tmp/hotd_real/aemond2.jpg', oldPublicId: 'fandoom/characters/house-of-the-dragon/ewagmzpzwf8astg1bqzs' },
];

if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('Eksik Cloudinary ortam değişkeni.');
  process.exit(1);
}
if (!AUTH_TOKEN) {
  console.error('AUTH_TOKEN yok.');
  process.exit(1);
}

function sign(params) {
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  return createHash('sha1').update(toSign + CLOUDINARY_API_SECRET).digest('hex');
}

async function uploadToCloudinary(blob, publicIdHint) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign({ folder: CLOUDINARY_FOLDER, timestamp });
  const form = new FormData();
  form.append('file', blob, `${publicIdHint}.jpg`);
  form.append('api_key', CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('folder', CLOUDINARY_FOLDER);
  form.append('signature', signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Cloudinary upload başarısız');
  return data.secure_url;
}

async function destroyCloudinary(publicId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign({ public_id: publicId, timestamp });
  const form = new FormData();
  form.append('public_id', publicId);
  form.append('api_key', CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`, { method: 'POST', body: form });
  const data = await res.json();
  return data.result;
}

async function put(path, body) {
  const res = await fetch(`${BACKEND_BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${res.status}: ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
  return data;
}

async function main() {
  const seriesRes = await fetch(`${BACKEND_BASE_URL}/series/slug/${SERIES_SLUG}`);
  if (!seriesRes.ok) throw new Error(`House of the Dragon series bulunamadı.`);
  const SERIES_ID = (await seriesRes.json()).id;
  const existing = await fetch(`${BACKEND_BASE_URL}/series/${SERIES_ID}/characters`).then((r) => r.json());

  for (const u of UPDATES) {
    const record = existing.find((c) => c.name === u.name);
    if (!record) {
      console.log(`✗ ${u.name}: bulunamadı`);
      continue;
    }
    try {
      console.log(`${u.name}: yeni görsel yükleniyor...`);
      const blob = new Blob([readFileSync(u.localImagePath)]);
      const imageUrl = await uploadToCloudinary(blob, u.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      console.log(`  ✓ ${imageUrl}`);

      await put(`/characters/${record.id}`, {
        name: record.name,
        description: record.description,
        descriptionTr: record.descriptionTr,
        quote: record.quote,
        imageUrl,
        subjectType: record.subjectType,
        subjectId: record.subjectId,
        billingOrder: record.billingOrder,
      });
      console.log(`  ✓ ${u.name} güncellendi (id: ${record.id})`);

      const result = await destroyCloudinary(u.oldPublicId);
      console.log(`  eski görsel silindi: ${u.oldPublicId} -> ${result}`);
    } catch (err) {
      console.log(`  ✗ ${u.name}: ${err.message}`);
    }
  }

  console.log('\nBitti.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
