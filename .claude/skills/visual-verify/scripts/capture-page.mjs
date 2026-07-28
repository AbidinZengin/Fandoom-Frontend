#!/usr/bin/env node
// Kullanım: npm run capture -- <route> [ad.png] [genişlik]
// Örnek:   npm run capture -- /series/game-of-thrones got.png 1440
// Çıktı:   .claude/scratchpad/screens/<ad>.png (tam yol stdout'a yazılır)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const [route = '/', outArg, widthArg] = process.argv.slice(2);
const width = Number(widthArg) || 1440;
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

await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
console.log(outPath);
