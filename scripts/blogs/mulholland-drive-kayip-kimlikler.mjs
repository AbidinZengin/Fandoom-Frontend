#!/usr/bin/env node
// "Rüyalar Gerçekten Gerçek mi? Mulholland Drive'da Kimlik, Arzu ve
// Hollywood'un Karanlık Yüzü" (derin okuma) — scripts/lib/blog-publish.mjs'i
// kullanan generic blog script. Kaynak: docs_dev/blog-drafts/
// mulholland-drive-kayip-kimlikler.md (TR onaylı, EN yeniden yazım).
//
// Black Swan script'inden FARKI: metin script'e gömülü değil, çalışma anında
// taslaktan parse edilir. Taslakta yapılan düzeltme script'e elle taşınmaz.
//
// Şema notları:
//  - Şemada bölüm başına tek SECTION_HEADING ve tek IMAGE var (BlogPost.data.js
//    parseBlogBlocks). Taslaktaki ## başlıklar bölüm olur; ### alt başlıklar
//    YALNIZ IMAGE_SLOTS'ta görsel gelen yerlerde yeni bölüm olarak açılır,
//    diğerlerinin paragrafları önceki bölüme katılır (Black Swan ile aynı kural).
//  - Görseller TMDb'den Cloudinary'ye önceden taşındı (bkz.
//    scripts/output/mulholland-drive-images.json), hepsi type: 'cloudinary'
//    ile aynen geçiriliyor, tekrar yüklenmiyor.
//  - Pull-quote YOK. Sonuç'un son iki paragrafı (final sorusu + yorum çağrısı)
//    VERDICT_TEXT.
//  - MOVIE_ID ortam değişkeni film etiketidir (--write için zorunlu).
//
// Kullanım (repo kökünden, PowerShell):
//   $env:MOVIE_ID=7; node scripts/blogs/mulholland-drive-kayip-kimlikler.mjs               (dry-run)
//   $env:MOVIE_ID=7; node scripts/blogs/mulholland-drive-kayip-kimlikler.mjs --write       (yeni POST, AYRI ONAY)
//   ... --write --blog-id <id>                                                             (PUT, blocks REPLACE-ALL)

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createBlockBuilder, P, publishBlog } from '../lib/blog-publish.mjs';

const DRAFT_PATH = 'docs_dev/blog-drafts/mulholland-drive-kayip-kimlikler.md';
const IMAGES_PATH = 'scripts/output/mulholland-drive-images.json';
const MOVIE_ID = Number(process.env.MOVIE_ID) || null;

if (process.argv.includes('--write') && !MOVIE_ID) {
  console.error('--write için MOVIE_ID ortam değişkeni zorunlu.');
  process.exit(1);
}

// Anahtar: "<## bölüm no>.<### alt başlık no>" (1 tabanlı). İlk alt başlıkta
// görsel, ## bölümünün kendi görseli olur; sonrakilerde yeni bölüm açılır.
const IMAGE_SLOTS = {
  '1.1': { key: 'betty', altEn: 'Betty smiling outside an airport terminal, taxis behind her.', altTr: 'Havaalanı çıkışında gülümseyen Betty, arkasında taksiler.' },
  '2.1': { key: 'rita', altEn: 'Rita in the back seat of the limousine.', altTr: 'Limuzinin arka koltuğunda Rita.' },
  '2.2': { key: 'peruk', altEn: "Betty and Rita side by side in a mirror's reflection.", altTr: 'Bir aynanın yansımasında yan yana Betty ve Rita.' },
  '3.1': { key: 'hollywood', altEn: 'The Hollywood sign on the hillside.', altTr: 'Tepedeki Hollywood yazısı.' },
  '3.3': { key: 'adam', altEn: 'Adam Kesher on set, wearing headphones and dark glasses.', altTr: 'Set başında kulaklık ve koyu gözlükle Adam Kesher.' },
  '4.1': { key: 'silencio', altEn: 'A trumpeter and a host on stage in front of red curtains at Club Silencio.', altTr: "Club Silencio'da kırmızı perdenin önünde sahnede bir trompetçi ve bir sunucu." },
  '4.2': { key: 'anahtar', altEn: 'A hand holding the small blue key.', altTr: 'Küçük mavi anahtarı tutan bir el.' },
  '5.2': { key: 'parti', altEn: 'Camilla kissing a blonde woman at the party.', altTr: 'Partide sarışın bir kadını öpen Camilla.' },
  '5.3': { key: 'katil', altEn: 'The Winkie\'s sign on Sunset Boulevard.', altTr: "Sunset Bulvarı'ndaki Winkie's tabelası." },
  '6.1': { key: 'lynch', altEn: "The soot-faced figure behind Winkie's diner.", altTr: "Winkie's lokantasının arkasındaki isli yüzlü figür." },
  '7.1': { key: 'diane', altEn: "Diane's face in a dim room after waking.", altTr: 'Uyandıktan sonra loş bir odada Diane\'in yüzü.' },
};

