#!/usr/bin/env node
// Severance series/season/episode entitylerini scripts/data/severance-tmdb.json
// (TMDb API'den fetch-severance-tmdb.mjs ile çekilmiş, kesin/ondalıklı puan +
// gerçek tmdbId/imdbId içeren veri) kaynak alarak sıfırdan oluşturan tek
// seferlik seed aracı — create-house-of-the-dragon.mjs (series create) +
// seed-breaking-bad.mjs (season/episode create) desenlerinin birleşimi.
// Idempotent: series/season/episode zaten varsa atlanır, rapor dosyasından
// resume edilir.
//
// Kullanım (PowerShell):
//   $env:AUTH_TOKEN="..."; node scripts/seed-severance.mjs
// Kademeli:
//   $env:AUTH_TOKEN="..."; node scripts/seed-severance.mjs --season 1
// Sadece deneme (Cloudinary'e yükler ama backend'e YAZMAZ):
//   node scripts/seed-severance.mjs   (AUTH_TOKEN verilmezse)

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
const CLOUDINARY_FOLDER_SERIES = 'fandoom/home';
const CLOUDINARY_FOLDER_SEASONS = 'fandoom/home';
const CLOUDINARY_FOLDER_EPISODES = 'fandoom/episodes';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const SERIES_SLUG = 'severance';
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
  console.warn("AUTH_TOKEN yok — sadece dry-run: Cloudinary'e yüklenir ama backend'e YAZILMAZ.\n");
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
  const path = resolve('scripts/output/severance-seed-report.json');
  if (!existsSync(path)) return { seriesId: null, seasons: {} };
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return { seriesId: null, seasons: {} };
  }
}
function saveReport(report) {
  mkdirSync(resolve('scripts/output'), { recursive: true });
  writeFileSync(resolve('scripts/output/severance-seed-report.json'), JSON.stringify(report, null, 2));
}

const TMDB_IMG = (path) => `https://image.tmdb.org/t/p/original${path}`;

async function main() {
  const tmdb = JSON.parse(readFileSync(resolve('scripts/data/severance-tmdb.json'), 'utf8'));
  const report = loadReport();

  // 1) Series
  let seriesId = report.seriesId;
  if (!seriesId) {
    const existing = await fetch(`${BACKEND_BASE_URL}/series/slug/${SERIES_SLUG}`);
    if (existing.ok) {
      const data = await existing.json();
      seriesId = data.id;
      console.log(`Series zaten var: ${SERIES_SLUG} (id: ${seriesId})`);
    } else {
      console.log('Series poster/cover Cloudinary\'e yükleniyor...');
      const posterUrl = await uploadToCloudinary(TMDB_IMG(tmdb.series.posterPath), 'severance-poster', CLOUDINARY_FOLDER_SERIES);
      console.log(`  ✓ poster ${posterUrl}`);
      const coverImageUrl = await uploadToCloudinary(TMDB_IMG(tmdb.series.backdropPath), 'severance-cover', CLOUDINARY_FOLDER_SERIES);
      console.log(`  ✓ cover ${coverImageUrl}`);

      const body = {
        title: 'Severance',
        titleTr: 'Severance',
        originalTitle: 'Severance',
        synopsis: tmdb.series.synopsis,
        synopsisTr:
          'Mark, anıları cerrahi olarak iş ve özel hayatları arasında ikiye bölünmüş bir ofis çalışanları ekibine liderlik eder. Gizemli bir eski iş arkadaşının işyeri dışında ortaya çıkmasıyla, işlerinin gerçek doğasını keşfetme yolculuğu başlar.',
        firstAirDate: tmdb.series.firstAirDate,
        lastAirDate: null,
        status: 'ONGOING',
        posterUrl,
        coverImageUrl,
        trailerUrl: 'https://www.youtube.com/watch?v=Aa5pS6xFi44',
        contentRating: tmdb.series.contentRating,
        originCountry: tmdb.series.originCountry,
        originalLanguage: tmdb.series.originalLanguage,
        externalRating: tmdb.series.externalRating,
        externalVoteCount: tmdb.series.externalVoteCount,
        imdbId: tmdb.series.imdbId,
        tmdbId: tmdb.series.tmdbId,
        franchiseId: null,
        genreIds: [2, 6, 5], // Drama, Mystery, Sci-Fi (Fandoom genre kataloğu id'leri)
        producerIds: [],
      };

      if (!AUTH_TOKEN) {
        console.log('\ndry-run: series gövdesi backend\'e YAZILMADI:\n');
        console.log(JSON.stringify(body, null, 2));
        return;
      }

      const res = await fetch(`${BACKEND_BASE_URL}/series`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(`Series create ${res.status}: ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
      }
      seriesId = data.id;
      console.log(`  ✓ Series oluşturuldu (id: ${seriesId})`);
    }
    report.seriesId = seriesId;
    saveReport(report);
  } else {
    console.log(`Series zaten seed edilmiş (id: ${seriesId})`);
  }

  if (!AUTH_TOKEN || !seriesId) return;

  // 2) Seasons + episodes
  for (const season of tmdb.seasons) {
    if (seasonFilter && season.seasonNumber !== seasonFilter) continue;
    const sKey = String(season.seasonNumber);
    const label = `Season ${season.seasonNumber}`;

    let seasonId = report.seasons[sKey]?.seasonId ?? null;

    if (!seasonId) {
      try {
        console.log(`\n${label} — poster Cloudinary'e yükleniyor...`);
        const posterUrl = await uploadToCloudinary(
          TMDB_IMG(season.posterPath),
          `severance-s${season.seasonNumber}-poster`,
          CLOUDINARY_FOLDER_SEASONS
        );
        console.log(`  ✓ ${posterUrl}`);

        const body = { seasonNumber: season.seasonNumber, title: season.title, airDate: season.airDate, posterUrl };

        const created = await postWithFallback(
          `/series/${seriesId}/seasons`,
          body,
          '/seasons',
          { ...body, seriesId }
        );
        seasonId = created.id;
        console.log(`  ✓ ${label} oluşturuldu (id: ${seasonId})`);

        report.seasons[sKey] = { seasonId, posterUrl, episodes: report.seasons[sKey]?.episodes || {} };
        saveReport(report);
      } catch (err) {
        console.log(`  ✗ ${label}: ${err.message}`);
        report.seasons[sKey] = { seasonId: null, error: err.message, episodes: report.seasons[sKey]?.episodes || {} };
        saveReport(report);
        continue;
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
          TMDB_IMG(ep.stillPath),
          `severance-s${season.seasonNumber}e${String(ep.episodeNumber).padStart(2, '0')}`,
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

        const created = await postWithFallback(
          `/seasons/${seasonId}/episodes`,
          body,
          '/episodes',
          { ...body, seasonId }
        );
        const episodeId = created.id;
        console.log(`  ✓ ${epLabel} (id: ${episodeId})`);

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

  console.log('\nBitti. Rapor: scripts/output/severance-seed-report.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
