#!/usr/bin/env node
// Filmin karakterlerini (yüz odaklı 2:3 kırpma görselleri Cloudinary'e yüklenip
// + POST /characters ile) yazan seed script'i. Film karakterleri: subjectType 'MOVIE'.
// Kullanım (PowerShell): $env:AUTH_TOKEN="..."; node scripts/seed-movie-characters.mjs <film-slug>
//

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
const MOVIE_SLUG = process.argv[2];
if (!MOVIE_SLUG || !existsSync(resolve(`scripts/data/${MOVIE_SLUG}-characters.json`))) {
  console.error('Kullanım: node scripts/seed-movie-characters.mjs <film-slug>  (scripts/data/<slug>-characters.json olmalı)');
  process.exit(1);
}
const CLOUDINARY_FOLDER = `fandoom/characters/${MOVIE_SLUG}`;
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;
const REPORT_PATH = resolve(`scripts/output/${MOVIE_SLUG}-characters-seed-report.json`);

if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('Eksik Cloudinary ortam değişkeni.');
  process.exit(1);
}
if (!AUTH_TOKEN) {
  console.error('AUTH_TOKEN yok, bu script sadece backend yazımı içindir, dry-run modu yok.');
  process.exit(1);
}

// Token'ı yüklemeden önce doğrula (süre + sunucu 401).
async function assertTokenValid() {
  try {
    const { exp } = JSON.parse(Buffer.from(AUTH_TOKEN.split('.')[1], 'base64url').toString());
    if (exp && exp * 1000 < Date.now()) {
      console.error('AUTH_TOKEN süresi dolmuş, yükleme yapılmadı.');
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

function cloudinarySignature(params) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(toSign + CLOUDINARY_API_SECRET).digest('hex');
}

async function uploadToCloudinary(path, publicIdHint) {
  const timestamp = Math.floor(Date.now() / 1000);
  const form = new FormData();
  form.append('file', new Blob([readFileSync(path)]), `${publicIdHint}.jpg`);
  form.append('api_key', CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('folder', CLOUDINARY_FOLDER);
  form.append('signature', cloudinarySignature({ folder: CLOUDINARY_FOLDER, timestamp }));

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(uploadData.error?.message || 'Cloudinary upload başarısız');
  return uploadData.secure_url;
}

function loadReport() {
  if (!existsSync(REPORT_PATH)) return { characters: {} };
  try {
    return JSON.parse(readFileSync(REPORT_PATH, 'utf8'));
  } catch {
    return { characters: {} };
  }
}
function saveReport(report) {
  mkdirSync(resolve('scripts/output'), { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
}

async function post(path, body) {
  const res = await fetch(`${BACKEND_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`${res.status}: ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
  }
  return data;
}

async function main() {
  await assertTokenValid();

  const movieRes = await fetch(`${BACKEND_BASE_URL}/movies/slug/${MOVIE_SLUG}`);
  if (!movieRes.ok) throw new Error(`Film bulunamadı (slug: ${MOVIE_SLUG}).`);
  const MOVIE_ID = (await movieRes.json()).id;

  const existing = await fetch(`${BACKEND_BASE_URL}/movies/${MOVIE_ID}/characters`).then((r) => r.json());
  const { characters } = JSON.parse(readFileSync(resolve(`scripts/data/${MOVIE_SLUG}-characters.json`), 'utf8'));
  const report = loadReport();

  for (const ch of characters) {
    const key = ch.name;
    if (existing.some((c) => c.name === ch.name) || report.characters[key]?.characterId) {
      console.log(`= ${ch.name}: zaten var, atlandı`);
      continue;
    }

    try {
      let imageUrl = report.characters[key]?.imageUrl;
      if (imageUrl) {
        console.log(`${ch.name}: görsel zaten yüklenmiş, tekrar yüklenmiyor.`);
      } else {
        console.log(`${ch.name}: görsel Cloudinary'e yükleniyor...`);
        imageUrl = await uploadToCloudinary(resolve(ch.localImagePath), ch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        console.log(`  ✓ ${imageUrl}`);
        report.characters[key] = { characterId: null, imageUrl };
        saveReport(report);
      }

      const created = await post('/characters', {
        name: ch.name,
        description: ch.description,
        descriptionTr: ch.descriptionTr,
        quote: null,
        imageUrl,
        subjectType: 'MOVIE',
        subjectId: MOVIE_ID,
        billingOrder: ch.billingOrder,
      });
      console.log(`  ✓ ${ch.name} oluşturuldu (id: ${created.id})`);
      report.characters[key] = { characterId: created.id, imageUrl };
      saveReport(report);
    } catch (err) {
      console.log(`  ✗ ${ch.name}: ${err.message}`);
      report.characters[key] = { characterId: null, imageUrl: report.characters[key]?.imageUrl, error: err.message };
      saveReport(report);
    }
  }

  console.log(`\nBitti. Rapor: scripts/output/${MOVIE_SLUG}-characters-seed-report.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
