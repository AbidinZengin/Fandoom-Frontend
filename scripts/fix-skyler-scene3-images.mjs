#!/usr/bin/env node
// Skyler White blogunda (id 301) "Yükleme Hatası" bölümünün 2 IMAGE bloğu
// aynı sceneKey'i paylaşıyordu — BlogPost.data.js parseBlogBlocks bölüm
// başına TEK photo tutar (son IMAGE öncekini ezer), bu yüzden ilk görsel
// (Walt net/Skyler bulanık) hiç render olmuyordu. Fix: ikinci görseli ayrı
// bir sceneKey'e (scene-3b) taşıyıp metni de ikiye bölüyoruz, böylece her
// ikisi de kendi section'ında görünür ve yan yana/art arda akışı korunur.
// Diğer hiçbir alan/blok değişmiyor (REPLACE-ALL, tam gövde geri gönderiliyor).
//
// Kullanım: node scripts/fix-skyler-scene3-images.mjs --write

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

const PARA1 =
  `Sosyal psikolojide adı konmuş bir eğilim var: insanlar başkalarının davranışını açıklarken, o kişinin içinde bulunduğu koşulları değil, kişiliğini suçlama eğilimindeler. Yani biri bir şey yapmışsa, bunun sebebi "öyle bir durumdaydı" değil, "öyle biri" olmasıdır diye düşünülüyor. Breaking Bad bu eğilimi seyircide neredeyse mühendislik ürünü gibi tetikliyor, çünkü hikâye baştan sona Walter'ın gözünden anlatılıyor. Walter'ın işlediği her cinayet "başka çaresi yoktu" diye okunuyor, çünkü onun korkusunu, gururunu, kanserini içeriden biliyoruz. Skyler'ın soru sorması ise sadece huyu sayılıyor, çünkü onun neden endişelendiğini içeriden hiç görmüyoruz.`;

const PARA_REST = [
  `Ama bunun altında daha da temel bir hikâye anlatma tercihi yatıyor. Normalde bir hikâyede kötü adam, kahramanın yoluna çıkıp onu amacından saptırmaya çalışan taraftır; seyirci o engeli aşmasını ister. Breaking Bad bu kalıbı tersine çeviriyor: burada amacına ulaşmaya çalışan taraf, yasa dışı yoldan para kazanmaya çalışan Walter, ve onun önündeki engel de karısı Skyler. Yapı aynı kalıyor, sadece roller yer değiştiriyor — ve seyirci bu kalıba o kadar alışkın ki, kimin "kahraman" kimin "engel" olduğunu sorgulamadan Walter'ın tarafında yer alıyor. Walter'ın bir sonraki satışının, bir sonraki planının başarılı olmasını istiyoruz; sanki suçu onunla birlikte biz işliyormuşuz gibi bir ortaklık kuruyoruz. Skyler'ın araya girmesi de bu yüzden bir anne kaygısı değil, planı bozan bir tehdit gibi hissettiriyor bize — tıpkı bir soygun filminde işi bozmaya çalışan bir yan karakter gibi.`,
  `Bunun küçük ama çarpıcı bir örneği dizinin ilk sezonunda var. Walter kemoterapiyi reddedince Skyler bir aile toplantısı düzenleyip onu ikna etmeye çalışıyor. Ama beklenenin aksine kız kardeşi Marie ve eniştesi Hank, Skyler'ı değil Walter'ı destekliyor; Marie radyoloji teknisyeni olarak hastanede gördüğü kanser hastalarının çoğu zaman tedaviden fayda değil acı çektiğini söylüyor. Yani Skyler bu sahnede kendi ailesi tarafından bile yalnız bırakılıyor — üstelik sonunda haklı çıkacağı bir konuda. Bu da onu bir kontrol manyağı olmaktan çok, kimsenin dinlemediği ama sonunda doğru çıkan bir sesin sahibi yapıyor.`,
  `İlginç olan şu ki dizinin yaratıcısı Vince Gilligan bile yıllar sonra bunu kabul ediyor. 2018'de katıldığı bir söyleşide, hikâyenin Walter sahnede olmadığı zamanlarda bile yine onun bakış açısından yazıldığını, yazım sürecinin baştan itibaren Walter lehine kurulduğunu itiraf ediyor. Yani seyircinin Skyler'ı değil Walter'ı haklı bulması, kadının gerçekten yanılmasından değil, hikâyenin hangi karakterin gözünden anlatıldığından kaynaklanıyor.`,
].join('\n\n');

function buildFixedScene3(existingBlocks) {
  const walt = existingBlocks.find((b) => b.orderIndex === 8); // ys2pa7xpbiocvv7ueztc (Walt net)
  const skyler = existingBlocks.find((b) => b.orderIndex === 9); // hxuprof9ch2duois19cw (Skyler net)
  const heading = existingBlocks.find((b) => b.orderIndex === 7);

  return [
    { blockType: 'SECTION_HEADING', sceneKey: 'scene-3', content: heading.content, contentTr: heading.contentTr, imageUrl: null, imageAlt: null, imageAltTr: null },
    { blockType: 'IMAGE', sceneKey: 'scene-3', content: null, contentTr: null, imageUrl: walt.imageUrl, imageAlt: walt.imageAlt, imageAltTr: walt.imageAltTr },
    { blockType: 'SECTION_TEXT', sceneKey: 'scene-3', content: PARA1, contentTr: PARA1, imageUrl: null, imageAlt: null, imageAltTr: null },
    { blockType: 'IMAGE', sceneKey: 'scene-3b', content: null, contentTr: null, imageUrl: skyler.imageUrl, imageAlt: skyler.imageAlt, imageAltTr: skyler.imageAltTr },
    { blockType: 'SECTION_TEXT', sceneKey: 'scene-3b', content: PARA_REST, contentTr: PARA_REST, imageUrl: null, imageAlt: null, imageAltTr: null },
  ];
}

function buildPutBody(current) {
  const before = current.blocks.filter((b) => b.orderIndex < 7);
  const after = current.blocks.filter((b) => b.orderIndex > 10);
  const fixedScene3 = buildFixedScene3(current.blocks);

  const rebuilt = [...before, ...fixedScene3, ...after];

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
    blocks: rebuilt.map((b) => ({
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
  writeFileSync(resolve('scripts/output/skyler-blog-fix-body.json'), JSON.stringify(body, null, 2));
  console.log(`Yeni blok sayısı: ${body.blocks.length} (önceki: ${current.blocks.length})`);

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
  console.log(`\n✓ Düzeltildi. Toplam blok: ${data.blocks.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
