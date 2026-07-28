#!/usr/bin/env node
// Bölüm still görsellerini TMDB'den bulup Cloudinary'e yükleyen tek seferlik
// asset aracı. AUTH_TOKEN verilmezse backend'e YAZMAZ — sadece episodeId →
// Cloudinary URL raporu üretir (scripts/output/). AUTH_TOKEN verilirse her
// upload sonrası PUT /api/episodes/:id ile stillImageUrl'i de yazar.
//
// Kullanım (PowerShell):
//   $env:TMDB_API_KEY="..."; $env:CLOUDINARY_API_KEY="..."; $env:CLOUDINARY_API_SECRET="..."; node scripts/fetch-episode-stills.mjs
// Veya repo kökünde bir .env.local dosyası (gitignore'lu) ile:
//   TMDB_API_KEY=...
//   CLOUDINARY_CLOUD_NAME=b0bc5njd
//   CLOUDINARY_API_KEY=...
//   CLOUDINARY_API_SECRET=...
//   AUTH_TOKEN=...   (opsiyonel — verilirse backend'e otomatik PUT yapılır)
//
// Opsiyonel argüman: --season <n>  (sadece o sezonu işler, test/kademeli çalıştırma için)

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

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'b0bc5njd';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'fandoom/episodes';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const TMDB_TV_ID = process.env.TMDB_TV_ID || '1399'; // Game of Thrones
const SERIES_SLUG = process.env.SERIES_SLUG || 'game-of-thrones';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;

const seasonFilterArg = process.argv.indexOf('--season');
const seasonFilter = seasonFilterArg !== -1 ? Number(process.argv[seasonFilterArg + 1]) : null;

// --from-episode <n>: sadece o sezonda episodeNumber >= n olanları YENİDEN
// işler (zaten senkron olsa bile) — öncekiler (n'den küçük) hiç dokunulmaz.
const fromEpisodeArg = process.argv.indexOf('--from-episode');
const fromEpisode = fromEpisodeArg !== -1 ? Number(process.argv[fromEpisodeArg + 1]) : null;

// --recrop: TMDB/Cloudinary'ye HİÇ gitmez — mevcut rapordaki stillImageUrl'lere
// sadece smart-crop transformasyonunu ekleyip (varsa AUTH_TOKEN ile) DB'yi
// günceller. --season ile birlikte kapsam daraltılabilir.
const recropOnly = process.argv.includes('--recrop');

// --undo-recrop: smart-crop transformasyonunu geri alır (bu Cloudinary
// hesabında on-the-fly delivery transformasyonu 404 verdiği için acil
// düzeltme amaçlı eklendi — bkz. SMART_CROP yorumu).
const undoRecrop = process.argv.includes('--undo-recrop');

// --bake-crop: bu hesapta DELIVERY transformasyonu (URL'e param ekleme) 404
// verdiği için, kırpımı UPLOAD ANINDA (incoming transformation) uygular →
// depolanan asset zaten kırpılıdır, teslim URL'i TEMİZ kalır (strict account
// uyumlu). Kart ~7:1 banner olduğundan g_auto ile geniş orana (BAKE_AR)
// kırparak yüzü/sahneyi dikeyde ortalar; tarayıcının center-cover'ı bu
// ortalanmış bandı korur. Kaynak olarak mevcut orijinal görseli kullanır
// (TMDB'ye tekrar gitmez), deterministik public_id + overwrite ile tekrar
// çalıştırıldığında kopya üretmez.
const bakeCrop = process.argv.includes('--bake-crop');
const BAKE_AR = process.env.BAKE_AR || '3:1';
const BAKE_W = process.env.BAKE_W || '1400';

