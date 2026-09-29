#!/usr/bin/env node
// It: Welcome to Derry karakterlerinin görsellerini (tek kare kırpma yerine
// resmi karakter poster/promo portreleri) ve biyografilerini günceller. Adı
// eşleşen kayıt PUT /characters/:id ile düzenlenir, backend'de olmayan
// karakter (Lilly, Marge, General Shaw) POST ile eklenir. Eski Cloudinary
// görselleri SİLİNMEZ; sadece scripts/output/it-welcome-to-derry-old-images.json
// dosyasına yazılır (temizlik ayrı onaylı adım).
//
// Kullanım (PowerShell):
//   $env:AUTH_TOKEN="..."; node scripts/update-it-welcome-to-derry-characters.mjs

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
const CLOUDINARY_FOLDER = 'fandoom/characters/it-welcome-to-derry';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;
const SERIES_SLUG = 'it-welcome-to-derry';

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
  if (!seriesRes.ok) throw new Error(`It: Welcome to Derry series bulunamadı (slug: ${SERIES_SLUG}).`);
  const SERIES_ID = (await seriesRes.json()).id;

  const existing = await fetch(`${BACKEND_BASE_URL}/series/${SERIES_ID}/characters`).then((r) => r.json());
  const { characters } = JSON.parse(readFileSync(resolve('scripts/data/it-welcome-to-derry-characters.json'), 'utf8'));

  // Değiştirilen kayıtların eski görselleri, sonradan temizlik için saklanır.
  const oldImages = existing.filter((c) => c.imageUrl).map((c) => ({ name: c.name, id: c.id, imageUrl: c.imageUrl }));
  mkdirSync(resolve('scripts/output'), { recursive: true });
  writeFileSync(resolve('scripts/output/it-welcome-to-derry-old-images.json'), JSON.stringify(oldImages, null, 2));

  for (const ch of characters) {
    const record = existing.find((c) => c.name === ch.name);
    try {
      console.log(`${ch.name}: yeni görsel yükleniyor...`);
      const res = await fetch(ch.imageSource, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error(`Görsel indirilemedi: ${ch.imageSource}`);
      const imageUrl = await uploadToCloudinary(await res.blob(), ch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
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
      } else {
        const created = await send('POST', '/characters', body);
        console.log(`  ✓ ${ch.name} oluşturuldu (id: ${created.id})`);
      }
    } catch (err) {
      console.log(`  ✗ ${ch.name}: ${err.message}`);
    }
  }

  console.log('\nBitti. Eski görseller silinmedi: scripts/output/it-welcome-to-derry-old-images.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
