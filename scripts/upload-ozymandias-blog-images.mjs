#!/usr/bin/env node
// "Kumların Arasında Bir Kral" (Ozymandias) blog yazısının 5 yerel
// görselini (Teklif/Hank, Heykel-1/statü karşılaştırması, Böcek/varil,
// Ev/Skyler-Junior, kapanış/üçlü) Cloudinary'ye yükler ve blog kaydını
// PUT ile günceller. upload-skyler-blog-images.mjs'deki AYNI desen: PUT
// REPLACE-ALL olduğu için önce GET ile tam kaydı çekip aynen geri
// gönderiyoruz, sadece ilgili sceneKey'lerin null imageUrl alanlarını
// dolduruyoruz.
//
// Kullanım (PowerShell):
//   node scripts/upload-ozymandias-blog-images.mjs --blog-id <id> --write

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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
const CLOUDINARY_FOLDER = 'fandoom/blog';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;

const doWrite = process.argv.includes('--write');
const idIdx = process.argv.indexOf('--blog-id');
const BLOG_ID = idIdx !== -1 ? Number(process.argv[idIdx + 1]) : null;

const missing = [];
if (!CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
if (!CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
if (!BLOG_ID) missing.push('--blog-id <id>');
if (doWrite && !AUTH_TOKEN) missing.push('AUTH_TOKEN');
if (missing.length > 0) {
  console.error(`Eksik: ${missing.join(', ')}`);
  process.exit(1);
}

function cloudinarySignature(params) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(toSign + CLOUDINARY_API_SECRET).digest('hex');
}

async function uploadLocalFileToCloudinary(localPath, publicIdHint) {
  const fileBuffer = readFileSync(localPath);
  const timestamp = Math.floor(Date.now() / 1000);
  const signParams = { folder: CLOUDINARY_FOLDER, timestamp };
  const signature = cloudinarySignature(signParams);

  const form = new FormData();
  form.append('file', new Blob([fileBuffer]), `${publicIdHint}.jpg`);
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

// sceneKey -> { path, publicIdHint }
const LOCAL_IMAGES = {
  'scene-1': {
    path: 'd:/İndirilenler/From Klickpin.com- Build these beautiful social media plan tips that help you get the look without the stress with realistic ideas for busy days a.jpg',
    hint: 'ozymandias-hank-teklif',
  },
  'scene-2': {
    path: 'd:/İndirilenler/From Klickpin.com- 75 Trending Daily Reset Ideas for Right Now-pin-id-599260294191164008.jpg',
    hint: 'ozymandias-heykel-karsilastirma',
  },
  'scene-3': {
    path: 'd:/İndirilenler/From Klickpin.com- Handmade tailoring ideas packed with simple charm and useful ideas today for makers and beginners-pin-id-424745808577759159.jpg',
    hint: 'ozymandias-bocek-varil',
  },
  'scene-4': {
    path: 'd:/İndirilenler/From Klickpin.com- Bookmark these simple healthy lunch ideas perfect for saving sharing and recreating later with aesthetic touches that photograp.jpg',
    hint: 'ozymandias-ev-skyler-junior',
  },
  verdict: {
    path: 'd:/İndirilenler/From Klickpin.com- Bookmark these 11 Practical weekend getaway ideas that make everyday moments look more intentional memorable and beautifully st.jpg',
    hint: 'ozymandias-kapanis-uclu',
  },
};

function buildPutBody(current, urlsBySceneKey) {
  return {
    title: current.title,
    titleTr: current.titleTr,
    kicker: current.kicker,
    kickerTr: current.kickerTr,
    axis: current.axis,
    axisTr: current.axisTr,
    imageUrl: current.imageUrl,
    imageUrlLarge: current.imageUrlLarge,
    imageAlt: current.imageAlt,
    imageAltTr: current.imageAltTr,
    spoilerThroughSeasonNumber: current.spoilerThroughSeasonNumber,
    spoilerThroughEpisodeNumber: current.spoilerThroughEpisodeNumber,
    recommendedRank: current.recommendedRank,
    spoilerFree: current.spoilerFree,
    status: current.status,
    format: current.format,
    publishedAt: current.publishedAt,
    readingTimeMinutes: current.readingTimeMinutes,
    tags: (current.tags || []).map((tag) => {
      const hasSubject = tag.subjectType != null && tag.subjectId != null;
      return {
        subjectType: tag.subjectType,
        subjectId: tag.subjectId,
        seasonNumber: tag.seasonNumber,
        episodeNumber: tag.episodeNumber,
        franchiseId: hasSubject ? null : tag.franchiseId,
      };
    }),
    blocks: current.blocks.map((b) => {
      let imageUrl = b.imageUrl;
      if (b.blockType === 'IMAGE' && imageUrl == null && urlsBySceneKey[b.sceneKey]) {
        imageUrl = urlsBySceneKey[b.sceneKey];
      }
      return {
        blockType: b.blockType,
        sceneKey: b.sceneKey,
        content: b.content,
        contentTr: b.contentTr,
        imageUrl,
        imageAlt: b.imageAlt,
        imageAltTr: b.imageAltTr,
      };
    }),
  };
}

async function main() {
  mkdirSync(resolve('scripts/output'), { recursive: true });

  console.log('Blog çekiliyor: id', BLOG_ID);
  const current = await fetch(`${BACKEND_BASE_URL}/blogs/${BLOG_ID}`).then((r) => r.json());
  if (!current?.id) throw new Error('Blog backend’den alınamadı.');

  const urlsBySceneKey = {};
  for (const [sceneKey, { path, hint }] of Object.entries(LOCAL_IMAGES)) {
    console.log(`Cloudinary’ye yükleniyor: ${sceneKey} (${hint})`);
    const url = await uploadLocalFileToCloudinary(path, hint);
    console.log('  ✓', url);
    urlsBySceneKey[sceneKey] = url;
  }

  const body = buildPutBody(current, urlsBySceneKey);
  writeFileSync(resolve('scripts/output/ozymandias-blog-put-body.json'), JSON.stringify(body, null, 2));

  if (!doWrite) {
    console.log('\nDRY-RUN: backend’e PUT yazılmadı. Onay sonrası --write ile tekrar çalıştır.');
    return;
  }

  const res = await fetch(`${BACKEND_BASE_URL}/blogs/${BLOG_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`PUT /blogs/${BLOG_ID} başarısız (${res.status}): ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
  }
  console.log(`\n✓ Blog güncellendi. id=${data.id}, imageUrl=${data.imageUrl}`);
  writeFileSync(resolve('scripts/output/ozymandias-blog-put-response.json'), JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
