#!/usr/bin/env node
// Local-only tasarım editörü yazma sunucusu — backend/DB'yi devre dışı
// bırakan mimari pivotun parçası (bkz. plan: local dosya + Vite HMR).
// Altı iş: (1) SeriesHeroEditor/PageBuilder'ın "Save"iyle bir *.blocks.json
// taslağını atomic write ile güncellemek, (2) PageBuilder'ın "Yayınla"
// butonuyla o taslağı ADI-KONULMUŞ bir build olarak yanındaki *.builds.json
// geçmişine eklemek (POST /builds, üzerine yazmaz — GET /builds listeler),
// (3) PageBuilder'ın "Kodu Üret" akışı için var olan sayfaları listelemek
// (GET /pages), (4) referans ekran görüntüsü çekmek (POST /capture —
// capture-page.mjs'i child process çalıştırır), (5) üretilen component'i
// src/pages/ altına yazmak (POST /generate — YENİ klasör, var olan hiçbir
// dosyanın üzerine yazmaz), (6) her başarılı /generate çağrısının KAYNAK
// blok ağacını yanındaki *.generated.json'a eklemek (GET /generated listeler)
// — üretilen kodu değil, onu üreten ham veriyi saklar, "şablon"
// yeniden-açma amaçlı.
// Vite'ın dev sunucusu *.blocks.json değişikliğini HMR ile anında
// tarayıcıya yansıtır — ayrı bir backend/DB/auth katmanı YOK.
//
// GÜVENLİK: sadece 127.0.0.1'e bağlanır (asla 0.0.0.0 değil). /blocks
// sadece `src/**/*.blocks.json` yoluna yazar/okur; /generate sadece
// `src/pages/<var-olan-yol>/<YeniAd>/` gibi YENİ bir klasöre yazar (path
// traversal engellenir, var olan klasörün üzerine ASLA yazmaz — 409 döner).
// Bu script ASLA production'a/deploy edilen hiçbir yere dahil edilmemeli —
// ana Vite bundle'ına import edilmez, sadece `npm run design-server` ile
// ayrıca çalıştırılır.
//
// Kullanım: node scripts/design-server.mjs  (veya npm run design-server)

import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { DEFAULT_LANG } from '../src/shared/i18n/constants.js';

const execFileAsync = promisify(execFile);

const PORT = 5175;
const HOST = '127.0.0.1';
const REPO_ROOT = resolve(import.meta.dirname, '..');
const SRC_ROOT = resolve(REPO_ROOT, 'src') + sep;
const PAGES_ROOT = resolve(REPO_ROOT, 'src/pages') + sep;
const CAPTURE_SCRIPT = resolve(REPO_ROOT, '.claude/skills/visual-verify/scripts/capture-page.mjs');

// Aynı dosyaya art arda gelen yazma istekleri (ör. hızlı ardışık Save)
// çakışmasın diye dosya yoluna göre serileştirilir — bir önceki yazma
// bitmeden bir sonraki başlamaz.
const writeQueues = new Map();
function queueWrite(path, task) {
  const prev = writeQueues.get(path) ?? Promise.resolve();
  const next = prev.then(task, task);
  writeQueues.set(
    path,
    next.finally(() => {
      if (writeQueues.get(path) === next) writeQueues.delete(path);
    })
  );
  return next;
}

// `path` query param'ını gerçek dosya yoluna çevirir; src/ dışına veya
// .blocks.json dışındaki dosyalara erişim REDDEDİLİR (path traversal /
// yanlışlıkla başka bir dosyayı ezme koruması).
function resolveBlocksPath(relPath) {
  if (!relPath || typeof relPath !== 'string') return null;
  if (!relPath.endsWith('.blocks.json')) return null;
  const abs = resolve(REPO_ROOT, relPath);
  if (!abs.startsWith(SRC_ROOT)) return null;
  return abs;
}

// "Yayınla" ile oluşan build geçmişi taslakla AYNI dosyada DEĞİL, yanındaki
// bir `.builds.json`'da tutulur (ör. demo.blocks.json → demo.builds.json)
// — mevcut /blocks GET/POST sözleşmesi (düz blok dizisi) hiç değişmez, bu
// yüzden bu adaptörü paylaşan diğer editörler (SeriesHeroEditor) etkilenmez.
function resolveBuildsPath(relPath) {
  const blocksPath = resolveBlocksPath(relPath);
  return blocksPath ? blocksPath.replace(/\.blocks\.json$/, '.builds.json') : null;
}

