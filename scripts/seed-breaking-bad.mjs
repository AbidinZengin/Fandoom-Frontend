#!/usr/bin/env node
// Breaking Bad'in season/episode entitylerini TMDB verisiyle sıfırdan
// oluşturan tek seferlik seed aracı — series (id:5) şu an seasons: [] boş,
// fetch-season-posters.mjs / fetch-episode-stills.mjs'in aksine burada
// PUT değil POST ile yeni kayıt AÇILIYOR (GoT'ta sezon/bölümler zaten
// vardı, bu ilk kez CREATE path'i deneniyor — endpoint şekli backend
// GET response'larından (camelCase alan adları) çıkarıldı, canlı test
// edilmedi). Idempotent: zaten var olan sezon/bölüm atlanır, rapor
// dosyasından resume edilir.
//
// Kullanım (PowerShell):
//   $env:AUTH_TOKEN="..."; node scripts/seed-breaking-bad.mjs
// Kademeli (önce 1 sezon dene):
//   $env:AUTH_TOKEN="..."; node scripts/seed-breaking-bad.mjs --season 1
// Sadece deneme (Cloudinary'e yükler ama backend'e YAZMAZ):
//   node scripts/seed-breaking-bad.mjs --season 1   (AUTH_TOKEN verilmezse)

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
const CLOUDINARY_FOLDER_SEASONS = 'fandoom/home';
const CLOUDINARY_FOLDER_EPISODES = 'fandoom/episodes';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const SERIES_SLUG = process.env.SERIES_SLUG || 'breaking-bad';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;

const seasonFilterArg = process.argv.indexOf('--season');
const seasonFilter = seasonFilterArg !== -1 ? Number(process.argv[seasonFilterArg + 1]) : null;

