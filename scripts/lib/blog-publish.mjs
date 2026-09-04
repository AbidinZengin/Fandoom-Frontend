// Blog yazılarını (docs_dev/blog-drafts/*.md kaynaklı) backend'e POST/PUT
// eden ortak yardımcılar. create-skyler-blog.mjs / create-ozymandias-blog.mjs
// gibi tek-seferlik script'lerin kopyaladığı boilerplate'i tek yerde toplar
// — yeni bir blog eklerken sadece bir "data" dosyası (bkz. scripts/blogs/
// ozymandias.mjs örneği) yazmak yeterli olsun diye.
//
// DİL KURALI (KRİTİK): base alan (title/kicker/axis/content/imageAlt) her
// zaman İNGİLİZCE, *Tr son ekli alan her zaman TÜRKÇE'dir — projedeki
// dosya adlandırma kuralıyla birebir aynı (ör. EpisodeStory.data.js taban
// = EN, SeasonStory.source.TR.md = TR). Önceki create-skyler-blog.mjs /
// create-ozymandias-blog.mjs script'leri content ve contentTr'ye AYNI
// Türkçe metni yazıyordu — bu YANLIŞTI (kullanıcı 2026-09-01'de düzeltti),
// bu dosyayı kullanan her script iki dili de GERÇEKTEN ayrı yazmalı.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadDotEnvLocal() {
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

export function loadCloudinaryConfig() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'b0bc5njd',
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: 'fandoom/blog',
  };
}

function cloudinarySignature(params, apiSecret) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(toSign + apiSecret).digest('hex');
}

// file: Buffer (yerel dosyadan okunmuş) YA DA string (http/https URL —
// Cloudinary "fetch by remote URL" modu, indirip yeniden yüklemeye gerek
// bırakmaz; TMDB gibi zaten herkese açık CDN'lerden taşımak için kullanışlı).
async function uploadToCloudinary(file, publicIdHint, cfg) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signParams = { folder: cfg.folder, timestamp };
  const signature = cloudinarySignature(signParams, cfg.apiSecret);

  const form = new FormData();
  if (typeof file === 'string') {
    form.append('file', file);
  } else {
    form.append('file', new Blob([file]), `${publicIdHint}.jpg`);
  }
  form.append('api_key', cfg.apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', cfg.folder);
  form.append('signature', signature);

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(uploadData.error?.message || 'Cloudinary upload başarısız');
  return uploadData.secure_url;
}

export async function uploadLocalFileToCloudinary(localPath, publicIdHint, cfg) {
  return uploadToCloudinary(readFileSync(localPath), publicIdHint, cfg);
}

export async function uploadRemoteUrlToCloudinary(remoteUrl, publicIdHint, cfg) {
  return uploadToCloudinary(remoteUrl, publicIdHint, cfg);
}

// images: { key: { type: 'local'|'remote'|'cloudinary', src, hint } }
// 'cloudinary' tipi zaten yüklenmiş bir secure_url'i (src) olduğu gibi
// geçirir — tekrar yüklemez (idempotent yeniden çalıştırma için).
export async function resolveImages(images, cfg) {
  const missing = [];
  if (!cfg.apiKey) missing.push('CLOUDINARY_API_KEY');
  if (!cfg.apiSecret) missing.push('CLOUDINARY_API_SECRET');
  if (missing.length) throw new Error(`Eksik ortam değişkeni: ${missing.join(', ')}`);

  const resolved = {};
  for (const [key, { type, src, hint }] of Object.entries(images)) {
    if (type === 'cloudinary') {
      resolved[key] = src;
      continue;
    }
    console.log(`Cloudinary'ye yükleniyor: ${key} (${hint})`);
    const url =
      type === 'local'
        ? await uploadLocalFileToCloudinary(src, hint, cfg)
        : await uploadRemoteUrlToCloudinary(src, hint, cfg);
    console.log('  ✓', url);
    resolved[key] = url;
  }
  return resolved;
}

// Blok dizisi kurucu — orderIndex'i kapanış içinde tutar, her blog için
// createBlockBuilder() ile taze bir sayaç alınır.
export function createBlockBuilder() {
  let order = 0;
  return function block(blockType, sceneKey, { en = null, tr = null, imageUrl = null, altEn = null, altTr = null } = {}) {
    if ((en != null || tr != null) && (en == null || tr == null)) {
      throw new Error(`Blok ${sceneKey}/${blockType}: en ve tr birlikte verilmeli (biri eksik).`);
    }
    return {
      orderIndex: order++,
      blockType,
      sceneKey,
      content: en,
      contentTr: tr,
      imageUrl,
      imageAlt: altEn,
      imageAltTr: altTr,
    };
  };
}

