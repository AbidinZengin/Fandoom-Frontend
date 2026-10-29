#!/usr/bin/env node
// Pluribus trivia görsellerini Cloudinary'ye yükleyip PUT /api/trivia/{id} ile
// kayda bağlar. Kartlar 2:3 dikey ve object-fit: cover olduğu için görseller
// önceden 2:3 kırpılmış NN.jpg olarak --images klasöründe beklenir (rev:2).
// rev:1 görseller (portreler) zaten kayıtlıdır, dokunulmaz. JSON'da görseli
// kalkan madde (image yok) PUT ile görselsiz hâle getirilir; backend eski
// görseli Cloudinary'den siler, bu yüzden yeni görsel FARKLI public_id alır.
// PUT tam değiştirme olduğundan metin alanları JSON'dan yeniden gönderilir.
// Idempotent: rapordaki imageRev ile karşılaştırılır.
//
// Kullanım (AUTH_TOKEN ve Cloudinary anahtarları .env.local'dan okunur):
//   node scripts/update-pluribus-trivia-images.mjs --images <klasör>

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
    if (!(key in process.env)) process.env[key] = trimmed.slice(eq + 1).trim();
  }
}
loadDotEnvLocal();

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME || 'b0bc5njd';
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const FOLDER = 'fandoom/trivia/pluribus';
const BACKEND = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const TOKEN = process.env.AUTH_TOKEN;
const REPORT = resolve('scripts/output/pluribus-trivia-seed-report.json');

const imagesDir = process.argv[process.argv.indexOf('--images') + 1];
if (!imagesDir || !TOKEN || !API_KEY || !API_SECRET) {
  console.error('Gerekli: --images <klasör>, AUTH_TOKEN, CLOUDINARY_API_KEY/SECRET');
  process.exit(1);
}

async function upload(file, publicId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `folder=${FOLDER}&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
  const form = new FormData();
  form.append('file', new Blob([readFileSync(file)]), `${publicId}.jpg`);
  form.append('api_key', API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('folder', FOLDER);
  form.append('public_id', publicId);
  form.append('signature', createHash('sha1').update(toSign).digest('hex'));
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Cloudinary upload başarısız');
  return data.secure_url;
}

const { itemId, itemType, items } = JSON.parse(readFileSync('scripts/data/pluribus-trivia.json', 'utf8'));
const report = JSON.parse(readFileSync(REPORT, 'utf8'));

for (const it of items) {
  const rec = report[it.n];
  if (!rec?.triviaId) {
    console.error(`#${it.n} raporda kayıt yok, önce seed çalışmalı`);
    process.exit(1);
  }
  const wantRev = it.image?.rev ?? 0;
  const haveRev = rec.imageUrl ? (rec.imageRev ?? 1) : 0;
  if (wantRev === haveRev) continue;

  let imageUrl;
  if (it.image) {
    const num = String(it.n).padStart(2, '0');
    imageUrl = await upload(resolve(imagesDir, `${num}.jpg`), `pluribus-trivia-${num}-r${wantRev}`);
  }
  const res = await fetch(`${BACKEND}/trivia/${rec.triviaId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({
      itemId,
      itemType,
      title: it.title,
      titleTr: it.titleTr,
      content: it.content,
      contentTr: it.contentTr,
      imageUrl,
      tags: it.tags,
      isSpoiler: false,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status !== 200) {
    console.error(`#${it.n} PUT BAŞARISIZ ${res.status}`, body);
    process.exit(1);
  }
  report[it.n] = { triviaId: rec.triviaId, ...(imageUrl ? { imageUrl, imageRev: wantRev } : {}) };
  mkdirSync(resolve('scripts/output'), { recursive: true });
  writeFileSync(REPORT, JSON.stringify(report, null, 2));
  console.log(`#${it.n} ${imageUrl ? 'görsel güncellendi' : 'görsel kaldırıldı'} (id ${rec.triviaId})`);
}
console.log('bitti');
