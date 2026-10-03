#!/usr/bin/env node
// Severance (series id 7) trivia kayıtlarını scripts/data/severance-trivia.json
// kaynağından Cloudinary'e görsel yükleyip POST /api/trivia ile yazan tek
// seferlik seed aracı. Görseller --images klasöründe NN.jpg (madde numarası)
// olarak hazır beklenir. Idempotent: rapor dosyasındaki maddeler atlanır.
//
// Kullanım (AUTH_TOKEN .env.local'dan okunur):
//   node scripts/seed-severance-trivia.mjs --images <klasör>

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
const FOLDER = 'fandoom/trivia/severance';
const BACKEND = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const TOKEN = process.env.AUTH_TOKEN;
const REPORT = resolve('scripts/output/severance-trivia-seed-report.json');

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

const { itemId, itemType, items } = JSON.parse(readFileSync('scripts/data/severance-trivia.json', 'utf8'));
const report = existsSync(REPORT) ? JSON.parse(readFileSync(REPORT, 'utf8')) : {};

for (const it of items) {
  if (report[it.n]) {
    console.log(`#${it.n} atlandı (kayıtlı id ${report[it.n].triviaId})`);
    continue;
  }
  const num = String(it.n).padStart(2, '0');
  const imageUrl = await upload(resolve(imagesDir, `${num}.jpg`), `severance-trivia-${num}`);
  const res = await fetch(`${BACKEND}/trivia`, {
    method: 'POST',
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
  if (res.status !== 201) {
    console.error(`#${it.n} BAŞARISIZ ${res.status}`, body);
    process.exit(1);
  }
  report[it.n] = { triviaId: body.id ?? body.data?.id, imageUrl };
  mkdirSync(resolve('scripts/output'), { recursive: true });
  writeFileSync(REPORT, JSON.stringify(report, null, 2));
  console.log(`#${it.n} yazıldı (id ${report[it.n].triviaId})`);
}
