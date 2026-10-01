#!/usr/bin/env node
// Pluribus karakterlerinin görsellerini (kırmızı-halı headshot yerine gerçek
// dizi karesi) ve biyografilerini (em dash temizlendi) günceller — mevcut
// kayıtları PUT /characters/:id ile düzenler, eski Cloudinary görsellerini
// siler. seed-pluribus-characters.mjs'in upload deseni yeniden kullanıldı.
//
// Kullanım (PowerShell):
//   $env:AUTH_TOKEN="..."; node scripts/update-pluribus-characters.mjs

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
const CLOUDINARY_FOLDER = 'fandoom/characters/pluribus';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;
const SERIES_SLUG = 'pluribus';

// İlk (kırmızı-halı headshot) denemesinden kalan, artık kullanılmayan
// Cloudinary görselleri — güncelleme başarılı olursa temizlenir.
const OLD_PUBLIC_IDS = [
  'fandoom/characters/pluribus/lprzoshzkt2555hkebcx',
  'fandoom/characters/pluribus/eltu6hqc254hlvchpsoj',
  'fandoom/characters/pluribus/avv6i2owy98jlp8reis7',
  'fandoom/characters/pluribus/ydcgu7ulwlxvsgudwlj9',
];

if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('Eksik Cloudinary ortam değişkeni.');
  process.exit(1);
}
if (!AUTH_TOKEN) {
  console.error('AUTH_TOKEN yok — bu script sadece backend yazımı içindir, dry-run modu yok.');
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
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Cloudinary upload başarısız');
  return { url: data.secure_url, publicId: data.public_id };
}

async function destroyCloudinary(publicId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign({ public_id: publicId, timestamp });
  const form = new FormData();
  form.append('public_id', publicId);
  form.append('api_key', CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`, {
    method: 'POST',
    body: form,
  });
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
  if (!seriesRes.ok) throw new Error(`Pluribus series bulunamadı (slug: ${SERIES_SLUG}).`);
  const SERIES_ID = (await seriesRes.json()).id;

  const existing = await fetch(`${BACKEND_BASE_URL}/series/${SERIES_ID}/characters`).then((r) => r.json());
  const { characters } = JSON.parse(readFileSync(resolve('scripts/data/pluribus-characters.json'), 'utf8'));

  let allOk = true;

  for (const ch of characters) {
    const record = existing.find((c) => c.name === ch.name);
    if (!record) {
      console.log(`✗ ${ch.name}: backend'de bulunamadı, atlandı`);
      allOk = false;
      continue;
    }

    try {
      console.log(`${ch.name}: yeni görsel yükleniyor...`);
      let blob;
      if (ch.localImagePath) {
        blob = new Blob([readFileSync(ch.localImagePath)]);
      } else {
        const res = await fetch(ch.imageSource, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) throw new Error(`Görsel indirilemedi: ${ch.imageSource}`);
        blob = await res.blob();
      }
      const { url: imageUrl } = await uploadToCloudinary(blob, ch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      console.log(`  ✓ ${imageUrl}`);

      await put(`/characters/${record.id}`, {
        name: ch.name,
        description: ch.description,
        descriptionTr: ch.descriptionTr,
        quote: null,
        imageUrl,
        subjectType: 'SERIES',
        subjectId: SERIES_ID,
        billingOrder: ch.billingOrder,
      });
      console.log(`  ✓ ${ch.name} güncellendi (id: ${record.id})`);
    } catch (err) {
      console.log(`  ✗ ${ch.name}: ${err.message}`);
      allOk = false;
    }
  }

  if (allOk) {
    console.log('\nEski görseller Cloudinary\'den temizleniyor...');
    for (const id of OLD_PUBLIC_IDS) {
      const result = await destroyCloudinary(id);
      console.log(`  ${id} -> ${result}`);
    }
  } else {
    console.log('\nBir veya daha fazla karakter güncellenemedi — eski görseller GÜVENLİK İÇİN silinmedi.');
  }

  console.log('\nBitti.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