export const P = (...paragraphs) => paragraphs.join('\n\n');

export function parseArgs(argv) {
  const write = argv.includes('--write');
  const idIdx = argv.indexOf('--blog-id');
  const blogId = idIdx !== -1 ? Number(argv[idIdx + 1]) : null;
  return { write, blogId };
}

function tagsForRequest(tags) {
  return tags.map((tag) => {
    const hasSubject = tag.subjectType != null && tag.subjectId != null;
    return {
      subjectType: tag.subjectType ?? null,
      subjectId: tag.subjectId ?? null,
      seasonNumber: tag.seasonNumber ?? null,
      episodeNumber: tag.episodeNumber ?? null,
      franchiseId: hasSubject ? null : tag.franchiseId ?? null,
    };
  });
}

// meta: { titleEn, titleTr, kickerEn, kickerTr, axisEn, axisTr, imageUrl,
//         imageUrlLarge, imageAltEn, imageAltTr, status, format,
//         spoilerThroughSeasonNumber, spoilerThroughEpisodeNumber,
//         recommendedRank, readingTimeMinutes, tags, publishedAt }
export function buildBlogBody(meta, blocks) {
  return {
    title: meta.titleEn,
    titleTr: meta.titleTr,
    kicker: meta.kickerEn,
    kickerTr: meta.kickerTr,
    axis: meta.axisEn,
    axisTr: meta.axisTr,
    imageUrl: meta.imageUrl,
    imageUrlLarge: meta.imageUrlLarge || meta.imageUrl,
    imageAlt: meta.imageAltEn,
    imageAltTr: meta.imageAltTr,
    spoilerThroughSeasonNumber: meta.spoilerThroughSeasonNumber ?? null,
    spoilerThroughEpisodeNumber: meta.spoilerThroughEpisodeNumber ?? null,
    recommendedRank: meta.recommendedRank ?? null,
    spoilerFree: (meta.spoilerThroughSeasonNumber ?? null) == null,
    status: meta.status || 'DRAFT',
    format: meta.format,
    publishedAt: meta.publishedAt ?? undefined,
    readingTimeMinutes: meta.readingTimeMinutes,
    tags: tagsForRequest(meta.tags || []),
    blocks: blocks.map(({ orderIndex: _orderIndex, ...b }) => b),
  };
}

// Bir blog'u (meta + blocks + images tanımı) çözümleyip dry-run/--write'a
// göre POST (yeni) ya da PUT (--blog-id verildiyse) eder. outputName,
// scripts/output/ altındaki dosya adı önekidir.
export async function publishBlog({ outputName, meta, buildBlocks, images = {} }) {
  loadDotEnvLocal();
  const cloudinaryCfg = loadCloudinaryConfig();
  const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
  const AUTH_TOKEN = process.env.AUTH_TOKEN || null;
  const { write, blogId } = parseArgs(process.argv);

  if (write && !AUTH_TOKEN) {
    console.error('--write için AUTH_TOKEN ortam değişkeni zorunlu.');
    process.exit(1);
  }

  mkdirSync(resolve('scripts/output'), { recursive: true });

  const resolvedImages = await resolveImages(images, cloudinaryCfg);
  const blocks = buildBlocks(resolvedImages);
  const body = buildBlogBody({ ...meta, imageUrl: resolvedImages[meta.imageKey] || meta.imageUrl }, blocks);

  writeFileSync(resolve(`scripts/output/${outputName}-body.json`), JSON.stringify(body, null, 2));
  console.log(`Blok sayısı: ${blocks.length}`);

  if (!write) {
    console.log(`\nDRY-RUN: backend'e yazılmadı. scripts/output/${outputName}-body.json içeriğini kontrol et, onay sonrası --write ile tekrar çalıştır.`);
    return;
  }

  const url = blogId ? `${BACKEND_BASE_URL}/blogs/${blogId}` : `${BACKEND_BASE_URL}/blogs`;
  const method = blogId ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`${method} ${url} başarısız (${res.status}): ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
  }
  console.log(`\n✓ Blog ${blogId ? 'güncellendi' : 'oluşturuldu'}. id=${data.id}, slug=${data.slug}, status=${data.status}`);
  writeFileSync(resolve(`scripts/output/${outputName}-response.json`), JSON.stringify(data, null, 2));
  return data;
}