const missing = [];
if (recropOnly || undoRecrop) {
  if (!AUTH_TOKEN) missing.push('AUTH_TOKEN (--recrop/--undo-recrop için zorunlu, yoksa DB\'ye yazılamaz)');
} else if (bakeCrop) {
  if (!CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
  if (!CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
  if (!AUTH_TOKEN) missing.push('AUTH_TOKEN (--bake-crop DB\'ye yazar)');
} else {
  if (!TMDB_API_KEY) missing.push('TMDB_API_KEY');
  if (!CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
  if (!CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
}
if (missing.length > 0) {
  console.error(`Eksik ortam değişkeni: ${missing.join(', ')}`);
  console.error('Ya shell\'de export edin ya da repo kökünde .env.local dosyası oluşturun.');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// usedPaths: bu koşu boyunca zaten seçilmiş TMDB file_path'lerini tutan Set —
// aynı still'in birden fazla bölümde tekrar seçilmesini engeller (kullanıcı
// isteği: "birbirinden farklı" — gerçek sahne/kompozisyon benzerliğini
// ölçemiyoruz ama en azından AYNI görsel iki bölümde tekrarlanmaz).
async function tmdbBestStill(seasonNumber, episodeNumber, usedPaths) {
  const url = `https://api.themoviedb.org/3/tv/${TMDB_TV_ID}/season/${seasonNumber}/episode/${episodeNumber}/images?api_key=${TMDB_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  // Yatay (16:9'a yakın) still'ler — dikey/kare kırpımlar tam-arkaplan
  // kartın alanına uymaz, elenir.
  const landscape = (data.stills || []).filter((s) => s.width / s.height >= 1.5);
  const candidates = landscape.length > 0 ? landscape : data.stills || [];
  if (candidates.length === 0) return null;

  const sorted = [...candidates].sort((a, b) => b.width * b.height - a.width * a.height);
  const pick = sorted.find((s) => !usedPaths.has(s.file_path)) || sorted[0];
  usedPaths.add(pick.file_path);
  return `https://image.tmdb.org/t/p/original${pick.file_path}`;
}

// Teslim URL'sine Cloudinary'nin content-aware otomatik gravity'sini
// (yüz + önemli sahne algılar) 16:9 kırpımla birlikte ekler — kullanıcı
// isteği: "insan yüzlerini ya da önemli sahneyi ortala". Bu bir teslim
// transformasyonudur, kaynak asset'i DEĞİŞTİRMEZ — mevcut yüklü görsellere
// bile TMDB/Cloudinary'ye tekrar gitmeden, sadece URL'i düzenleyerek
// uygulanabilir (bkz. --recrop).
const SMART_CROP = 'c_fill,g_auto,ar_16:9,w_1280';
function smartCropUrl(url) {
  if (url.includes('/upload/c_fill,g_auto')) return url; // zaten uygulanmış
  return url.replace('/upload/', `/upload/${SMART_CROP}/`);
}
function stripSmartCropUrl(url) {
  return url.replace(`/upload/${SMART_CROP}/`, '/upload/');
}

function cloudinarySignature(params) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(toSign + CLOUDINARY_API_SECRET).digest('hex');
}

async function uploadToCloudinary(imageUrl, publicIdHint) {
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Görsel indirilemedi: ${imageUrl}`);
  const blob = await imgRes.blob();

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

// Mevcut (orijinal) görseli indirip UPLOAD ANINDA g_auto geniş-oran kırpımıyla
// yeniden yükler → depolanan asset kırpılıdır, teslim URL'i temizdir. Aynı
// public_id + overwrite: tekrar çalıştırınca kopya üretmez, aynı URL'e yazar.
async function bakeCropUpload(sourceUrl, publicId) {
  const imgRes = await fetch(sourceUrl);
  if (!imgRes.ok) throw new Error(`Kaynak indirilemedi (${imgRes.status}): ${sourceUrl}`);
  const blob = await imgRes.blob();

  const transformation = `c_fill,g_auto,ar_${BAKE_AR},w_${BAKE_W}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signParams = {
    invalidate: 'true',
    overwrite: 'true',
    public_id: publicId,
    timestamp,
    transformation,
  };
  const signature = cloudinarySignature(signParams);

  const form = new FormData();
  form.append('file', blob, `${publicId.split('/').pop()}.jpg`);
  form.append('api_key', CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('public_id', publicId);
  form.append('overwrite', 'true');
  form.append('invalidate', 'true');
  form.append('transformation', transformation);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Cloudinary bake upload başarısız');
  return data.secure_url;
}

// Mevcut episode kaydını stillImageUrl dışındaki alanları koruyarak günceller
// (PUT tüm kaynağı değiştirir — diğer alanları kaybetmemek için önce elimizdeki
// episode nesnesini spread'liyoruz, backend'den ayrıca tekrar çekmiyoruz).
async function putEpisodeStill(ep, stillImageUrl) {
  const res = await fetch(`${BACKEND_BASE_URL}/episodes/${ep.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    body: JSON.stringify({ ...ep, stillImageUrl }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(`PUT /episodes/${ep.id} başarısız (${res.status}): ${body?.message || res.statusText}`);
  }
}

function loadExistingRows() {
  const path = resolve('scripts/output/episode-stills-report.json');
  if (!existsSync(path)) return [];
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return [];
  }
}

async function main() {
  console.log(`Series detayı çekiliyor: ${SERIES_SLUG}`);
  const series = await fetch(`${BACKEND_BASE_URL}/series/slug/${SERIES_SLUG}`).then((r) => r.json());

  // Önceki çalıştırmaların (ör. --season 1) raporunu korur — her koşu
  // dosyanın tamamını değil, sadece işlenen sezonun satırlarını değiştirir.
  const rows = loadExistingRows();
  const usedStillPaths = new Set();
  const upsert = (row) => {
    const i = rows.findIndex((r) => r.episodeId === row.episodeId);
    if (i === -1) rows.push(row);
    else rows[i] = row;
  };
  for (const season of series.seasons) {
    if (seasonFilter && season.seasonNumber !== seasonFilter) continue;

    console.log(`\nSeason ${season.seasonNumber} işleniyor...`);
    const seasonDetail = await fetch(`${BACKEND_BASE_URL}/seasons/${season.id}`).then((r) => r.json());

    for (const ep of seasonDetail.episodes) {
      if (fromEpisode !== null && ep.episodeNumber < fromEpisode) continue; // öncekilere DOKUNULMAZ

      const label = `S${season.seasonNumber}E${ep.episodeNumber} — ${ep.title}`;
      const existing = rows.find((r) => r.episodeId === ep.id);
      const forceRedo = fromEpisode !== null && ep.episodeNumber >= fromEpisode;

      try {
        if (bakeCrop) {
          if (!existing?.stillImageUrl) {
            console.log(`  · ${label}: rapor yok, atlandı`);
            continue;
          }
          const source = stripSmartCropUrl(existing.stillImageUrl);
          const publicId = `${CLOUDINARY_FOLDER}/got-s${season.seasonNumber}e${String(ep.episodeNumber).padStart(2, '0')}-crop`;
          const baked = await bakeCropUpload(source, publicId);
          await putEpisodeStill(ep, baked);
          console.log(`  ✓ ${label} (g_auto ${BAKE_AR} bake + DB güncellendi)`);
          upsert({ ...existing, stillImageUrl: baked, synced: true });
          await sleep(250);
          continue;
        }

        if (undoRecrop) {
          if (!existing?.stillImageUrl) {
            console.log(`  · ${label}: rapor yok, atlandı`);
            continue;
          }
          const original = stripSmartCropUrl(existing.stillImageUrl);
          await putEpisodeStill(ep, original);
          console.log(`  ✓ ${label} (recrop geri alındı + DB güncellendi)`);
          upsert({ ...existing, stillImageUrl: original, synced: true });
          await sleep(150);
          continue;
        }

        if (recropOnly) {
          if (!existing?.stillImageUrl) {
            console.log(`  · ${label}: rapor yok, atlandı`);
            continue;
          }
          const recropped = smartCropUrl(existing.stillImageUrl);
          await putEpisodeStill(ep, recropped);
          console.log(`  ✓ ${label} (recrop + DB güncellendi)`);
          upsert({ ...existing, stillImageUrl: recropped, synced: true });
          await sleep(150);
          continue;
        }

        // Zaten yüklenmiş (önceki --season koşusu) ve DB'ye henüz yazılmamışsa
        // TMDB/Cloudinary'yi tekrar yormadan mevcut URL'i kullanıp sadece PUT at.
        // --from-episode ile hedeflenen bölümler her zaman YENİDEN çekilir.
        let cloudinaryUrl;
        if (forceRedo) {
          const stillUrl = await tmdbBestStill(season.seasonNumber, ep.episodeNumber, usedStillPaths);
          if (!stillUrl) {
            console.log(`  ⚠ ${label}: TMDB'de still yok, atlandı (filler kullanılmadı)`);
            upsert({ episodeId: ep.id, season: season.seasonNumber, episode: ep.episodeNumber, title: ep.title, status: 'missing', stillImageUrl: null });
            continue;
          }
          cloudinaryUrl = await uploadToCloudinary(
            stillUrl,
            `got-s${season.seasonNumber}e${String(ep.episodeNumber).padStart(2, '0')}`
          );
        } else if (existing?.status === 'ok' && existing.stillImageUrl && !existing.synced) {
          cloudinaryUrl = existing.stillImageUrl;
        } else if (existing?.status === 'ok' && existing.synced) {
          console.log(`  = ${label}: zaten yüklü ve senkron, atlandı`);
          continue;
        } else {
          const stillUrl = await tmdbBestStill(season.seasonNumber, ep.episodeNumber, usedStillPaths);
          if (!stillUrl) {
            console.log(`  ⚠ ${label}: TMDB'de still yok, atlandı (filler kullanılmadı)`);
            upsert({ episodeId: ep.id, season: season.seasonNumber, episode: ep.episodeNumber, title: ep.title, status: 'missing', stillImageUrl: null });
            continue;
          }
          cloudinaryUrl = await uploadToCloudinary(
            stillUrl,
            `got-s${season.seasonNumber}e${String(ep.episodeNumber).padStart(2, '0')}`
          );
        }
        let synced = false;
        let syncError = null;
        if (AUTH_TOKEN) {
          try {
            await putEpisodeStill(ep, cloudinaryUrl);
            synced = true;
          } catch (err) {
            syncError = err.message;
          }
        }

        console.log(`  ✓ ${label}${AUTH_TOKEN ? (synced ? ' (DB güncellendi)' : ` (DB YAZILAMADI: ${syncError})`) : ''}`);
        upsert({
          episodeId: ep.id,
          season: season.seasonNumber,
          episode: ep.episodeNumber,
          title: ep.title,
          status: 'ok',
          stillImageUrl: cloudinaryUrl,
          synced,
          ...(syncError ? { syncError } : {}),
        });
      } catch (err) {
        console.log(`  ✗ ${label}: ${err.message}`);
        upsert({ episodeId: ep.id, season: season.seasonNumber, episode: ep.episodeNumber, title: ep.title, status: 'error', stillImageUrl: null, error: err.message });
      }
      await sleep(300); // TMDB + Cloudinary rate limit nezaketi
    }
  }

  mkdirSync(resolve('scripts/output'), { recursive: true });
  writeFileSync(resolve('scripts/output/episode-stills-report.json'), JSON.stringify(rows, null, 2));

  const csvHeader = 'episodeId,season,episode,title,status,stillImageUrl\n';
  const csvBody = rows
    .map((r) => `${r.episodeId},${r.season},${r.episode},"${r.title.replace(/"/g, '""')}",${r.status},${r.stillImageUrl || ''}`)
    .join('\n');
  writeFileSync(resolve('scripts/output/episode-stills-report.csv'), csvHeader + csvBody);

  const ok = rows.filter((r) => r.status === 'ok').length;
  const skipped = rows.filter((r) => r.status === 'missing').length;
  const failed = rows.filter((r) => r.status === 'error').length;
  console.log(`\nBitti: ${ok} yüklendi, ${skipped} TMDB'de yok, ${failed} hata.`);
  if (AUTH_TOKEN) {
    const synced = rows.filter((r) => r.synced).length;
    console.log(`DB'ye yazılan: ${synced}/${ok}`);
  }
  console.log('Rapor: scripts/output/episode-stills-report.json (+ .csv)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