function resolveGeneratedLogPath(relPath) {
  const blocksPath = resolveBlocksPath(relPath);
  return blocksPath ? blocksPath.replace(/\.blocks\.json$/, '.generated.json') : null;
}

// Sınırsız büyümesin diye tavan — writebackHistoryStore.js'teki
// MAX_ENTRIES deseniyle aynı gerekçe: her build tüm blok ağacını taşıdığı
// için (writeback'in aksine tek alan değil), tavan ORADAKİNDEN düşük.
const MAX_BUILDS = 20;

// "Kodu Üret" ile başarılı üretilen her component'in KAYNAK blok ağacını
// tutan geçmiş — üretilen .jsx/.css DEĞİL (o tek yönlü, bkz. handleGenerate
// yorumu), tuvale GERİ YÜKLENEBİLECEK ham veri. Amaç: bir component'i
// "şablon" gibi yeniden açıp sadece bağlı entity'yi/metni değiştirip tekrar
// üretebilmek. builds.json'la AYNI tavan/kalıp.
const MAX_GENERATED = 20;

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : null;
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    // Vite dev sunucusu farklı bir port'ta (5173/5174) çalışıyor —
    // tarayıcıdan bu sunucuya cross-origin istek için CORS gerekli.
    // Sadece localhost origin'lerine izin verilir.
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body != null ? JSON.stringify(body) : undefined);
}

async function handleBlocks(req, res, url) {
  const blocksPath = resolveBlocksPath(url.searchParams.get('path'));
  if (!blocksPath) {
    sendJson(res, 400, { message: 'Geçersiz veya eksik path (src/**/*.blocks.json olmalı)' });
    return;
  }

  if (req.method === 'GET') {
    try {
      if (!existsSync(blocksPath)) {
        sendJson(res, 200, []);
        return;
      }
      const raw = await readFile(blocksPath, 'utf8');
      sendJson(res, 200, JSON.parse(raw));
    } catch (err) {
      sendJson(res, 500, { message: err.message });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      if (!Array.isArray(body)) {
        sendJson(res, 400, { message: 'Body bir blok dizisi olmalı' });
        return;
      }
      await queueWrite(blocksPath, async () => {
        await mkdir(dirname(blocksPath), { recursive: true });
        const tmpPath = `${blocksPath}.tmp`;
        await writeFile(tmpPath, JSON.stringify(body, null, 2), 'utf8');
        await rename(tmpPath, blocksPath); // atomic — Vite HMR yarım yazılmış dosya görmez
      });
      // eslint-disable-next-line no-console
      console.log(`[design-server] saved ${body.length} block(s) → ${blocksPath}`);
      sendJson(res, 200, body);
    } catch (err) {
      sendJson(res, 500, { message: err.message });
    }
    return;
  }

  sendJson(res, 405, { message: 'Method not allowed' });
}

// PageBuilder'ın "Yayınla" butonu — mevcut taslağı (body, /blocks POST ile
// AYNI blok dizisi formatı) yeni bir build olarak `.builds.json`'a EKLER
// (üzerine yazmaz). En yeni build başta; GET tüm listeyi döner (PageBuilder
// mount'ta bunu okuyup "Geçmiş" panelinde listeler).
async function handleBuilds(req, res, url) {
  const buildsPath = resolveBuildsPath(url.searchParams.get('path'));
  if (!buildsPath) {
    sendJson(res, 400, { message: 'Geçersiz veya eksik path (src/**/*.blocks.json olmalı)' });
    return;
  }

  if (req.method === 'GET') {
    try {
      if (!existsSync(buildsPath)) {
        sendJson(res, 200, []);
        return;
      }
      const raw = await readFile(buildsPath, 'utf8');
      sendJson(res, 200, JSON.parse(raw));
    } catch (err) {
      sendJson(res, 500, { message: err.message });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      if (!Array.isArray(body)) {
        sendJson(res, 400, { message: 'Body bir blok dizisi olmalı' });
        return;
      }
      const entry = { id: randomUUID(), publishedAt: new Date().toISOString(), blocks: body };
      const updated = await queueWrite(buildsPath, async () => {
        let existing = [];
        if (existsSync(buildsPath)) {
          try {
            existing = JSON.parse(await readFile(buildsPath, 'utf8'));
          } catch {
            existing = [];
          }
        }
        const next = [entry, ...existing].slice(0, MAX_BUILDS);
        await mkdir(dirname(buildsPath), { recursive: true });
        const tmpPath = `${buildsPath}.tmp`;
        await writeFile(tmpPath, JSON.stringify(next, null, 2), 'utf8');
        await rename(tmpPath, buildsPath);
        return next;
      });
      // eslint-disable-next-line no-console
      console.log(`[design-server] published build ${entry.id} → ${buildsPath}`);
      sendJson(res, 200, updated);
    } catch (err) {
      sendJson(res, 500, { message: err.message });
    }
    return;
  }

  sendJson(res, 405, { message: 'Method not allowed' });
}

