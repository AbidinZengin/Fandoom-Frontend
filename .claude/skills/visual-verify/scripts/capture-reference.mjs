#!/usr/bin/env node
// Kullanım: npm run capture-ref -- <url> <ad.png> [genişlik]
// Örnek:   npm run capture-ref -- https://www.hbo.com/house-of-the-dragon hotd-ref.png
// Çıktı:   .claude/scratchpad/refs/<ad>.png (tam yol stdout'a yazılır)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const [url, outArg, widthArg] = process.argv.slice(2);
if (!url) {
  console.error('Kullanım: npm run capture-ref -- <url> <ad>.png [genişlik]');
  process.exit(1);
}
const width = Number(widthArg) || 1440;

const fallbackName = `${new URL(url).hostname.replace(/^www\./, '')}.png`;
const fileName = (outArg || fallbackName).endsWith('.png')
  ? outArg || fallbackName
  : `${outArg}.png`;

const outDir = resolve('.claude/scratchpad/refs');
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, fileName);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 900 } });
try {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
} catch {
  // Ağır siteler networkidle'a hiç düşmeyebilir — load ile devam et
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
}
await page.waitForTimeout(1500); // font + lazy asset'ler

// Lazy-load içerikleri tetiklemek için sayfayı kademeli gez
await page.evaluate(async () => {
  const step = Math.max(200, Math.floor(window.innerHeight / 2));
  const max = document.documentElement.scrollHeight;
  for (let y = 0; y <= max; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 120));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(800);

await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
console.log(outPath);
