#!/usr/bin/env node
// house-of-the-dragon-episode-enrichment.json'daki eksik alanları (titleTr,
// synopsis EN, durationMinutes, externalRating/VoteCount, tmdbId) mevcut
// bölüm kayıtlarına PUT /api/episodes/:id ile ekler. Önce GET ile mevcut
// kaydı çeker, sadece eksik alanları merge eder (title/synopsisTr/airDate
// gibi zaten doğru olanlara dokunmaz) — PUT tam gövde istediği için gerekli.
//
// GET'e Accept-Language: en ZORUNLU — header'sız istek varsayılan locale'e
// (TR) düşer ve dönen "title" alanı titleTr'ye çözülür; o "current.title"ı
// aynen geri PUT etmek EN sütununu TR ile ezer (bu script tam olarak bu
// hataya düştü — S1/S2 bölüm başlıkları bozuldu, bkz.
// scripts/repair-house-of-the-dragon-episode-titles.mjs. Aynı sınıf hata
// daha önce seed-episode-translations.mjs'de de yaşanmıştı, 2026-08-22).
//
// Kullanım (PowerShell):
//   $env:AUTH_TOKEN="..."; node scripts/enrich-house-of-the-dragon-episodes.mjs

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

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;

if (!AUTH_TOKEN) {
  console.error('AUTH_TOKEN yok.');
  process.exit(1);
}

async function main() {
  const enrichment = JSON.parse(
    readFileSync(resolve('scripts/data/house-of-the-dragon-episode-enrichment.json'), 'utf8')
  );

  for (const seasonId of Object.keys(enrichment)) {
    for (const epNum of Object.keys(enrichment[seasonId])) {
      const extra = enrichment[seasonId][epNum];
      const { episodeId, ...fields } = extra;

      const current = await fetch(`${BACKEND_BASE_URL}/episodes/${episodeId}`, {
        headers: { 'Accept-Language': 'en' },
      }).then((r) => r.json());

      const body = {
        episodeNumber: current.episodeNumber,
        title: current.title,
        titleTr: fields.titleTr,
        synopsis: fields.synopsis,
        synopsisTr: fields.synopsisTr ?? current.synopsisTr,
        airDate: current.airDate,
        durationMinutes: fields.durationMinutes,
        stillImageUrl: current.stillImageUrl,
        externalRating: fields.externalRating,
        externalVoteCount: fields.externalVoteCount,
        externalRatingUpdatedAt: new Date().toISOString().slice(0, 19),
        imdbId: current.imdbId,
        tmdbId: fields.tmdbId,
        storyTitle: current.storyTitle,
        storyTitleTr: current.storyTitleTr,
        episodeBlocks: current.episodeBlocks || [],
      };

      const res = await fetch(`${BACKEND_BASE_URL}/episodes/${episodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        console.log(`✗ episode ${episodeId}: ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
        continue;
      }
      console.log(`✓ episode ${episodeId} (${current.title}) güncellendi`);
    }
  }
  console.log('\nBitti.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