// src/App.jsx'i regex ile TARAR (AST parse etmeden) — GERÇEK sayfaları
// (react-router route'ları) walkPages'in döndürdüğü "herhangi bir .jsx
// içeren klasör" listesinden AYIRT ETMEK için (kullanıcı raporu: "hedef
// sayfada neden componentler var" — Foo/Foo.jsx konvansiyonu yüzünden
// walkPages sayfa İÇİNDEKİ nested component klasörlerini de dönüyordu).
// İki geçiş: (1) `import X from './pages/...'` satırlarından
// component adı → klasör haritası, (2) her `<Route path="..." ...>` bloğunu
// (RequireAuth sarmalayıcısı dahil) tarayıp path + en dıştaki JSX
// component adını çıkarır, haritadan klasörü bulur. Haritada karşılığı
// olmayan route'lar (ör. App.jsx içinde YEREL tanımlı BlogPostRoute)
// SESSİZCE atlanır — bu bir en iyi-çaba taraması, tam bir JSX parser değil.
async function parseRoutesFromApp() {
  const appPath = resolve(REPO_ROOT, 'src/App.jsx');
  if (!existsSync(appPath)) return [];
  const content = await readFile(appPath, 'utf8');

  const importMap = new Map();
  for (const m of content.matchAll(/import\s+(\w+)\s+from\s+'\.\/pages\/([^']+)';/g)) {
    importMap.set(m[1], dirname(m[2]).replace(/\\/g, '/'));
  }

  const routes = [];
  const seenFolders = new Set();
  // DÜZELTME (kullanıcı raporu: "route '/' ile başlayan bir string olmalı"
  // hatası "sürekli" alınıyordu): App.jsx'teki GERÇEK içerik sayfalarının
  // NEREDEYSE TAMAMI `<Route path="/:lang" element={<LangGate />}>`
  // sarmalayıcısının İÇİNDE, ona göre RELATIVE path yazılıyor (ör.
  // "series/breaking-bad", "/" İLE BAŞLAMIYOR — bkz. App.jsx'teki "path'ler
  // /:lang'e göre relative" yorumu). Bu tarayıcı önceden bunu düz metin
  // olarak aynen kopyalıyordu; /capture endpoint'i "/" ile başlamayan HİÇBİR
  // route'u kabul etmediği (satır ~279) için Referans Al pratikte TÜM
  // içerik sayfalarında başarısız oluyordu — kullanıcı hatası değil, bu
  // sarmalayıcı hesaba katılmamış bir parser bug'ıydı.
  const langWrapperIdx = content.indexOf('path="/:lang"');
  // İlk parça `<Route`'dan ÖNCEki içerik (import'lar vb.) — atlanır.
  for (const m of content.matchAll(/<Route\b/g)) {
    const seg = content.slice(m.index + m[0].length);
    const nextRouteIdx = seg.indexOf('<Route');
    const endRoutesIdx = seg.indexOf('</Routes>');
    const cutAt = [nextRouteIdx, endRoutesIdx].filter((i) => i !== -1).sort((a, b) => a - b)[0] ?? seg.length;
    const chunk = seg.slice(0, cutAt);
    const pathMatch = chunk.match(/path="([^"]+)"/);
    if (!pathMatch) continue;
    // RequireAuth gibi bilinen sarmalayıcılar HARİÇ, bloktaki İLK büyük-harfli
    // JSX tag'i gerçek sayfa component'idir (bkz. App.jsx yorumu).
    const tag = [...chunk.matchAll(/<([A-Z]\w*)/g)].map((t) => t[1]).find((t) => t !== 'RequireAuth');
    const folder = tag && importMap.get(tag);
    if (!folder || seenFolders.has(folder)) continue;
    seenFolders.add(folder);
    let route = pathMatch[1];
    // /:lang sarmalayıcısının İÇİNDE ve "/" ile başlamıyorsa, tarayıcının
    // gerçekten gidebileceği mutlak bir path'e çevrilir (varsayılan dil).
    // Üst seviyede zaten mutlak olan route'lara (ör. /admin/*) dokunulmaz.
    if (!route.startsWith('/') && langWrapperIdx !== -1 && m.index > langWrapperIdx) {
      route = `/${DEFAULT_LANG}/${route}`;
    }
    routes.push({ folder, route });
  }
  return routes.sort((a, b) => a.route.localeCompare(b.route));
}

