#!/usr/bin/env node
// The Boys karakterlerinin görsellerini resmî promo portreleriyle (Fandom
// wiki'deki S3/S4 karakter portreleri) günceller ve eksik karakterleri ekler.
// Mevcut kayıtlar ada göre PUT /characters/:id ile güncellenir, bulunamayanlar
// POST /characters ile oluşturulur. Eski Cloudinary görselleri SİLİNMEZ; hangi
// eski URL'nin yerine ne geldiği rapora yazılır, temizlik kullanıcının kararı.
//
// JSON'daki `cloudinaryCrop` alanı Cloudinary'nin upload-time `transformation`
// parametresidir (ör. tam boy stüdyo portresinden üst %55'i kırpar); alan yoksa
// görsel olduğu gibi yüklenir.
//
// Kullanım (PowerShell):
//   $env:AUTH_TOKEN="..."; node scripts/update-the-boys-characters.mjs

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
const CLOUDINARY_FOLDER = 'fandoom/characters/the-boys';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;
const SERIES_SLUG = 'the-boys';
const REPORT_PATH = resolve('scripts/output/the-boys-characters-update-report.json');

if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('Eksik Cloudinary ortam değişkeni.');
  process.exit(1);
}
if (!AUTH_TOKEN) {
  console.error('AUTH_TOKEN yok, bu script sadece backend yazımı içindir, dry-run modu yok.');
  process.exit(1);
}

function sign(params) {
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  return createHash('sha1').update(toSign + CLOUDINARY_API_SECRET).digest('hex');
}

async function uploadToCloudinary(blob, publicIdHint, transformation) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signParams = { folder: CLOUDINARY_FOLDER, timestamp };
  if (transformation) signParams.transformation = transformation;
  const form = new FormData();
  form.append('file', blob, `${publicIdHint}.jpg`);
  form.append('api_key', CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('folder', CLOUDINARY_FOLDER);
  if (transformation) form.append('transformation', transformation);
  form.append('signature', sign(signParams));
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Cloudinary upload başarısız');
  return data.secure_url;
}

async function send(method, path, body) {
  const res = await fetch(`${BACKEND_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${res.status}: ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
  return data;
}

// Yüklemeye başlamadan önce token'ı doğrular: süresi dolmuşsa veya sunucu
// 401 veriyorsa Cloudinary'e HİÇBİR şey yüklenmeden çıkılır.
async function assertTokenValid() {
  try {
    const { exp } = JSON.parse(Buffer.from(AUTH_TOKEN.split('.')[1], 'base64url').toString());
    if (exp && exp * 1000 < Date.now()) {
      console.error('AUTH_TOKEN süresi dolmuş, yükleme yapılmadı. .env.local içindeki tokeni yenile.');
      process.exit(1);
    }
  } catch {
    console.error('AUTH_TOKEN geçerli bir JWT değil, yükleme yapılmadı.');
    process.exit(1);
  }
  const res = await fetch(`${BACKEND_BASE_URL}/me`, { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } });
  if (res.status === 401) {
    console.error('Backend tokeni reddetti (401), yükleme yapılmadı.');
    process.exit(1);
  }
}

async function main() {
  await assertTokenValid();
  const seriesRes = await fetch(`${BACKEND_BASE_URL}/series/slug/${SERIES_SLUG}`);
  if (!seriesRes.ok) throw new Error(`The Boys series bulunamadı (slug: ${SERIES_SLUG}).`);
  const SERIES_ID = (await seriesRes.json()).id;

  const existing = await fetch(`${BACKEND_BASE_URL}/series/${SERIES_ID}/characters`).then((r) => r.json());
  const { characters } = JSON.parse(readFileSync(resolve('scripts/data/the-boys-characters.json'), 'utf8'));
  const report = { replacedImages: [] };

  for (const ch of characters) {
    const record = existing.find((c) => c.name === ch.name);
    try {
      console.log(`${ch.name}: görsel indirilip yükleniyor...`);
      const res = await fetch(ch.imageSource, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error(`Görsel indirilemedi: ${ch.imageSource}`);
      const blob = await res.blob();
      const imageUrl = await uploadToCloudinary(
        blob,
        ch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        ch.cloudinaryCrop,
      );
      console.log(`  ✓ ${imageUrl}`);

      const body = {
        name: ch.name,
        description: ch.description,
        descriptionTr: ch.descriptionTr,
        quote: null,
        imageUrl,
        subjectType: 'SERIES',
        subjectId: SERIES_ID,
        billingOrder: ch.billingOrder,
      };

      if (record) {
        await send('PUT', `/characters/${record.id}`, body);
        console.log(`  ✓ ${ch.name} güncellendi (id: ${record.id})`);
        report.replacedImages.push({ name: ch.name, characterId: record.id, oldImageUrl: record.imageUrl, newImageUrl: imageUrl });
      } else {
        const created = await send('POST', '/characters', body);
        console.log(`  ✓ ${ch.name} oluşturuldu (id: ${created.id})`);
      }
    } catch (err) {
      console.log(`  ✗ ${ch.name}: ${err.message}`);
    }
  }

  mkdirSync(resolve('scripts/output'), { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\nBitti. Eski görsel URL'leri (silinmedi) rapor: ${REPORT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
