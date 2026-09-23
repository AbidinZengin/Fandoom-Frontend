#!/usr/bin/env node
// "Kasabayı Kim Yazdı?" (From) blogu. Metin, tek kaynak olan
// docs_dev/blog-drafts/from-kasabayi-kim-yazdi.md'den okunur: TR bölümü
// "## Metin (TR)", EN bölümü "## EN" başlığının altındadır. Bölümler
// "###" başlıklarıyla ayrılır, sıra iki dilde aynıdır. Görseller backend'de
// zaten Cloudinary'de duran bölüm kareleridir (yeniden yükleme yok).
//
// Kullanım (PowerShell):
//   node scripts/blogs/from-kasabayi-kim-yazdi.mjs                (dry-run)
//   node scripts/blogs/from-kasabayi-kim-yazdi.mjs --write        (gerçek POST, PUBLISHED)

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createBlockBuilder, publishBlog } from '../lib/blog-publish.mjs';

const CLOUD = 'https://res.cloudinary.com/b0bc5njd/image/upload';
const images = {
  cover: { type: 'cloudinary', src: `${CLOUD}/v1788629336/fandoom/episodes/o0n3ldufldey3wezgrgc.jpg` }, // S3E9
  zemin: { type: 'cloudinary', src: `${CLOUD}/v1788629026/fandoom/episodes/jwwmns0ktjf2ibyjccip.jpg` }, // S2E3
  ilahi: { type: 'cloudinary', src: `${CLOUD}/v1788628835/fandoom/episodes/x9aeexe79xsrrwrrlznw.jpg` }, // S1E6
  sari: { type: 'cloudinary', src: `${CLOUD}/v1788629327/fandoom/episodes/bkjdqmi59dirjekdebfi.jpg` }, // S3E8
  insan: { type: 'cloudinary', src: `${CLOUD}/v1788629352/fandoom/episodes/d7pzysluhcg7vkpfxfbh.jpg` }, // S3E10
  hesap: { type: 'cloudinary', src: `${CLOUD}/v1788628943/fandoom/episodes/iogjsa5lqfsjelzvxob8.jpg` }, // S1E10
};

// Bölüm sırası taslaktaki "###" sırasıyla birebir aynıdır.
const SECTIONS = [
  {
    key: 'zemin',
    altEn: 'A young woman and a boy sit on a porch with a tower of wooden blocks between them.',
    altTr: 'Verandada bir genç kadınla bir çocuk, aralarında bir blok kulesiyle oturuyor.',
  },
  {
    key: 'ilahi',
    altEn: 'A woman bends over a man lying on the mossy floor of a dark forest.',
    altTr: 'Karanlık bir ormanın yosunlu zemininde yatan bir adamın üstüne eğilen kadın.',
  },
  {
    key: 'sari',
    altEn: 'Two figures walk away between the broken stone arches of a ruin in the woods.',
    altTr: 'Ormandaki bir yıkıntının kırık taş kemerleri arasında uzaklaşan iki figür.',
  },
  {
    key: 'insan',
    altEn: 'Three people walk side by side through bare woods.',
    altTr: 'Çıplak bir ormanda yan yana yürüyen üç kişi.',
  },
  { key: 'kusur' },
  {
    key: 'hesap',
    altEn: 'A man with a backpack and a young woman look upwards in a woodland clearing.',
    altTr: 'Sırt çantalı bir adam ve genç bir kadın ormanda yukarı bakıyor.',
  },
];

const draft = readFileSync(resolve('docs_dev/blog-drafts/from-kasabayi-kim-yazdi.md'), 'utf8');

// { lede: string, sections: [{ heading, text }] } — text paragrafları \n\n ile birleşik.
function parseBody(body) {
  const [ledePart, ...rest] = body.split(/^### /m);
  const sections = rest.map((chunk) => {
    const [heading, ...lines] = chunk.trim().split('\n');
    return { heading: heading.trim(), text: lines.join('\n').trim() };
  });
  return { lede: ledePart.trim(), sections };
}

const trBody = draft.split('## Metin (TR)')[1].split('## EN')[0];
const enBody = draft.split('## EN')[1].split(/\*\*Dek:\*\*[^\n]*\n/)[1];
const tr = parseBody(trBody);
const en = parseBody(enBody);

if (tr.sections.length !== SECTIONS.length || en.sections.length !== SECTIONS.length) {
  throw new Error(`Bölüm sayısı uyuşmuyor: TR ${tr.sections.length}, EN ${en.sections.length}, beklenen ${SECTIONS.length}`);
}

const block = createBlockBuilder();

function buildBlocks(img) {
  const blocks = [block('LEDE_TEXT', 'lede', { en: en.lede, tr: tr.lede })];
  SECTIONS.forEach((section, i) => {
    const sceneKey = `scene-${i + 1}`;
    blocks.push(block('SECTION_HEADING', sceneKey, { en: en.sections[i].heading, tr: tr.sections[i].heading }));
    if (section.altEn) {
      blocks.push(block('IMAGE', sceneKey, { imageUrl: img[section.key], altEn: section.altEn, altTr: section.altTr }));
    }
    blocks.push(block('SECTION_TEXT', sceneKey, { en: en.sections[i].text, tr: tr.sections[i].text }));
  });
  return blocks;
}

const meta = {
  titleEn: 'Who Wrote the Town?',
  titleTr: 'Kasabayı Kim Yazdı?',
  kickerEn: 'THE QUESTION OF THE AUTHOR',
  kickerTr: 'YAZARIN SORUSU',
  axisEn: 'From keeps talking about stories. What moral story does each candidate for the author tell us?',
  axisTr: "From'un sözlüğü sürekli hikâyeden söz ediyor. Her yazar adayı bize hangi ahlak hikâyesini anlatıyor?",
  imageUrlLarge: null,
  imageAltEn: 'Townspeople gathered in front of a house in a cold, bare landscape.',
  imageAltTr: 'Soğuk ve çıplak bir manzarada bir evin önünde toplanmış kasabalılar.',
  spoilerThroughSeasonNumber: 3,
  spoilerThroughEpisodeNumber: 10,
  recommendedRank: null,
  status: 'PUBLISHED',
  publishedAt: new Date().toISOString(),
  format: 'ANALYSIS',
  readingTimeMinutes: 6,
  imageKey: 'cover',
  tags: [{ subjectType: 'SERIES', subjectId: 9, seasonNumber: null, episodeNumber: null, franchiseId: null }],
};

await publishBlog({ outputName: 'from-kasabayi-kim-yazdi', meta, buildBlocks, images });
