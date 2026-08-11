#!/usr/bin/env node
// Kullanım: npm run capture -- <route> [ad.png] [genişlik] [kare]
// Örnek:   npm run capture -- /series/game-of-thrones got.png 1440
//          npm run capture -- /series/game-of-thrones got.png 390 8
// Çıktı:   .claude/scratchpad/screens/<ad>.png (tam yol stdout'a yazılır)
//
// [kare] verilmezse tek fullPage görüntü alınır (varsayılan). Bir sayı
// verilirse VIEWPORT modu çalışır: sayfa eşit aralıklarla gezilir ve her
// durakta viewport boyunda ayrı bir kare yazılır (<ad>-01.png, -02.png...).
// Pinned/scroll-scrub bölümler için fullPage işe yaramaz — 100vh'lik bir
// sahne on binlerce piksellik tek görüntüye dönüşüp okunamaz hâle gelir.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const [route = '/', outArg, widthArg, framesArg] = process.argv.slice(2);
const width = Number(widthArg) || 1440;
const frames = Number(framesArg) || 0;
const base = process.env.CAPTURE_BASE_URL || 'http://localhost:5173';

// Dev sunucusu kontrolü — kapalıysa açık hata ver
try {
  await fetch(base);
} catch {
  console.error(
    `Dev sunucusuna ulaşılamadı: ${base}\n` +
      'Önce `npm run dev` başlatın (veya CAPTURE_BASE_URL ayarlayın).'
  );
  process.exit(1);
}

const slug =
  route === '/' ? 'home' : route.replace(/^\/+|\/+$/g, '').replace(/[/:]+/g, '-');
const fileName = (outArg || `${slug}.png`).endsWith('.png')
  ? outArg || `${slug}.png`
  : `${outArg}.png`;

const outDir = resolve('.claude/scratchpad/screens');
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, fileName);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 900 } });
await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' });
await page.waitForTimeout(800); // font yüklenmesi + giriş animasyonları

// ScrollTrigger'lı animasyonları tetiklemek için sayfayı kademeli gez
await page.evaluate(async () => {
  const step = Math.max(200, Math.floor(window.innerHeight / 2));
  const max = document.documentElement.scrollHeight;
  for (let y = 0; y <= max; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 80));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(600);

if (frames > 0) {
  const maxScroll = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight
  );
  const written = [];

  for (let i = 0; i < frames; i += 1) {
    const y = frames === 1 ? 0 : Math.round((maxScroll * i) / (frames - 1));
    await page.evaluate((value) => window.scrollTo(0, value), y);
    // Scrub'lı ScrollTrigger'ların hedef değere oturması için bekle.
    await page.waitForTimeout(500);

    const framePath = resolve(
      outDir,
      fileName.replace(/\.png$/, `-${String(i + 1).padStart(2, '0')}.png`)
    );
    await page.screenshot({ path: framePath });
    written.push(framePath);
  }

  await browser.close();
  console.log(written.join('\n'));
} else {
  await page.screenshot({ path: outPath, fullPage: true });
  await browser.close();
  console.log(outPath);
}
