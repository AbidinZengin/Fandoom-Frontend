#!/usr/bin/env node
// From'nin ana karakterlerini (TMDb dizi karesi Cloudinary'e
// yüklenip + POST /characters ile) yazan tek seferlik seed script'i.
// seed-it-welcome-to-derry-characters.mjs ile aynı desen (idempotent/resume rapor).
//
// Kullanım (PowerShell):
//   $env:AUTH_TOKEN="..."; node scripts/seed-from-characters.mjs

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
const CLOUDINARY_FOLDER = 'fandoom/characters/from';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;
const SERIES_SLUG = 'from';

const missing = [];
if (!CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
if (!CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
if (missing.length > 0) {
  console.error(`Eksik ortam değişkeni: ${missing.join(', ')}`);
  process.exit(1);
}
if (!AUTH_TOKEN) {
  console.error('AUTH_TOKEN yok — bu script sadece backend yazımı içindir, dry-run modu yok.');
  process.exit(1);
}

function cloudinarySignature(params) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(toSign + CLOUDINARY_API_SECRET).digest('hex');
}

async function uploadToCloudinary(url, publicIdHint) {
  const blob = await fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Görsel indirilemedi: ${url}`);
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

function loadReport() {
  const path = resolve('scripts/output/from-characters-seed-report.json');
  if (!existsSync(path)) return { characters: {} };
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return { characters: {} };
  }
}
function saveReport(report) {
  mkdirSync(resolve('scripts/output'), { recursive: true });
  writeFileSync(resolve('scripts/output/from-characters-seed-report.json'), JSON.stringify(report, null, 2));
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
  const seriesRes = await fetch(`${BACKEND_BASE_URL}/series/slug/${SERIES_SLUG}`);
  if (!seriesRes.ok) {
    throw new Error(`From series bulunamadı (slug: ${SERIES_SLUG}) — önce create-from.mjs çalıştırılmalı.`);
  }
  const SERIES_ID = (await seriesRes.json()).id;

  const { characters } = JSON.parse(readFileSync(resolve('scripts/data/from-characters.json'), 'utf8'));
  const report = loadReport();

  for (const ch of characters) {
    const key = ch.name;
    if (report.characters[key]?.characterId) {
      console.log(`= ${ch.name}: zaten var, atlandı`);
      continue;
    }

    try {
      let imageUrl = report.characters[key]?.imageUrl;
      if (imageUrl) {
        console.log(`${ch.name}: görsel zaten yüklenmiş, tekrar yüklenmiyor.`);
      } else {
        console.log(`${ch.name}: görsel Cloudinary'e yükleniyor...`);
        imageUrl = await uploadToCloudinary(
          `${ch.imageSource}`,
          ch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        );
        console.log(`  ✓ ${imageUrl}`);
        report.characters[key] = { characterId: null, imageUrl };
        saveReport(report);
      }

      const created = await post(`/characters`, {
        name: ch.name,
        description: ch.description,
        descriptionTr: ch.descriptionTr,
        quote: null,
        imageUrl,
        subjectType: 'SERIES',
        subjectId: SERIES_ID,
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

  console.log('\nBitti. Rapor: scripts/output/from-characters-seed-report.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
