#!/usr/bin/env node
// Breaking Bad: Series.title/synopsis(+Tr) ve her bölümün title/synopsis(+Tr)
// alanlarını scripts/data/breaking-bad-episodes-merged.json'dan backend'e
// yazar. EN ve TR değerleri DOĞRUDAN veri dosyasından gelir — "mevcut
// title'ı koru" YAPILMAZ, çünkü GET zaten locale-resolved tek bir değer
// döner (Accept-Language yoksa varsayılan TR'ye düşer); "current"tan
// title/synopsis okuyup aynen geri yazmak, TR çevirisi yazıldıktan sonra
// tekrar çalıştırıldığında EN sütununu TR ile ezer (bu script bir kere bu
// hataya düştü — bkz. 2026-08-22 repair). Sadece çeviriyle ilgisi olmayan
// alanlar (görsel, süre, puan, id'ler, seasonBlocks/episodeBlocks) GET'ten
// aynen korunur.
//
// Kullanım (PowerShell):
//   node scripts/seed-episode-translations.mjs                (dry-run)
//   $env:AUTH_TOKEN="..."; node scripts/seed-episode-translations.mjs --write
//   node scripts/seed-episode-translations.mjs --season 1      (tek sezonla sınırla)

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

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const SERIES_SLUG = process.env.SERIES_SLUG || 'breaking-bad';
const DATA_FILE = process.env.DATA_FILE || 'scripts/data/breaking-bad-episodes-merged.json';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;

const doWrite = process.argv.includes('--write');
const seasonFilterArg = process.argv.indexOf('--season');
const seasonFilter = seasonFilterArg !== -1 ? Number(process.argv[seasonFilterArg + 1]) : null;

if (doWrite && !AUTH_TOKEN) {
  console.error('--write için AUTH_TOKEN ortam değişkeni zorunlu.');
  process.exit(1);
}

const authHeaders = AUTH_TOKEN
  ? { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` }
  : { 'Content-Type': 'application/json; charset=utf-8' };

// Tüm GET'lere Accept-Language: en — "current" hâlâ birkaç alan için
// (görsel/süre/puan) referans alınıyor, bu alanlar dil-bağımsız olsa da
// GET'in locale-resolved title/synopsis döndürmesi karışıklığı önler.
const getHeaders = { 'Accept-Language': 'en' };

async function putJson(path, body) {
  if (!doWrite) return { ok: true, dryRun: true };
  const res = await fetch(`${BACKEND_BASE_URL}${path}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`PUT ${path} başarısız (${res.status}): ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
  }
  return { ok: true, data };
}

function buildSeriesBody(current, m) {
  return {
    title: m.title,
    titleTr: m.titleTr,
    originalTitle: current.originalTitle,
    slug: current.slug,
    synopsis: m.synopsis,
    synopsisTr: m.synopsisTr,
    firstAirDate: current.firstAirDate,
    lastAirDate: current.lastAirDate,
    status: current.status,
    posterUrl: current.posterUrl,
    coverImageUrl: current.coverImageUrl,
    trailerUrl: current.trailerUrl,
    contentRating: current.contentRating,
    originCountry: current.originCountry,
    originalLanguage: current.originalLanguage,
    externalRating: current.externalRating,
    externalVoteCount: current.externalVoteCount,
    imdbId: current.imdbId,
    tmdbId: current.tmdbId,
    franchiseId: current.franchiseId,
    genreIds: current.genreIds,
    producerIds: current.producerIds,
  };
}

function buildEpisodeBody(current, m) {
  return {
    episodeNumber: m.episodeNumber,
    title: m.title,
    titleTr: m.titleTr,
    synopsis: m.synopsis,
    synopsisTr: m.synopsisTr,
    airDate: current.airDate,
    durationMinutes: current.durationMinutes,
    stillImageUrl: current.stillImageUrl,
    externalRating: current.externalRating,
    externalVoteCount: current.externalVoteCount,
    imdbId: current.imdbId,
    tmdbId: current.tmdbId,
    storyKicker: current.storyKicker,
    storyKickerTr: current.storyKickerTr,
    storyTitle: current.storyTitle,
    storyTitleTr: current.storyTitleTr,
    storyThesis: current.storyThesis,
    storyThesisTr: current.storyThesisTr,
    episodeBlocks: null, // dokunulmuyor — null mevcut blokları korur (seasonBlocks ile aynı sözleşme)
  };
}

async function main() {
  const merged = JSON.parse(readFileSync(resolve(DATA_FILE), 'utf8'));

  console.log(`Series detayı çekiliyor: ${SERIES_SLUG}`);
  const series = await fetch(`${BACKEND_BASE_URL}/series/slug/${SERIES_SLUG}`, { headers: getHeaders }).then((r) => r.json());

  mkdirSync(resolve('scripts/output'), { recursive: true });

  if (!seasonFilter) {
    const seriesBody = buildSeriesBody(series, merged.series);
    writeFileSync(resolve(`scripts/output/series-${SERIES_SLUG}-body.json`), JSON.stringify(seriesBody, null, 2));
    const res = await putJson(`/series/${series.id}`, seriesBody);
    console.log(res.dryRun ? 'Series: DRY-RUN, gövde yazıldı.' : `✓ Series backend'e yazıldı (id: ${series.id}).`);
  }

  for (const seasonRef of series.seasons) {
    if (seasonFilter && seasonRef.seasonNumber !== seasonFilter) continue;
    const mEpisodes = merged.seasons[String(seasonRef.seasonNumber)];
    if (!mEpisodes) {
      console.warn(`Season ${seasonRef.seasonNumber}: veri yok, atlanıyor.`);
      continue;
    }

    console.log(`Season ${seasonRef.seasonNumber} (id: ${seasonRef.id}) bölümleri çekiliyor...`);
    const seasonDetail = await fetch(`${BACKEND_BASE_URL}/seasons/${seasonRef.id}`, { headers: getHeaders }).then((r) => r.json());
    const episodes = [...seasonDetail.episodes].sort((a, b) => a.episodeNumber - b.episodeNumber);

    if (episodes.length !== mEpisodes.length) {
      throw new Error(
        `Season ${seasonRef.seasonNumber}: backend'de ${episodes.length} bölüm var, veri dosyasında ${mEpisodes.length} — eşleşmiyor.`
      );
    }

    const seasonOutput = [];
    for (let i = 0; i < episodes.length; i++) {
      const ep = episodes[i];
      const m = mEpisodes[i];
      if (ep.episodeNumber !== m.episodeNumber) {
        throw new Error(`Season ${seasonRef.seasonNumber}: sırada uyuşmazlık — backend ${ep.episodeNumber}, veri ${m.episodeNumber}.`);
      }
      const body = buildEpisodeBody(ep, m);
      seasonOutput.push({ episodeNumber: ep.episodeNumber, id: ep.id, body });

      const res = await putJson(`/episodes/${ep.id}`, body);
      console.log(
        res.dryRun
          ? `  ${m.episodeNumber}. ${m.title} -> ${m.titleTr}: DRY-RUN`
          : `  ✓ ${m.episodeNumber}. ${m.title} -> ${m.titleTr} yazıldı (id: ${ep.id}).`
      );
    }
    writeFileSync(
      resolve(`scripts/output/season-${seasonRef.seasonNumber}-episodes-body.json`),
      JSON.stringify(seasonOutput, null, 2)
    );
  }

  if (!doWrite) {
    console.log('\nDRY-RUN: backend\'e yazılmadı. Onay sonrası --write ile tekrar çalıştır.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