async function handlePages(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { message: 'Method not allowed' });
    return;
  }
  try {
    const routes = await parseRoutesFromApp();
    sendJson(res, 200, routes);
  } catch (err) {
    sendJson(res, 500, { message: err.message });
  }
}

// Var olan capture-page.mjs'i (Playwright) child process olarak çalıştırır
// — mantık BURADA TEKRAR YAZILMAZ, script aynen kullanılır. Script çıktı
// dosyasının MUTLAK yolunu stdout'a yazıyor (bkz. capture-page.mjs son
// satırı), onu okuyup PNG'yi base64 olarak döneriz (ayrı bir statik dosya
// sunucusu kurmaya gerek kalmasın diye).
async function handleCapture(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { message: 'Method not allowed' });
    return;
  }
  try {
    const body = await readJsonBody(req);
    const route = body?.route;
    if (!route || typeof route !== 'string' || !route.startsWith('/')) {
      sendJson(res, 400, { message: 'route "/" ile başlayan bir string olmalı' });
      return;
    }
    const width = Number(body?.width) || 1440;
    const fileName = `pagebuilder-ref-${Date.now()}`;
    const { stdout, stderr } = await execFileAsync('node', [CAPTURE_SCRIPT, route, fileName, String(width)], {
      cwd: REPO_ROOT,
      timeout: 45000,
    });
    const outPath = stdout.trim().split('\n').filter(Boolean).pop();
    if (!outPath || !existsSync(outPath)) {
      sendJson(res, 500, { message: stderr || 'Ekran görüntüsü alınamadı' });
      return;
    }
    const buf = await readFile(outPath);
    sendJson(res, 200, { image: `data:image/png;base64,${buf.toString('base64')}` });
  } catch (err) {
    sendJson(res, 500, { message: err.message });
  }
}

