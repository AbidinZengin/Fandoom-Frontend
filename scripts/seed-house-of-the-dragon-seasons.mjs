#!/usr/bin/env node
// House of the Dragon'ın Season 1-2 / bölüm verisini (görsel HARİÇ — sadece
// title/airDate/synopsisTr) POST /api/series/6/seasons ve
// POST /api/seasons/:id/episodes ile yazan tek seferlik seed script'i.
// seed-breaking-bad.mjs'in aynı deseni: idempotent, rapor dosyasından resume.
//
// Kullanım (PowerShell):
//   $env:AUTH_TOKEN="..."; node scripts/seed-house-of-the-dragon-seasons.mjs

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
const SERIES_ID = 6; // house-of-the-dragon

if (!AUTH_TOKEN) {
  console.error('AUTH_TOKEN yok — bu script sadece backend yazımı içindir, dry-run modu yok.');
  process.exit(1);
}

function loadReport() {
  const path = resolve('scripts/output/house-of-the-dragon-seed-report.json');
  if (!existsSync(path)) return { seasons: {} };
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return { seasons: {} };
  }
}
function saveReport(report) {
  mkdirSync(resolve('scripts/output'), { recursive: true });
  writeFileSync(resolve('scripts/output/house-of-the-dragon-seed-report.json'), JSON.stringify(report, null, 2));
}

async function post(path, body) {
  const res = await fetch(`${BACKEND_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`${res.status}: ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
  }
  return data;
}

async function main() {
  const { seasons } = JSON.parse(readFileSync(resolve('scripts/data/house-of-the-dragon-seasons.json'), 'utf8'));
  const report = loadReport();

  for (const season of seasons) {
    const sKey = String(season.seasonNumber);
    const label = `Season ${season.seasonNumber}`;
    let seasonId = report.seasons[sKey]?.seasonId ?? null;

    if (!seasonId) {
      try {
        const created = await post(`/series/${SERIES_ID}/seasons`, {
          seasonNumber: season.seasonNumber,
          title: season.title,
          airDate: season.airDate,
        });
        seasonId = created.id;
        console.log(`✓ ${label} oluşturuldu (id: ${seasonId})`);
        report.seasons[sKey] = { seasonId, episodes: report.seasons[sKey]?.episodes || {} };
        saveReport(report);
      } catch (err) {
        console.log(`✗ ${label}: ${err.message}`);
        report.seasons[sKey] = { seasonId: null, error: err.message, episodes: report.seasons[sKey]?.episodes || {} };
        saveReport(report);
        continue;
      }
    } else {
      console.log(`${label}: zaten var (id: ${seasonId})`);
    }

    report.seasons[sKey].episodes = report.seasons[sKey].episodes || {};

    for (const ep of season.episodes) {
      const eKey = String(ep.episodeNumber);
      const epLabel = `S${season.seasonNumber}E${ep.episodeNumber} — ${ep.title}`;
      if (report.seasons[sKey].episodes[eKey]?.episodeId) {
        console.log(`  = ${epLabel}: zaten var, atlandı`);
        continue;
      }
      try {
        const created = await post(`/seasons/${seasonId}/episodes`, {
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          synopsisTr: ep.synopsisTr,
          airDate: ep.airDate,
        });
        console.log(`  ✓ ${epLabel} (id: ${created.id})`);
        report.seasons[sKey].episodes[eKey] = { episodeId: created.id };
        saveReport(report);
      } catch (err) {
        console.log(`  ✗ ${epLabel}: ${err.message}`);
        report.seasons[sKey].episodes[eKey] = { episodeId: null, error: err.message };
        saveReport(report);
      }
    }
  }

  console.log('\nBitti. Rapor: scripts/output/house-of-the-dragon-seed-report.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
