#!/usr/bin/env node
// Blog: title/kicker/axis/imageAlt(+Tr) ve her blok'un text/imageAlt(+Tr)
// alanlarını scripts/data/blog-translations.json'dan backend'e yazar.
// GET /api/blogs/slug/{slug} (BlogDetailResponse) locale-resolved DEĞİL —
// title/titleTr gibi çiftleri ham haliyle döner, bu yüzden Accept-Language
// başlığına ihtiyaç yok (bkz. seed-episode-translations.mjs'deki EN/TR karışma
// uyarısı — Blog'da aynı risk yok çünkü GET zaten ayrıştırılmış döner).
// Blok eşleştirmesi index değil block id ile yapılır (id'ler stabil, GET
// sırası orderIndex'e göre zaten doğru).
//
// Kullanım (PowerShell):
//   node scripts/seed-blog-translations.mjs                (dry-run, tüm bloglar)
//   $env:AUTH_TOKEN="..."; node scripts/seed-blog-translations.mjs --write
//   node scripts/seed-blog-translations.mjs --slug the-price-of-an-oath

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { applyFallbackCanvasLayout } from '../src/shared/blogBlockLayout.js';

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
const DATA_FILE = process.env.DATA_FILE || 'scripts/data/blog-translations.json';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;

const doWrite = process.argv.includes('--write');
const slugFilterArg = process.argv.indexOf('--slug');
const slugFilter = slugFilterArg !== -1 ? process.argv[slugFilterArg + 1] : null;

if (doWrite && !AUTH_TOKEN) {
  console.error('--write için AUTH_TOKEN ortam değişkeni zorunlu.');
  process.exit(1);
}

const authHeaders = AUTH_TOKEN
  ? { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` }
  : { 'Content-Type': 'application/json; charset=utf-8' };

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

function buildBlogBody(current, translation) {
  const blocksById = new Map((translation.blocks || []).map((b) => [b.id, b]));
  return {
    titleTr: translation.titleTr ?? current.titleTr,
    title: current.title,
    kickerTr: translation.kickerTr ?? current.kickerTr,
    kicker: current.kicker,
    axisTr: translation.axisTr ?? current.axisTr,
    axis: current.axis,
    imageUrl: current.imageUrl,
    imageUrlLarge: current.imageUrlLarge,
    imageAltTr: translation.imageAltTr ?? current.imageAltTr,
    imageAlt: current.imageAlt,
    spoilerThroughSeasonNumber: current.spoilerThroughSeasonNumber,
    spoilerThroughEpisodeNumber: current.spoilerThroughEpisodeNumber,
    recommendedRank: current.recommendedRank,
    spoilerFree: current.spoilerFree,
    status: current.status,
    format: current.format,
    publishedAt: current.publishedAt,
    canvasHeight: current.canvasHeight,
    blocks: current.blocks.map((block) => {
      const t = blocksById.get(block.id);
      return {
        blockType: block.blockType,
        textTr: t?.textTr ?? block.textTr,
        text: block.text,
        imageUrl: block.imageUrl,
        imageAltTr: t?.imageAltTr ?? block.imageAltTr,
        imageAlt: block.imageAlt,
        x: block.x,
        y: block.y,
        width: block.width,
        height: block.height,
        animation: block.animation,
        fontFamily: block.fontFamily,
        fontScale: block.fontScale,
      };
    }),
    // BlogServiceImpl.applyTags: subjectType+subjectId VEYA yalnızca
    // franchiseId — ikisi birden gönderilirse InvalidReferenceException.
    // GET zaten ikisini birden döndürür (franchiseId subject'ten otomatik
    // hesaplanıp aynı satıra yazılmıştır), bu yüzden subject varsa
    // franchiseId'yi PUT gövdesinden çıkarıyoruz.
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
  };
}

async function main() {
  const translations = JSON.parse(readFileSync(resolve(DATA_FILE), 'utf8'));
  mkdirSync(resolve('scripts/output'), { recursive: true });

  const slugs = slugFilter ? [slugFilter] : Object.keys(translations);

  for (const slug of slugs) {
    const translation = translations[slug];
    if (!translation) {
      console.warn(`${slug}: çeviri verisi yok, atlanıyor.`);
      continue;
    }

    console.log(`Blog çekiliyor: ${slug}`);
    const current = await fetch(`${BACKEND_BASE_URL}/blogs/slug/${slug}`).then((r) => r.json());
    if (!current?.id) {
      throw new Error(`${slug}: backend'den blog alınamadı.`);
    }

    // Eski format (canvasHeight null): backend x/y/width'i @NotNull ister,
    // ama bu bloglar hiç canvas'a taşınmamış — BlogEditor'ın "kaydedince
    // tembel migration" davranışını burada tekrarlıyoruz (bkz.
    // src/shared/blogBlockLayout.js), böylece PUT gövdesi editörün üreteceği
    // ile birebir aynı olur.
    if (current.canvasHeight == null) {
      const fallback = applyFallbackCanvasLayout(current.blocks);
      current.canvasHeight = fallback.canvasHeight;
      current.blocks = fallback.blocks;
      console.log(`  (eski format tespit edildi, fallback canvas layout uygulandı: canvasHeight=${fallback.canvasHeight.toFixed(1)})`);
    }

    const missingIds = (translation.blocks || [])
      .map((b) => b.id)
      .filter((id) => !current.blocks.some((cb) => cb.id === id));
    if (missingIds.length > 0) {
      throw new Error(`${slug}: çeviri verisinde olup backend'de bulunmayan blok id'leri: ${missingIds.join(', ')}`);
    }

    const body = buildBlogBody(current, translation);
    writeFileSync(resolve(`scripts/output/blog-${slug}-body.json`), JSON.stringify(body, null, 2));

    const res = await putJson(`/blogs/${current.id}`, body);
    console.log(
      res.dryRun
        ? `  ${slug} -> "${translation.titleTr}": DRY-RUN`
        : `  ✓ ${slug} -> "${translation.titleTr}" yazıldı (id: ${current.id}).`
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
