#!/usr/bin/env node
// "Başarı İçin Her Şey" (derin okuma, Nightcrawler) — scripts/lib/blog-publish.mjs'i
// kullanan generic blog script. Kaynak: docs_dev/blog-drafts/
// nightcrawler-kapitalizmin-en-iyi-calisani.md (TR onaylı, EN yeniden yazım).
//
// Eyes Wide Shut script'inin aynı kalıbı: metin script'e gömülü değil, çalışma
// anında taslaktan parse edilir; taslaktaki "> Görsel:" / "> Image:" satırları
// atlanır.
//  - Taslakta 4 ## bölüm var (Özgeçmiş, Talep, Gider Kalemi, Terfi), Sonuç yok.
//    Son bölümün (Terfi) son İKİ paragrafı VERDICT_TEXT'e ayrılır.
//  - Görseller TMDb'den seçildi (IMAGE_SLOTS), Cloudinary'ye 'remote' modunda
//    yüklenir. DİKKAT: publishBlog dry-run'da bile resolveImages'ı çalıştırır,
//    yani script'i her çalıştırmak Cloudinary'ye yükleme tetikler (ayrı onay).
//  - Status DRAFT: sahne/replik doğrulaması yapılmadı, yayın ayrı adım.
//
// Kullanım (repo kökünden):
//   node scripts/blogs/nightcrawler-basari-icin-her-sey.mjs           (dry-run, YÜKLER)
//   node scripts/blogs/nightcrawler-basari-icin-her-sey.mjs --write   (yeni POST, DRAFT)
//   ... --write --blog-id <id>                                         (PUT, blocks REPLACE-ALL)

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createBlockBuilder, P, publishBlog } from '../lib/blog-publish.mjs';

const DRAFT_PATH = 'docs_dev/blog-drafts/nightcrawler-kapitalizmin-en-iyi-calisani.md';
const MOVIE_ID = 15;

const TMDB = 'https://image.tmdb.org/t/p/original';
const images = {
  cover: { type: 'remote', src: `${TMDB}/hafFBkGirjQmUCCcoDkX6MINGag.jpg`, hint: 'nc-cover' },
  ozgecmis: { type: 'remote', src: `${TMDB}/qfmi70NrUElTWdZoaNVsbBRdHQ9.jpg`, hint: 'nc-ozgecmis' },
  talep: { type: 'remote', src: `${TMDB}/1kxP5DQZyofSnYwm1X0YlcLbX1N.jpg`, hint: 'nc-talep' },
  gider: { type: 'remote', src: `${TMDB}/5v9HDuPFaQNZdsGCEQefdN7fGjN.jpg`, hint: 'nc-gider' },
  terfi: { type: 'remote', src: `${TMDB}/9UgxYPiNg4aghpTeh0VNvYnkqPS.jpg`, hint: 'nc-terfi' },
};

// Anahtar: 1 tabanlı ## bölüm sırası.
const IMAGE_SLOTS = {
  1: { key: 'ozgecmis', altEn: 'Lou in a white shirt standing before a wall of newsroom monitors.', altTr: 'Haber odasının monitör duvarının önünde beyaz gömlekli Lou.' },
  2: { key: 'talep', altEn: "Nina Romina standing in the news channel's control room.", altTr: 'Kanalın kontrol odasında duran Nina Romina.' },
  3: { key: 'gider', altEn: 'Rick and Lou side by side in the front seats of a car at night.', altTr: 'Gece, bir arabanın ön koltuklarında yan yana Rick ve Lou.' },
  4: { key: 'terfi', altEn: 'Lou with his arms spread wide against the lights of Los Angeles.', altTr: "Los Angeles'ın ışıklarının önünde kollarını iki yana açmış Lou." },
};

const COVER_ALT = {
  en: 'Lou Bloom in a leather jacket beside a red car on an empty night street.',
  tr: 'Boş bir gece sokağında kırmızı arabanın yanında deri ceketli Lou Bloom.',
};

