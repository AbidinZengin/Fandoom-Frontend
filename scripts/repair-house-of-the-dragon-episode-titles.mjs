#!/usr/bin/env node
// TEK SEFERLİK ONARIM: enrich-house-of-the-dragon-episodes.mjs, Accept-Language
// header'sız GET yaptığı için Sezon 1-2 bölümlerinin İngilizce `title`
// sütununu Türkçe metinle ezmişti (current.title default-locale'de titleTr'ye
// çözülüyordu, bu script onu aynen "EN" diye geri PUT ediyordu). Bu script
// sadece `title` alanını house-of-the-dragon-seasons.json'daki ORİJİNAL
// doğru İngilizce başlıkla düzeltir — titleTr ve diğer tüm alanlar GET'ten
// (Accept-Language: en ile) AYNEN korunur, icat edilmez.
//
// Kullanım (PowerShell):
//   node scripts/repair-house-of-the-dragon-episode-titles.mjs                (dry-run)
//   $env:AUTH_TOKEN="..."; node scripts/repair-house-of-the-dragon-episode-titles.mjs --write

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
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;
const doWrite = process.argv.includes('--write');

if (doWrite && !AUTH_TOKEN) {
  console.error('--write için AUTH_TOKEN ortam değişkeni zorunlu.');
  process.exit(1);
}

const enrichment = JSON.parse(
  readFileSync(resolve('scripts/data/house-of-the-dragon-episode-enrichment.json'), 'utf8')
);
const seasonsSource = JSON.parse(
  readFileSync(resolve('scripts/data/house-of-the-dragon-seasons.json'), 'utf8')
);

// seasonId -> seasonNumber eşlemesi enrichment.json anahtarlarından (15/16/17)
// gelmiyor, seasons.json'daki sırayla eşleşiyor (15=S1, 16=S2, 17=S3) — sadece
// bozulan S1/S2'yi onarıyoruz.
const SEASON_ID_TO_NUMBER = { 15: 1, 16: 2 };

async function main() {
  mkdirSync(resolve('scripts/output'), { recursive: true });
  const report = [];

  for (const [seasonId, seasonNumber] of Object.entries(SEASON_ID_TO_NUMBER)) {
    const seasonSource = seasonsSource.seasons.find((s) => s.seasonNumber === seasonNumber);
    const episodeEntries = enrichment[seasonId];

    for (const epNum of Object.keys(episodeEntries)) {
      const { episodeId } = episodeEntries[epNum];
      const correctTitle = seasonSource.episodes.find((e) => e.episodeNumber === Number(epNum))?.title;
      if (!correctTitle) throw new Error(`Season ${seasonNumber} episode ${epNum}: kaynak EN başlık bulunamadı.`);

      const current = await fetch(`${BACKEND_BASE_URL}/episodes/${episodeId}`, {
        headers: { 'Accept-Language': 'en' },
      }).then((r) => r.json());

      if (current.title === correctTitle) {
        report.push({ episodeId, seasonNumber, epNum, status: 'zaten doğru', title: correctTitle });
        continue;
      }

      const body = {
        episodeNumber: current.episodeNumber,
        title: correctTitle,
        titleTr: current.titleTr,
        synopsis: current.synopsis,
        synopsisTr: current.synopsisTr,
        airDate: current.airDate,
        durationMinutes: current.durationMinutes,
        stillImageUrl: current.stillImageUrl,
        externalRating: current.externalRating,
        externalVoteCount: current.externalVoteCount,
        externalRatingUpdatedAt: current.externalRatingUpdatedAt,
        imdbId: current.imdbId,
        tmdbId: current.tmdbId,
        storyTitle: current.storyTitle,
        storyTitleTr: current.storyTitleTr,
        episodeBlocks: current.episodeBlocks || [],
      };

      report.push({
        episodeId,
        seasonNumber,
        epNum,
        status: doWrite ? 'yazılacak' : 'DRY-RUN',
        before: current.title,
        after: correctTitle,
      });

      if (doWrite) {
        const res = await fetch(`${BACKEND_BASE_URL}/episodes/${episodeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(`PUT /episodes/${episodeId} başarısız (${res.status}): ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
        }
        console.log(`✓ S${seasonNumber}E${epNum} (id ${episodeId}): "${current.title}" -> "${correctTitle}"`);
      } else {
        console.log(`  S${seasonNumber}E${epNum} (id ${episodeId}): "${current.title}" -> "${correctTitle}"`);
      }
    }
  }

  writeFileSync(resolve('scripts/output/hotd-title-repair-report.json'), JSON.stringify(report, null, 2));

  if (!doWrite) {
    console.log('\nDRY-RUN: backend\'e yazılmadı. Onay sonrası --write ile tekrar çalıştır.');
  } else {
    console.log('\nBitti.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