const COVER_ALT = {
  en: 'Betty and Rita gazing upwards in daylight.',
  tr: 'Gün ışığında yukarı bakan Betty ve Rita.',
};

// Bir dil bölümünü { kicker, title, dek, lede, sections[{ title, lead, subs[{ title, paras }] }] }'e çevirir.
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
    if (line.startsWith('## ')) {
      flush();
      const section = { title: line.slice(3).trim(), lead: [], subs: [] };
      sections.push(section);
      target = section.lead;
    } else if (line.startsWith('### ')) {
      flush();
      const sub = { title: line.slice(4).trim(), paras: [] };
      sections[sections.length - 1].subs.push(sub);
      target = sub.paras;
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

// TR/EN yapısal eşdeğerlik: bölüm, alt başlık ve paragraf sayıları birebir aynı olmalı.
const mismatch = (what, a, b) => {
  throw new Error(`Yapı uyuşmuyor (${what}): TR ${a}, EN ${b}.`);
};
if (tr.lede.length !== en.lede.length) mismatch('lede', tr.lede.length, en.lede.length);
if (tr.sections.length !== en.sections.length) mismatch('bölüm', tr.sections.length, en.sections.length);
tr.sections.forEach((s, i) => {
  const e = en.sections[i];
  if (s.lead.length !== e.lead.length) mismatch(`bölüm ${i + 1} giriş`, s.lead.length, e.lead.length);
  if (s.subs.length !== e.subs.length) mismatch(`bölüm ${i + 1} alt başlık`, s.subs.length, e.subs.length);
  s.subs.forEach((sub, j) => {
    if (sub.paras.length !== e.subs[j].paras.length) mismatch(`bölüm ${i + 1}.${j + 1} paragraf`, sub.paras.length, e.subs[j].paras.length);
  });
});

const imageUrls = JSON.parse(readFileSync(resolve(IMAGES_PATH), 'utf8'));
const images = Object.fromEntries(Object.entries(imageUrls).map(([key, src]) => [key, { type: 'cloudinary', src }]));

function buildBlocks(img) {
  const block = createBlockBuilder();
  const blocks = [block('LEDE_TEXT', 'lede', { en: P(...en.lede), tr: P(...tr.lede) })];
  const lastIdx = tr.sections.length - 1;
  let sceneNo = 0;

  const emit = (scene) => {
    const key = `scene-${++sceneNo}`;
    blocks.push(block('SECTION_HEADING', key, { en: scene.headingEn, tr: scene.headingTr }));
    if (scene.slot) {
      blocks.push(block('IMAGE', key, { imageUrl: img[scene.slot.key], altEn: scene.slot.altEn, altTr: scene.slot.altTr }));
    }
    blocks.push(block('SECTION_TEXT', key, { en: P(...scene.en), tr: P(...scene.tr) }));
  };

  tr.sections.forEach((trSec, i) => {
    const enSec = en.sections[i];
    const isLast = i === lastIdx;
    // Sonuç: son iki paragraf VERDICT_TEXT'e ayrılır.
    const trLead = isLast ? trSec.lead.slice(0, -2) : trSec.lead;
    const enLead = isLast ? enSec.lead.slice(0, -2) : enSec.lead;

    let scene = { headingEn: enSec.title, headingTr: trSec.title, slot: null, en: [...enLead], tr: [...trLead] };

    trSec.subs.forEach((trSub, j) => {
      const enSub = enSec.subs[j];
      const slot = IMAGE_SLOTS[`${i + 1}.${j + 1}`];
      if (slot) {
        if (scene.slot || scene.tr.length) {
          emit(scene);
          scene = { headingEn: enSub.title, headingTr: trSub.title, slot, en: [], tr: [] };
        } else {
          scene.slot = slot;
        }
      }
      scene.en.push(...enSub.paras);
      scene.tr.push(...trSub.paras);
    });
    emit(scene);
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
  // riski, Black Swan'daki açık iş ile aynı); backend kararı bekleniyor.
  spoilerThroughSeasonNumber: null,
  spoilerThroughEpisodeNumber: null,
  recommendedRank: null,
  status: 'PUBLISHED',
  format: 'ANALYSIS',
  readingTimeMinutes: 12,
  imageKey: 'cover',
  tags: MOVIE_ID ? [{ subjectType: 'MOVIE', subjectId: MOVIE_ID, seasonNumber: null, episodeNumber: null, franchiseId: null }] : [],
};

await publishBlog({ outputName: 'mulholland-drive-kayip-kimlikler', meta, buildBlocks, images });
