#!/usr/bin/env node
// House of the Dragon'ın 14 ana karakterini (gerçek dizi karesi Cloudinary'e
// yüklenip + POST /characters ile) yazan tek seferlik seed script'i.
// seed-pluribus-characters.mjs'in aynı deseni: idempotent, resumable rapor.
//
// Kullanım (PowerShell):
//   $env:AUTH_TOKEN="..."; node scripts/seed-house-of-the-dragon-characters.mjs

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
const CLOUDINARY_FOLDER = 'fandoom/characters/house-of-the-dragon';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;
const SERIES_SLUG = 'house-of-the-dragon';

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
  return data.secure_url;
}

function loadReport() {
  const path = resolve('scripts/output/house-of-the-dragon-characters-seed-report.json');
  if (!existsSync(path)) return { characters: {} };
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return { characters: {} };
  }
}
function saveReport(report) {
  mkdirSync(resolve('scripts/output'), { recursive: true });
  writeFileSync(resolve('scripts/output/house-of-the-dragon-characters-seed-report.json'), JSON.stringify(report, null, 2));
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
  if (!seriesRes.ok) throw new Error(`House of the Dragon series bulunamadı (slug: ${SERIES_SLUG}).`);
  const SERIES_ID = (await seriesRes.json()).id;

  const { characters } = JSON.parse(readFileSync(resolve('scripts/data/house-of-the-dragon-characters.json'), 'utf8'));
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
        const blob = new Blob([readFileSync(ch.localImagePath)]);
        imageUrl = await uploadToCloudinary(blob, ch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
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

  console.log('\nBitti. Rapor: scripts/output/house-of-the-dragon-characters-seed-report.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
