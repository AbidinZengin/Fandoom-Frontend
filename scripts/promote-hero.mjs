#!/usr/bin/env node
// PageBuilder "Kodu Üret" her seferinde yeni bir FooN klasörü (component
// adı + CSS import o N'e göre) üretir, admin bunu elle var olan Foo'nun
// yerine taşıyordu (bkz. Hero1/Hero2 geçişleri). Kullanıcı kararı
// (2026-09-02): "sadece tasarım yapacağım, canlıya çıkma derdim yok,
// çakışma olmaz" — bu yüzden burada ESKİ component'teki elle yapılan
// düzeltmeler (GSAP, genre-fix, vb.) KORUNMAZ, HER SEFERİNDE ham codegen
// çıktısı hedefin üstüne YAZILIR (geri dönüş git history'de durur).
import { readFileSync, writeFileSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const [, , sourceDir, targetDir] = process.argv;
if (!sourceDir || !targetDir) {
  console.error('Kullanım: node scripts/promote-hero.mjs <kaynak-klasör> <hedef-klasör>');
  console.error('Örnek:   node scripts/promote-hero.mjs src/pages/series/Severance/Hero2 src/pages/series/Severance/Hero');
  process.exit(1);
}

const sourceName = basename(sourceDir); // ör. "Hero2"
const targetName = basename(targetDir); // ör. "Hero"

const sourceJsxPath = join(sourceDir, `${sourceName}.jsx`);
const sourceCssPath = join(sourceDir, `${sourceName}.module.css`);
if (!existsSync(sourceJsxPath)) {
  console.error(`Kaynak bulunamadı: ${sourceJsxPath}`);
  process.exit(1);
}

let jsx = readFileSync(sourceJsxPath, 'utf8');
// Component adı ve CSS import'u kaynak isimden hedef isme çevrilir —
// PageBuilder codegen çıktısında bu ikisi DIŞINDA kaynak adı geçmez.
jsx = jsx
  .replaceAll(`function ${sourceName}(`, `function ${targetName}(`)
  .replaceAll(`from './${sourceName}.module.css'`, `from './${targetName}.module.css'`);

const css = existsSync(sourceCssPath) ? readFileSync(sourceCssPath, 'utf8') : '';

mkdirSync(targetDir, { recursive: true });
writeFileSync(join(targetDir, `${targetName}.jsx`), jsx);
if (css) writeFileSync(join(targetDir, `${targetName}.module.css`), css);

rmSync(sourceDir, { recursive: true, force: true });

console.log(`${sourceName} -> ${targetName} taşındı (${targetDir}), kaynak klasör silindi.`);
