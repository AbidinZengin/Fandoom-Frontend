#!/usr/bin/env node
// Skyler White blog yazısının (id: 301, slug: skyler-white-aslinda-neden-hakliydi)
// hâlâ eksik olan 3 yerel görselini (kapak + Yükleme Hatası çifti) Cloudinary'ye
// yükler ve blog kaydını PUT ile günceller. PUT REPLACE-ALL olduğu için önce
// GET ile tam kaydı çekip aynen geri gönderiyoruz, sadece 3 imageUrl alanını
// değiştiriyoruz (bkz. seed-blog-translations.mjs'deki aynı desen).
//
// Kullanım (PowerShell):
//   node scripts/upload-skyler-blog-images.mjs --write

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
const BLOG_ID = 301;

const doWrite = process.argv.includes('--write');

const missing = [];
if (!CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
if (!CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
if (doWrite && !AUTH_TOKEN) missing.push('AUTH_TOKEN');
if (missing.length > 0) {
  console.error(`Eksik ortam değişkeni: ${missing.join(', ')}`);
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

const LOCAL_IMAGES = {
  cover: 'd:/İndirilenler/From Klickpin.com- 478226054155762872-pin-id-478226054155762872.jpg',
  scene3a: 'd:/İndirilenler/638470.jpg',
  scene3b: 'd:/İndirilenler/638471.jpg',
};

function buildPutBody(current, urls) {
  return {
    title: current.title,
    titleTr: current.titleTr,
    kicker: current.kicker,
    kickerTr: current.kickerTr,
    axis: current.axis,
    axisTr: current.axisTr,
    imageUrl: urls.cover,
    imageUrlLarge: urls.cover,
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
    blocks: current.blocks.map((block) => {
      let imageUrl = block.imageUrl;
      if (block.sceneKey === 'scene-3' && block.blockType === 'IMAGE') {
        // Sırayla iki IMAGE bloğu var (scene3a: Walt net/Skyler bulanık, scene3b: tersi).
        // orderIndex'e göre ayırt ediyoruz: ilk IMAGE -> scene3a, ikinci -> scene3b.
        imageUrl = block.__isSecondSceneImage ? urls.scene3b : urls.scene3a;
      }
      return {
        blockType: block.blockType,
        sceneKey: block.sceneKey,
        content: block.content,
        contentTr: block.contentTr,
        imageUrl,
        imageAlt: block.imageAlt,
        imageAltTr: block.imageAltTr,
      };
    }),
  };
}

async function main() {
  mkdirSync(resolve('scripts/output'), { recursive: true });

  console.log('Blog çekiliyor: id', BLOG_ID);
  const current = await fetch(`${BACKEND_BASE_URL}/blogs/${BLOG_ID}`).then((r) => r.json());
  if (!current?.id) throw new Error('Blog backend’den alınamadı.');

  // scene-3'teki iki IMAGE bloğunu sırayla işaretle (ilk -> scene3a, ikinci -> scene3b).
  let seenSceneThreeImage = false;
  current.blocks = current.blocks.map((b) => {
    if (b.sceneKey === 'scene-3' && b.blockType === 'IMAGE') {
      const marked = { ...b, __isSecondSceneImage: seenSceneThreeImage };
      seenSceneThreeImage = true;
      return marked;
    }
    return b;
  });

  console.log('Cloudinary’ye yükleniyor: kapak (Anna Gunn portresi)');
  const coverUrl = await uploadLocalFileToCloudinary(LOCAL_IMAGES.cover, 'skyler-cover-anna-gunn');
  console.log('  ✓', coverUrl);

  console.log('Cloudinary’ye yükleniyor: Yükleme Hatası #1 (Walt net/Skyler bulanık)');
  const scene3aUrl = await uploadLocalFileToCloudinary(LOCAL_IMAGES.scene3a, 'skyler-pov-walt-focus');
  console.log('  ✓', scene3aUrl);

  console.log('Cloudinary’ye yükleniyor: Yükleme Hatası #2 (Skyler net/Walt bulanık)');
  const scene3bUrl = await uploadLocalFileToCloudinary(LOCAL_IMAGES.scene3b, 'skyler-pov-skyler-focus');
  console.log('  ✓', scene3bUrl);

  const body = buildPutBody(current, { cover: coverUrl, scene3a: scene3aUrl, scene3b: scene3bUrl });
  writeFileSync(resolve('scripts/output/skyler-blog-put-body.json'), JSON.stringify(body, null, 2));

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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