// Bir dil bölümünü { kicker, title, dek, lede, sections[{ title, lead }] }'e çevirir.
function parseLocale(md, titleLabel) {
  const lines = md.split(/\r?\n/);
  const field = (label) => {
    const line = lines.find((l) => l.startsWith(`**${label}:**`));
    if (!line) throw new Error(`Taslakta "${label}" alanı bulunamadı.`);
    return line.slice(`**${label}:**`.length).trim();
  };

  const dekIdx = lines.findIndex((l) => l.startsWith('**Dek:**'));
  const lede = [];
  const sections = [];
  let target = lede;
  let buffer = [];
  const flush = () => {
    if (buffer.length) target.push(buffer.join(' '));
    buffer = [];
  };

  for (const line of lines.slice(dekIdx + 1)) {
    if (line.startsWith('### ')) {
      throw new Error('Bu taslakta ### alt başlık beklenmiyor.');
    } else if (line.startsWith('## ')) {
      flush();
      const section = { title: line.slice(3).trim(), lead: [] };
      sections.push(section);
      target = section.lead;
    } else if (line.startsWith('>')) {
      flush();
    } else if (line.trim() === '---' || line.trim() === '') {
      flush();
    } else {
      buffer.push(line.trim());
    }
  }
  flush();

  return { kicker: field('Kicker'), title: field(titleLabel), dek: field('Dek'), lede, sections };
}

const draft = readFileSync(resolve(DRAFT_PATH), 'utf8');
const [trMd, enMd] = draft.split(/^## EN\s*$/m);
if (!enMd) throw new Error('Taslakta "## EN" bölümü yok; önce EN yazılmalı.');

const tr = parseLocale(trMd, 'Başlık');
const en = parseLocale(enMd, 'Title');

// TR/EN yapısal eşdeğerlik: bölüm ve paragraf sayıları birebir aynı olmalı.
const mismatch = (what, a, b) => {
  throw new Error(`Yapı uyuşmuyor (${what}): TR ${a}, EN ${b}.`);
};
if (tr.lede.length !== en.lede.length) mismatch('lede', tr.lede.length, en.lede.length);
if (tr.sections.length !== en.sections.length) mismatch('bölüm', tr.sections.length, en.sections.length);
tr.sections.forEach((s, i) => {
  const e = en.sections[i];
  if (s.lead.length !== e.lead.length) mismatch(`bölüm ${i + 1} paragraf`, s.lead.length, e.lead.length);
});

function buildBlocks(img) {
  const block = createBlockBuilder();
  const blocks = [block('LEDE_TEXT', 'lede', { en: P(...en.lede), tr: P(...tr.lede) })];
  const lastIdx = tr.sections.length - 1;

  tr.sections.forEach((trSec, i) => {
    const enSec = en.sections[i];
    const key = `scene-${i + 1}`;
    const isLast = i === lastIdx;
    // Son bölüm: son iki paragraf (final sorusu + kapanış) VERDICT_TEXT'e ayrılır.
    const trBody = isLast ? trSec.lead.slice(0, -2) : trSec.lead;
    const enBody = isLast ? enSec.lead.slice(0, -2) : enSec.lead;

    blocks.push(block('SECTION_HEADING', key, { en: enSec.title, tr: trSec.title }));
    const slot = IMAGE_SLOTS[i + 1];
    if (slot) {
      blocks.push(block('IMAGE', key, { imageUrl: img[slot.key], altEn: slot.altEn, altTr: slot.altTr }));
    }
    blocks.push(block('SECTION_TEXT', key, { en: P(...enBody), tr: P(...trBody) }));
  });

  const trLast = tr.sections[lastIdx].lead;
  const enLast = en.sections[lastIdx].lead;
  blocks.push(block('VERDICT_TEXT', 'verdict', { en: P(...enLast.slice(-2)), tr: P(...trLast.slice(-2)) }));
  return blocks;
}

const meta = {
  titleEn: en.title,
  titleTr: tr.title,
  kickerEn: en.kicker,
  kickerTr: tr.kicker,
  axisEn: en.dek,
  axisTr: tr.dek,
  imageUrl: null,
  imageUrlLarge: null,
  imageAltEn: COVER_ALT.en,
  imageAltTr: COVER_ALT.tr,
  // Film: sezon/bölüm kavramı yok. null => spoilerFree=true olur (yanlış etiket
  // riski, Black Swan / Mulholland / Eyes Wide Shut ile aynı açık iş).
  spoilerThroughSeasonNumber: null,
  spoilerThroughEpisodeNumber: null,
  recommendedRank: null,
  status: 'DRAFT',
  format: 'ANALYSIS',
  readingTimeMinutes: 6,
  imageKey: 'cover',
  tags: [{ subjectType: 'MOVIE', subjectId: MOVIE_ID, seasonNumber: null, episodeNumber: null, franchiseId: null }],
};

await publishBlog({ outputName: 'nightcrawler-basari-icin-her-sey', meta, buildBlocks, images });
