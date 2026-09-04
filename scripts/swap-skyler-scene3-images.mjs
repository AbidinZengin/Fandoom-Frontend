#!/usr/bin/env node
// scene-3 / scene-3b IMAGE bloklarının sırasını değiştirir (kullanıcı kararı:
// Skyler net odakta olan görsel önce, Walt net odakta olan sonra gelsin).
// Diğer hiçbir alan değişmiyor — REPLACE-ALL olduğu için tam gövde geri
// gönderiliyor (bkz. fix-skyler-scene3-images.mjs ile aynı desen).
//
// Kullanım: node scripts/swap-skyler-scene3-images.mjs --write

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

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;
const BLOG_ID = 301;
const doWrite = process.argv.includes('--write');

if (doWrite && !AUTH_TOKEN) {
  console.error('--write için AUTH_TOKEN zorunlu.');
  process.exit(1);
}

function buildPutBody(current) {
  const sceneImgs = current.blocks.filter((b) => b.blockType === 'IMAGE' && (b.sceneKey === 'scene-3' || b.sceneKey === 'scene-3b'));
  const a = sceneImgs.find((b) => b.sceneKey === 'scene-3'); // şu an Walt net
  const b = sceneImgs.find((b) => b.sceneKey === 'scene-3b'); // şu an Skyler net

  const swapped = current.blocks.map((block) => {
    if (block.blockType === 'IMAGE' && block.sceneKey === 'scene-3') {
      return { ...block, imageUrl: b.imageUrl, imageAlt: b.imageAlt, imageAltTr: b.imageAltTr };
    }
    if (block.blockType === 'IMAGE' && block.sceneKey === 'scene-3b') {
      return { ...block, imageUrl: a.imageUrl, imageAlt: a.imageAlt, imageAltTr: a.imageAltTr };
    }
    return block;
  });

  return {
    title: current.title,
    titleTr: current.titleTr,
    kicker: current.kicker,
    kickerTr: current.kickerTr,
    axis: current.axis,
    axisTr: current.axisTr,
    imageUrl: current.imageUrl,
    imageUrlLarge: current.imageUrlLarge,
    imageAlt: current.imageAlt,
    imageAltTr: current.imageAltTr,
    spoilerThroughSeasonNumber: current.spoilerThroughSeasonNumber,
    spoilerThroughEpisodeNumber: current.spoilerThroughEpisodeNumber,
    recommendedRank: current.recommendedRank,
    spoilerFree: current.spoilerFree,
    status: current.status,
    format: current.format,
    publishedAt: current.publishedAt,
    readingTimeMinutes: current.readingTimeMinutes,
    tags: (current.tags || []).map((tag) => {
      const hasSubject = tag.subjectType != null && tag.subjectId != null;
      return {
        subjectType: tag.subjectType,
        subjectId: tag.subjectId,
        seasonNumber: tag.seasonNumber,
        episodeNumber: tag.episodeNumber,
        franchiseId: hasSubject ? null : tag.franchiseId,
      };
    }),
    blocks: swapped.map((b) => ({
      blockType: b.blockType,
      sceneKey: b.sceneKey,
      content: b.content,
      contentTr: b.contentTr,
      imageUrl: b.imageUrl,
      imageAlt: b.imageAlt,
      imageAltTr: b.imageAltTr,
    })),
  };
}

async function main() {
  mkdirSync(resolve('scripts/output'), { recursive: true });
  const current = await fetch(`${BACKEND_BASE_URL}/blogs/${BLOG_ID}`).then((r) => r.json());
  const body = buildPutBody(current);
  writeFileSync(resolve('scripts/output/skyler-blog-swap-body.json'), JSON.stringify(body, null, 2));

  const imgs = body.blocks.filter((b) => b.blockType === 'IMAGE' && (b.sceneKey === 'scene-3' || b.sceneKey === 'scene-3b'));
  console.log('Yeni sıra:');
  imgs.forEach((b) => console.log(` ${b.sceneKey}: ${b.imageAlt}`));

  if (!doWrite) {
    console.log('\nDRY-RUN: backend’e yazılmadı. Onay sonrası --write ile tekrar çalıştır.');
    return;
  }

  const res = await fetch(`${BACKEND_BASE_URL}/blogs/${BLOG_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`PUT /blogs/${BLOG_ID} başarısız (${res.status}): ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
  }
  console.log('\n✓ Sıra değiştirildi.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
