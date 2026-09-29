#!/usr/bin/env node
// Tek seferlik düzeltme: kalitesi düşük bulunan karakter görsellerini yüz
// odaklı 2:3 kırpmalarla (scripts/output/character-crops/) değiştirir ve
// Billy Hargrove'u Stranger Things listesinin sonuna alır. Yalnızca listedeki
// kayıtlar PUT ile güncellenir. Eski Cloudinary görselleri SİLİNMEZ.
// Yüklemeden önce token doğrulanır: geçersizse Cloudinary'e hiçbir şey gitmez.
//
// Kullanım (PowerShell):
//   $env:AUTH_TOKEN="..."; node scripts/update-character-crops.mjs

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
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;
const CROPS = 'scripts/output/character-crops';

// slug + karakter adı + (varsa) yeni görsel dosyası / yeni sıra.
const JOBS = [
  { slug: 'severance', name: 'Ms. Casey', file: 'severance-ms-casey.jpg' },
  { slug: 'severance', name: 'Burt Goodman', file: 'severance-burt-goodman.jpg' },
  { slug: 'it-welcome-to-derry', name: 'Leroy Hanlon', file: 'it-welcome-to-derry-leroy-hanlon.jpg' },
  { slug: 'it-welcome-to-derry', name: 'Dick Hallorann', file: 'it-welcome-to-derry-dick-hallorann.jpg' },
  { slug: 'it-welcome-to-derry', name: 'Charlotte Hanlon', file: 'it-welcome-to-derry-charlotte-hanlon.jpg' },
  { slug: 'it-welcome-to-derry', name: 'Rose', file: 'it-welcome-to-derry-rose.jpg' },
  { slug: 'it-welcome-to-derry', name: 'Will Hanlon', file: 'it-welcome-to-derry-will-hanlon.jpg' },
  { slug: 'stranger-things', name: 'Billy Hargrove', billingOrder: 14 },
];

if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('Eksik Cloudinary ortam değişkeni.');
  process.exit(1);
}
if (!AUTH_TOKEN) {
  console.error('AUTH_TOKEN yok, bu script sadece backend yazımı içindir.');
  process.exit(1);
}

// Token'ı yüklemeden önce doğrula (süre + sunucu 401).
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
const probe = await fetch(`${BACKEND_BASE_URL}/me`, { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } });
if (probe.status === 401) {
  console.error('Backend tokeni reddetti (401), yükleme yapılmadı.');
  process.exit(1);
}

function sign(params) {
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  return createHash('sha1').update(toSign + CLOUDINARY_API_SECRET).digest('hex');
}

async function uploadToCloudinary(path, folder, hint) {
  const timestamp = Math.floor(Date.now() / 1000);
  const form = new FormData();
  form.append('file', new Blob([readFileSync(path)]), `${hint}.jpg`);
  form.append('api_key', CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', sign({ folder, timestamp }));
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Cloudinary upload başarısız');
  return data.secure_url;
}

async function put(id, body) {
  const res = await fetch(`${BACKEND_BASE_URL}/characters/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${res.status}: ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
  return data;
}

const seriesCache = {};
async function charactersOf(slug) {
  if (!seriesCache[slug]) {
    const s = await fetch(`${BACKEND_BASE_URL}/series/slug/${slug}`).then((r) => r.json());
    const list = await fetch(`${BACKEND_BASE_URL}/series/${s.id}/characters`).then((r) => r.json());
    seriesCache[slug] = list;
  }
  return seriesCache[slug];
}

for (const job of JOBS) {
  try {
    const record = (await charactersOf(job.slug)).find((c) => c.name === job.name);
    if (!record) throw new Error('backend kaydı bulunamadı');

    let imageUrl = record.imageUrl;
    if (job.file) {
      console.log(`${job.name}: yeni görsel yükleniyor...`);
      imageUrl = await uploadToCloudinary(
        resolve(CROPS, job.file),
        `fandoom/characters/${job.slug}`,
        job.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      );
    }

    await put(record.id, {
      name: record.name,
      description: record.description,
      descriptionTr: record.descriptionTr,
      quote: record.quote,
      imageUrl,
      subjectType: record.subjectType,
      subjectId: record.subjectId,
      billingOrder: job.billingOrder ?? record.billingOrder,
    });
    console.log(`  ✓ ${job.name} güncellendi (id: ${record.id})`);
  } catch (err) {
    console.log(`  ✗ ${job.name}: ${err.message}`);
  }
}
console.log('\nBitti. Eski Cloudinary görselleri silinmedi.');
