#!/usr/bin/env node
// Parazit blog yazısı ("Kim Kime Parazit?") için seçilen 15 TMDb görselini
// indirip Cloudinary'e yükler; blog gövdesine YAZMAZ, sadece sonucu
// scripts/output/parazit-kim-kime-images.json'a yazar (black-swan-sanat-nina
// deseninin aynısı). Backend'e yazma AYRI bir adımdır (blog publish script).
//
// Kullanım (PowerShell):
//   node scripts/upload-parazit-blog-images.mjs            (dry-run, hiçbir şey yüklenmez)
//   node scripts/upload-parazit-blog-images.mjs --write    (Cloudinary'e YÜKLER — onay sonrası)

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

const doWrite = process.argv.includes('--write');

const missing = [];
if (!CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
if (!CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
if (missing.length > 0) {
  console.error(`Eksik ortam değişkeni: ${missing.join(', ')}`);
  process.exit(1);
}

// slot -> TMDb backdrop file_path (w1280, /movie/496243/images taramasından
// seçildi, bkz. scripts/output/parasite-image-candidates.json)
const SELECTED = {
  cover: '/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg', // pizza kutulu aile, metinsiz
  wifi: '/hAtRKAi24kw4wyGB2IyvmFdVGHC.jpg', // Ki-jung/Ki-woo wifi arıyor
  parkEvi: '/uG3m6jBwU8jUkt0jbUOj8Vb2Y11.jpg', // Park evi dış cephe, akşam
  seftali: '/qcVKFJsRccdWSIWc42tWBjob7z5.jpg', // Ki-jung elinde şeftali
  hayalet: '/1K9poXmKeOnvDzwsxbHM4WCEqwQ.jpg', // Geun-sae dolaptan bakıyor
  tas: '/p0giX7IG8hXv6lr1KE3jFn0VqXA.jpg', // Ki-taek suseok'u tutuyor
  merdiven: '/xOXIXRH6F2CDeEPwVSBe6y2v25V.jpg', // sel gecesi uzun merdiven
  banyo: '/jLgFsA0EpJMlz7Pw8o91kby618b.jpg', // taşan banyo, Ki-jung klozette
  yagmurMerdiven: '/x8Up7lZa8vHQohzH2w5KGoHfUCU.jpg', // Ki-jung yağmurda merdivende
  firtina: '/dMiiX5p9PTFplTjSVWBQcCWBBvi.jpg', // aile camdan fırtınayı izliyor
  utu: '/x6skktR5OS99lAX4JhmjCQYq490.jpg', // Kim ailesi Park salonunda içki
  kan: '/cS487CmI7GREXLWGpErNDFsICEV.jpg', // parti masasında kan damlaları
  masaAlti: '/25tz24hlrqAbjhpHx1FhmfPH8Qf.jpg', // Ki-taek masa altında
  kiJungMerdiven: '/frwHYd7LmSYrmO9aiX0DLqQQlF0.jpg', // Ki-jung gerilimli, merdiven
  pencere: '/cM0pnzCF6T7u1AAEYgyCG6Sua6k.jpg', // yarı bodrum penceresi (Plan'da tekrar kullanılıyor)
};

function cloudinarySignature(params) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(toSign + CLOUDINARY_API_SECRET).digest('hex');
}

async function uploadTmdbImageToCloudinary(filePath, publicIdHint) {
  const tmdbUrl = `https://image.tmdb.org/t/p/original${filePath}`;
  const imgRes = await fetch(tmdbUrl);
  if (!imgRes.ok) throw new Error(`TMDb görseli indirilemedi: ${tmdbUrl}`);
  const fileBuffer = Buffer.from(await imgRes.arrayBuffer());

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

const ONLY_KEYS = (process.env.ONLY_KEYS || '').split(',').map((s) => s.trim()).filter(Boolean);

async function main() {
  mkdirSync(resolve('scripts/output'), { recursive: true });

  if (!doWrite) {
    console.log('DRY-RUN: Cloudinary\'e hiçbir şey yüklenmedi.');
    console.log(`Yüklenecek ${Object.keys(SELECTED).length} görsel:`);
    for (const [key, path] of Object.entries(SELECTED)) console.log(`  ${key.padEnd(16)} ${path}`);
    console.log('\nOnay sonrası: node scripts/upload-parazit-blog-images.mjs --write');
    return;
  }

  const outPath = resolve('scripts/output/parazit-kim-kime-images.json');
  const urls = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : {};

  for (const [key, path] of Object.entries(SELECTED)) {
    if (urls[key] && !ONLY_KEYS.includes(key)) continue; // zaten yüklendi, atla
    if (ONLY_KEYS.length > 0 && !ONLY_KEYS.includes(key)) continue; // sadece istenenleri işle
    console.log(`Yükleniyor: ${key} (${path})`);
    const url = await uploadTmdbImageToCloudinary(path, `parazit-${key}`);
    console.log('  ✓', url);
    urls[key] = url;
    writeFileSync(outPath, JSON.stringify(urls, null, 2)); // her adımda kaydet (bağlantı kopsa bile kayıp olmaz)
  }

  console.log('\n✓ Tüm görseller yüklendi. scripts/output/parazit-kim-kime-images.json yazıldı.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