const missing = [];
if (!CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
if (!CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
if (missing.length > 0) {
  console.error(`Eksik ortam değişkeni: ${missing.join(', ')}`);
  process.exit(1);
}
if (!AUTH_TOKEN) {
  console.warn('AUTH_TOKEN yok — sadece dry-run: Cloudinary\'e yüklenir ama backend\'e YAZILMAZ.\n');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function cloudinarySignature(params) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(toSign + CLOUDINARY_API_SECRET).digest('hex');
}

async function uploadToCloudinary(imageUrl, publicIdHint, folder) {
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Görsel indirilemedi: ${imageUrl}`);
  const blob = await imgRes.blob();

  const timestamp = Math.floor(Date.now() / 1000);
  const signParams = { folder, timestamp };
  const signature = cloudinarySignature(signParams);

  const form = new FormData();
  form.append('file', blob, `${publicIdHint}.jpg`);
  form.append('api_key', CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(uploadData.error?.message || 'Cloudinary upload başarısız');
  return uploadData.secure_url;
}

// Endpoint şekli doğrulanmadığı için iki muhtemel şekli sırayla dener:
// önce nested REST path (mevcut /series/{id}/lore/events deseniyle aynı),
// 404 gelirse düz path + gövdede foreign key.
async function postWithFallback(primaryPath, primaryBody, fallbackPath, fallbackBody) {
  let res = await fetch(`${BACKEND_BASE_URL}${primaryPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` },
    body: JSON.stringify(primaryBody),
  });
  if (res.status === 404 && fallbackPath) {
    res = await fetch(`${BACKEND_BASE_URL}${fallbackPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` },
      body: JSON.stringify(fallbackBody),
    });
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`${res.status}: ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
  }
  return data;
}

function loadReport() {
  const path = resolve('scripts/output/breaking-bad-seed-report.json');
  if (!existsSync(path)) return { seasons: {} };
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return { seasons: {} };
  }
}
function saveReport(report) {
  mkdirSync(resolve('scripts/output'), { recursive: true });
  writeFileSync(resolve('scripts/output/breaking-bad-seed-report.json'), JSON.stringify(report, null, 2));
}

async function main() {
  const tmdb = JSON.parse(readFileSync(resolve('scripts/data/breaking-bad-tmdb.json'), 'utf8'));
  const report = loadReport();

  let seriesId = null;
  if (AUTH_TOKEN) {
    console.log(`Series detayı çekiliyor: ${SERIES_SLUG}`);
    const series = await fetch(`${BACKEND_BASE_URL}/series/slug/${SERIES_SLUG}`).then((r) => r.json());
    seriesId = series.id;
    console.log(`Series id: ${seriesId}\n`);
  }

  for (const season of tmdb.seasons) {
    if (seasonFilter && season.seasonNumber !== seasonFilter) continue;
    const sKey = String(season.seasonNumber);
    const label = `Season ${season.seasonNumber}`;

    let seasonId = report.seasons[sKey]?.seasonId ?? null;

    if (!seasonId) {
      try {
        console.log(`\n${label} — poster Cloudinary'e yükleniyor...`);
        const posterUrl = await uploadToCloudinary(
          `https://image.tmdb.org/t/p/original${season.posterPath}`,
          `breaking-bad-s${season.seasonNumber}-poster`,
          CLOUDINARY_FOLDER_SEASONS
        );
        console.log(`  ✓ ${posterUrl}`);

        const body = { seasonNumber: season.seasonNumber, title: season.title, airDate: season.airDate, posterUrl };

        if (AUTH_TOKEN) {
          const created = await postWithFallback(
            `/series/${seriesId}/seasons`,
            body,
            '/seasons',
            { ...body, seriesId }
          );
          seasonId = created.id;
          console.log(`  ✓ ${label} oluşturuldu (id: ${seasonId})`);
        } else {
          console.log('  · dry-run: backend\'e yazılmadı');
        }

        report.seasons[sKey] = { seasonId, posterUrl, episodes: report.seasons[sKey]?.episodes || {} };
        saveReport(report);
      } catch (err) {
        console.log(`  ✗ ${label}: ${err.message}`);
        report.seasons[sKey] = { seasonId: null, error: err.message, episodes: report.seasons[sKey]?.episodes || {} };
        saveReport(report);
        continue; // seasonId yoksa bölümler oluşturulamaz
      }
    } else {
      console.log(`\n${label}: zaten oluşturulmuş (seasonId: ${seasonId})`);
    }

    if (!seasonId) continue;
    report.seasons[sKey].episodes = report.seasons[sKey].episodes || {};

    for (const ep of season.episodes) {
      const eKey = String(ep.episodeNumber);
      const epLabel = `S${season.seasonNumber}E${ep.episodeNumber} — ${ep.title}`;
      if (report.seasons[sKey].episodes[eKey]?.episodeId) {
        console.log(`  = ${epLabel}: zaten oluşturulmuş, atlandı`);
        continue;
      }
      try {
        const stillImageUrl = await uploadToCloudinary(
          `https://image.tmdb.org/t/p/original${ep.stillPath}`,
          `breaking-bad-s${season.seasonNumber}e${String(ep.episodeNumber).padStart(2, '0')}`,
          CLOUDINARY_FOLDER_EPISODES
        );

        const body = {
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          synopsis: ep.synopsis,
          airDate: ep.airDate,
          durationMinutes: ep.durationMinutes,
          externalRating: ep.externalRating,
          externalVoteCount: ep.externalVoteCount,
          imdbId: ep.imdbId,
          tmdbId: ep.tmdbId,
          stillImageUrl,
        };

        let episodeId = null;
        if (AUTH_TOKEN) {
          const created = await postWithFallback(
            `/seasons/${seasonId}/episodes`,
            body,
            '/episodes',
            { ...body, seasonId }
          );
          episodeId = created.id;
          console.log(`  ✓ ${epLabel} (id: ${episodeId})`);
        } else {
          console.log(`  · ${epLabel}: dry-run, backend'e yazılmadı`);
        }

        report.seasons[sKey].episodes[eKey] = { episodeId, stillImageUrl };
        saveReport(report);
      } catch (err) {
        console.log(`  ✗ ${epLabel}: ${err.message}`);
        report.seasons[sKey].episodes[eKey] = { episodeId: null, error: err.message };
        saveReport(report);
      }
      await sleep(300);
    }
  }

  console.log('\nBitti. Rapor: scripts/output/breaking-bad-seed-report.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