// PageBuilder'ın ürettiği JSX+CSS'i src/pages/<targetDir>/<name>/ altına
// yazar. targetDir var olan bir sayfanın yolu (ör. "series/GameOfThrones/
// Intro") — component O SAYFANIN ALTINA nested olur, targetDir'in KENDİSİ
// asla değiştirilmez. Hedef klasör ZATEN VARSA 409 — var olan hiçbir
// dosyanın üzerine YAZILMAZ.
//
// İsteğe bağlı `path`+`blocks`: gönderilirse, dosya yazımından SONRA aynı
// isteğin bir parçası olarak KAYNAK blok ağacı `.generated.json` log'una
// eklenir (bkz. resolveGeneratedLogPath) — "Kodu Üret"ün ürettiği .jsx/.css
// hiç parse EDİLMEZ (tek yönlü kural korunur), sadece onu üreten HAM veri
// saklanır ki kullanıcı bir component'i "şablon" gibi tuvale geri açıp
// entity/metin değiştirip tekrar üretebilsin. Log yazımı BEST-EFFORT —
// başarısız olsa bile component dosyaları zaten yazıldığı için 201 döner,
// sadece konsola uyarı düşer.
async function handleGenerate(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { message: 'Method not allowed' });
    return;
  }
  try {
    const body = await readJsonBody(req);
    const { targetDir, name, jsx, css, path, blocks } = body ?? {};
    if (!targetDir || typeof targetDir !== 'string' || !name || !/^[A-Z][A-Za-z0-9]*$/.test(name)) {
      sendJson(res, 400, { message: 'targetDir ve PascalCase bir name zorunlu' });
      return;
    }
    if (typeof jsx !== 'string' || typeof css !== 'string') {
      sendJson(res, 400, { message: 'jsx ve css string olmalı' });
      return;
    }
    const componentDir = resolve(PAGES_ROOT, targetDir, name);
    if (!componentDir.startsWith(PAGES_ROOT)) {
      sendJson(res, 400, { message: 'Geçersiz hedef yol' });
      return;
    }
    if (existsSync(componentDir)) {
      sendJson(res, 409, { message: `${targetDir}/${name} zaten var — farklı bir isim dene, üzerine yazılmaz` });
      return;
    }
    await mkdir(componentDir, { recursive: true });
    await writeFile(resolve(componentDir, `${name}.jsx`), jsx, 'utf8');
    await writeFile(resolve(componentDir, `${name}.module.css`), css, 'utf8');
    const relOut = relative(REPO_ROOT, componentDir).replace(/\\/g, '/');
    // eslint-disable-next-line no-console
    console.log(`[design-server] generated component → ${relOut}`);

    const generatedLogPath = resolveGeneratedLogPath(path);
    if (generatedLogPath && Array.isArray(blocks)) {
      try {
        const entry = { id: randomUUID(), generatedAt: new Date().toISOString(), targetDir, name, path: relOut, blocks };
        await queueWrite(generatedLogPath, async () => {
          let existing = [];
          if (existsSync(generatedLogPath)) {
            try {
              existing = JSON.parse(await readFile(generatedLogPath, 'utf8'));
            } catch {
              existing = [];
            }
          }
          const next = [entry, ...existing].slice(0, MAX_GENERATED);
          await mkdir(dirname(generatedLogPath), { recursive: true });
          const tmpPath = `${generatedLogPath}.tmp`;
          await writeFile(tmpPath, JSON.stringify(next, null, 2), 'utf8');
          await rename(tmpPath, generatedLogPath);
        });
      } catch (logErr) {
        // eslint-disable-next-line no-console
        console.warn(`[design-server] generated log yazılamadı (component yine de oluşturuldu): ${logErr.message}`);
      }
    }

    sendJson(res, 201, { path: relOut });
  } catch (err) {
    sendJson(res, 500, { message: err.message });
  }
}

// CodegenPanel'in geçmişteki başarılı "Kodu Üret" çağrılarını listelemesi
// için — handleBuilds'in GET yarısıyla aynı kalıp.
async function handleGeneratedLog(req, res, url) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { message: 'Method not allowed' });
    return;
  }
  const generatedLogPath = resolveGeneratedLogPath(url.searchParams.get('path'));
  if (!generatedLogPath) {
    sendJson(res, 400, { message: 'Geçersiz veya eksik path (src/**/*.blocks.json olmalı)' });
    return;
  }
  try {
    if (!existsSync(generatedLogPath)) {
      sendJson(res, 200, []);
      return;
    }
    const raw = await readFile(generatedLogPath, 'utf8');
    sendJson(res, 200, JSON.parse(raw));
  } catch (err) {
    sendJson(res, 500, { message: err.message });
  }
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, null);
    return;
  }

  const url = new URL(req.url, `http://${HOST}:${PORT}`);

  if (url.pathname === '/blocks') return handleBlocks(req, res, url);
  if (url.pathname === '/builds') return handleBuilds(req, res, url);
  if (url.pathname === '/pages') return handlePages(req, res);
  if (url.pathname === '/capture') return handleCapture(req, res);
  if (url.pathname === '/generate') return handleGenerate(req, res);
  if (url.pathname === '/generated') return handleGeneratedLog(req, res, url);

  sendJson(res, 404, { message: 'Not found' });
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`[design-server] listening on http://${HOST}:${PORT} (local only)`);
});
