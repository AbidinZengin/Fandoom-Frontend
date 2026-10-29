#!/usr/bin/env node
// "Eyes Wide Shut: Masks On, Eyes Shut" (derin okuma) — scripts/lib/blog-publish.mjs'i
// kullanan generic blog script. Kaynak: docs_dev/blog-drafts/
// eyes-wide-shut-gozler-kapali-maskeler-acik.md (TR onaylı, EN yeniden yazım).
//
// Mulholland Drive script'inden FARKLARI:
//  - Görseller TMDb'den seçildi (IMAGE_SLOTS), Cloudinary'ye yükleme AYRI
//    onay ister; taslaktaki "> Görsel:" / "> Image:" yer tutucu satırları
//    parse'ta atlanır.
//  - Sonuç bölümü 2 paragraf olduğu için VERDICT_TEXT'e yalnız SON paragraf
//    (final sorusu) ayrılır, ilk paragraf Sonuç gövdesinde kalır.
//  - Status PUBLISHED (ilk POST DRAFT'tı, id 994 PUT ile yayına alınır).
//  - Metin script'e gömülü değil, çalışma anında taslaktan parse edilir.
//
// Kullanım (repo kökünden):
//   node scripts/blogs/eyes-wide-shut-gozler-kapali-maskeler-acik.mjs           (dry-run)
//   node scripts/blogs/eyes-wide-shut-gozler-kapali-maskeler-acik.mjs --write   (yeni POST, DRAFT)
//   ... --write --blog-id <id>                                                  (PUT, blocks REPLACE-ALL)

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createBlockBuilder, P, publishBlog } from '../lib/blog-publish.mjs';

const DRAFT_PATH = 'docs_dev/blog-drafts/eyes-wide-shut-gozler-kapali-maskeler-acik.md';
const MOVIE_ID = 19;

// Görseller TMDb'den seçildi (2026-10-10), Cloudinary'ye 'remote' modunda
// yüklenir. DİKKAT: publishBlog dry-run'da bile resolveImages'ı çalıştırır,
// yani script'i her çalıştırmak Cloudinary'ye yükleme tetikler (ayrı onay).
const TMDB = 'https://image.tmdb.org/t/p/original';
const images = {
  cover: { type: 'remote', src: `${TMDB}/AklO85uUDAL3O7iSOtFGfqT3w8n.jpg`, hint: 'ews-cover' },
  catlak: { type: 'remote', src: `${TMDB}/zADGWnHHQ7JnipP23Oj85BHQNrQ.jpg`, hint: 'ews-catlak' },
  maske: { type: 'remote', src: `${TMDB}/i2NA1zD6khkgYltK0373O3s4tIF.jpg`, hint: 'ews-maske' },
  hayal: { type: 'remote', src: `${TMDB}/AmYxFCiZRhEzB091pF93XYdAE6.jpg`, hint: 'ews-hayal' },
  kiskanclik: { type: 'remote', src: `${TMDB}/yo7Wk93bLOS4Kkp1JVsaMUsI1VD.jpg`, hint: 'ews-kiskanclik' },
  alice: { type: 'remote', src: `${TMDB}/vfnOQxRe4NKabNFAsfa1rC3OV1Q.jpg`, hint: 'ews-alice' },
  uyanik: { type: 'remote', src: `${TMDB}/tsulxLVKVJUnw7vi8hQRLnm6uL1.jpg`, hint: 'ews-uyanik' },
};

// Anahtar: 1 tabanlı ## bölüm sırası. Sonuç (7) görselsiz kalır.
const IMAGE_SLOTS = {
  1: { key: 'catlak', altEn: 'Alice rolling a joint at a table, a wedding ring on her finger.', altTr: 'Bir masada esrar saran Alice, parmağında alyans.' },
  2: { key: 'maske', altEn: 'A hooded figure in a gold-patterned mask.', altTr: 'Altın desenli maske takmış, kukuletalı bir figür.' },
  3: { key: 'hayal', altEn: 'Alice asleep in blue light, a mask resting on the pillow beside her.', altTr: 'Mavi ışıkta uyuyan Alice, yanındaki yastıkta bir maske.' },
  4: { key: 'kiskanclik', altEn: 'Bill on a neon-lit night street, Christmas lights behind him.', altTr: 'Neon ışıklı gece sokağında Bill, arkasında Noel ışıkları.' },
  5: { key: 'alice', altEn: 'Alice with a cigarette, her wedding ring catching the light.', altTr: 'Elinde sigarayla Alice, alyansı ışıkta parlıyor.' },
  6: { key: 'uyanik', altEn: 'A lit Christmas tree and a figure standing in the doorway.', altTr: 'Işıklı bir Noel ağacı ve kapı aralığında duran bir figür.' },
};

const COVER_ALT = {
  en: 'The circle of masked figures at the Somerton ritual.',
  tr: 'Somerton töreninde maskeli figürlerin oluşturduğu daire.',
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
      // Görsel yer tutucusu (> Görsel: ... / > Image: ...) metne girmez.
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
    // Sonuç: son paragraf (final sorusu) VERDICT_TEXT'e ayrılır.
    const trBody = isLast ? trSec.lead.slice(0, -1) : trSec.lead;
    const enBody = isLast ? enSec.lead.slice(0, -1) : enSec.lead;

    blocks.push(block('SECTION_HEADING', key, { en: enSec.title, tr: trSec.title }));
    const slot = IMAGE_SLOTS[i + 1];
    if (slot) {
      blocks.push(block('IMAGE', key, { imageUrl: img[slot.key], altEn: slot.altEn, altTr: slot.altTr }));
    }
    blocks.push(block('SECTION_TEXT', key, { en: P(...enBody), tr: P(...trBody) }));
  });

  const trLast = tr.sections[lastIdx].lead;
  const enLast = en.sections[lastIdx].lead;
  blocks.push(block('VERDICT_TEXT', 'verdict', { en: P(...enLast.slice(-1)), tr: P(...trLast.slice(-1)) }));
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
  // riski, Black Swan / Mulholland'daki açık iş ile aynı).
  spoilerThroughSeasonNumber: null,
  spoilerThroughEpisodeNumber: null,
  recommendedRank: null,
  status: 'PUBLISHED',
  format: 'ANALYSIS',
  readingTimeMinutes: 7,
  imageKey: 'cover',
  tags: [{ subjectType: 'MOVIE', subjectId: MOVIE_ID, seasonNumber: null, episodeNumber: null, franchiseId: null }],
};

await publishBlog({ outputName: 'eyes-wide-shut-gozler-kapali-maskeler-acik', meta, buildBlocks, images });
