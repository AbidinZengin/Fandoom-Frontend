#!/usr/bin/env node
// seed-season-story.mjs'in Severance varyantı — House of the Dragon
// varyantıyla AYNI desen, sadece SERIES_SLUG, EN kaynak (Severance/
// SeasonDetail/SeasonStory) ve TR dosyası (severance-season-story-tr.json)
// değişti.
//
// Kullanım (PowerShell):
//   node scripts/seed-severance-season-story.mjs --season 1                (dry-run)
//   $env:AUTH_TOKEN="..."; node scripts/seed-severance-season-story.mjs --season 1 --write

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

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
const SERIES_SLUG = process.env.SERIES_SLUG || 'severance';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;

const seasonFilterArg = process.argv.indexOf('--season');
const seasonFilter = seasonFilterArg !== -1 ? Number(process.argv[seasonFilterArg + 1]) : null;
const doWrite = process.argv.includes('--write');

if (!seasonFilter) {
  console.error('--season <n> zorunlu (tek seferde tek sezon işlenir).');
  process.exit(1);
}
if (doWrite && !AUTH_TOKEN) {
  console.error('--write için AUTH_TOKEN ortam değişkeni zorunlu.');
  process.exit(1);
}

const join = (paragraphs) => paragraphs.join('\n\n');

function buildSeasonBlocks(en, tr) {
  const blocks = [];

  blocks.push({
    blockType: 'LEDE_TEXT',
    sceneKey: 'lede',
    content: join(en.lede),
    contentTr: join(tr.lede),
  });

  en.sections.forEach((section, i) => {
    const sectionTr = tr.sections[i];
    if (sectionTr.id && sectionTr.id !== section.id) {
      throw new Error(`Section id uyuşmazlığı: EN=${section.id} TR=${sectionTr.id}`);
    }
    const sceneKey = section.id;

    blocks.push({ blockType: 'SECTION_HEADING', sceneKey, content: section.heading, contentTr: sectionTr.heading });

    blocks.push({
      blockType: 'MEDIA',
      sceneKey,
      mediaEpisodeRef: section.photo.episodeNumber,
      mediaCaption: section.photo.caption,
      mediaCaptionTr: sectionTr.photo.caption,
      mediaCredit: section.photo.credit,
    });

    const [enLead, ...enRest] = section.paragraphs;
    const [trLead, ...trRest] = sectionTr.paragraphs;
    blocks.push({ blockType: 'SECTION_LEAD_TEXT', sceneKey, content: enLead, contentTr: trLead });
    if (enRest.length > 0) {
      blocks.push({ blockType: 'SECTION_TEXT', sceneKey, content: join(enRest), contentTr: join(trRest) });
    }

    if (section.pullQuote) {
      blocks.push({ blockType: 'QUOTE', sceneKey, content: section.pullQuote, contentTr: sectionTr.pullQuote });
    }
  });

  blocks.push({
    blockType: 'VERDICT_TEXT',
    sceneKey: 'verdict',
    content: join(en.verdict),
    contentTr: join(tr.verdict),
  });

  return blocks;
}

async function main() {
  const { getSeasonStory } = await import(
    pathToFileURL(resolve('src/pages/series/Severance/SeasonDetail/SeasonStory/SeasonStory.data.js')).href
  );
  const en = getSeasonStory(seasonFilter);
  if (!en) throw new Error(`SeasonStory.data.js'te Season ${seasonFilter} içeriği yok.`);

  const trAll = JSON.parse(readFileSync(resolve('scripts/data/severance-season-story-tr.json'), 'utf8'));
  const tr = trAll[String(seasonFilter)];
  if (!tr) throw new Error(`severance-season-story-tr.json'da Season ${seasonFilter} çevirisi yok.`);

  console.log(`Series detayı çekiliyor: ${SERIES_SLUG}`);
  const series = await fetch(`${BACKEND_BASE_URL}/series/slug/${SERIES_SLUG}`).then((r) => r.json());
  const seasonRef = series.seasons.find((s) => s.seasonNumber === seasonFilter);
  if (!seasonRef) throw new Error(`Season ${seasonFilter} backend'de bulunamadı.`);

  console.log(`Season ${seasonFilter} (id: ${seasonRef.id}) mevcut kaydı çekiliyor...`);
  const current = await fetch(`${BACKEND_BASE_URL}/seasons/${seasonRef.id}`).then((r) => r.json());

  const body = {
    seasonNumber: current.seasonNumber,
    title: current.title,
    titleTr: current.titleTr ?? `Sezon ${current.seasonNumber}`,
    airDate: current.airDate,
    posterUrl: current.posterUrl,
    storyKicker: en.kicker,
    storyKickerTr: tr.kicker,
    storyTitle: en.title,
    storyTitleTr: tr.title,
    storyDek: en.dek,
    storyDekTr: tr.dek,
    seasonBlocks: buildSeasonBlocks(en, tr),
  };

  mkdirSync(resolve('scripts/output'), { recursive: true });
  writeFileSync(resolve(`scripts/output/severance-season-${seasonFilter}-story-body.json`), JSON.stringify(body, null, 2));
  console.log(`\nGövde yazıldı: scripts/output/severance-season-${seasonFilter}-story-body.json (${body.seasonBlocks.length} blok)`);

  if (!doWrite) {
    console.log('\nDRY-RUN: backend\'e yazılmadı. Onay sonrası --write ile tekrar çalıştır.');
    return;
  }

  const res = await fetch(`${BACKEND_BASE_URL}/seasons/${seasonRef.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`PUT /seasons/${seasonRef.id} başarısız (${res.status}): ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
  }
  console.log(`✓ Season ${seasonFilter} backend'e yazıldı (id: ${seasonRef.id}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
