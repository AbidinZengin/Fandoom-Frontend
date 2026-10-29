#!/usr/bin/env node
// Pluribus (series id 8) trivia kayıtlarını scripts/data/pluribus-trivia.json
// kaynağından POST /api/trivia ile yazan tek seferlik seed aracı. Görselsiz
// maddeler içindir (Cloudinary yok). Idempotent: rapor dosyasındaki maddeler atlanır.
//
// Kullanım (AUTH_TOKEN .env.local'dan okunur):
//   node scripts/seed-pluribus-trivia.mjs

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
    if (!(key in process.env)) process.env[key] = trimmed.slice(eq + 1).trim();
  }
}
loadDotEnvLocal();

const BACKEND = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const TOKEN = process.env.AUTH_TOKEN;
const REPORT = resolve('scripts/output/pluribus-trivia-seed-report.json');

if (!TOKEN) {
  console.error('Gerekli: AUTH_TOKEN (.env.local)');
  process.exit(1);
}

const { itemId, itemType, items } = JSON.parse(readFileSync('scripts/data/pluribus-trivia.json', 'utf8'));
const report = existsSync(REPORT) ? JSON.parse(readFileSync(REPORT, 'utf8')) : {};

for (const it of items) {
  if (report[it.n]) {
    console.log(`#${it.n} atlandı (kayıtlı id ${report[it.n].triviaId})`);
    continue;
  }
  const res = await fetch(`${BACKEND}/trivia`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({
      itemId,
      itemType,
      title: it.title,
      titleTr: it.titleTr,
      content: it.content,
      contentTr: it.contentTr,
      tags: it.tags,
      isSpoiler: false,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status !== 201) {
    console.error(`#${it.n} BAŞARISIZ ${res.status}`, body);
    process.exit(1);
  }
  report[it.n] = { triviaId: body.id ?? body.data?.id };
  mkdirSync(resolve('scripts/output'), { recursive: true });
  writeFileSync(REPORT, JSON.stringify(report, null, 2));
  console.log(`#${it.n} yazıldı (id ${report[it.n].triviaId})`);
}
