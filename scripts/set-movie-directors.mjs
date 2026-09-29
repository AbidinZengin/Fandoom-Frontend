#!/usr/bin/env node
// Film yönetmenlerini backend'e yazar: yönetmen kişisi yoksa POST /people ile
// oluşturur, sonra filmin directorIds alanını PUT /movies/:id ile günceller.
// PUT sözleşmesi doğrulanmadığı için güvenlik önlemleri:
//   1) token yazmadan önce doğrulanır,
//   2) filmin önceki hâli scripts/output/movie-backups/ altına yedeklenir,
//   3) PUT'tan sonra film yeniden okunur; directorIds dışında herhangi bir alan
//      değiştiyse orijinal gövde HEMEN geri yazılır ve script hata verir.
// Yalnızca komut satırında verilen slug'lar işlenir.
//
// Kullanım (PowerShell):
//   $env:AUTH_TOKEN="..."; node scripts/set-movie-directors.mjs parasite
//   node scripts/set-movie-directors.mjs parasite --dry-run   (yazmaz)

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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

// Doğrulanabilir yönetmen bilgileri (ad, slug, doğum tarihi, kısa bio).
const DIRECTORS = {
  'christopher-nolan': { name: 'Christopher Nolan', birthDate: '1970-07-30', bio: 'British-American film director and screenwriter known for Memento, The Dark Knight trilogy, Inception, Interstellar and Oppenheimer.' },
  'darren-aronofsky': { name: 'Darren Aronofsky', birthDate: '1969-02-12', bio: 'American film director and screenwriter whose films include Pi, Requiem for a Dream, Black Swan and The Wrestler.' },
  'denis-villeneuve': { name: 'Denis Villeneuve', birthDate: '1967-10-03', bio: 'Canadian film director known for Prisoners, Sicario, Arrival, Blade Runner 2049 and the Dune films.' },
  'matt-reeves': { name: 'Matt Reeves', birthDate: '1966-04-27', bio: 'American film director and producer known for Cloverfield, Let Me In, the Planet of the Apes sequels and The Batman.' },
  'david-lynch': { name: 'David Lynch', birthDate: '1946-01-20', bio: 'American film director, painter and musician known for Eraserhead, Blue Velvet, Twin Peaks and Mulholland Drive.' },
  'bong-joon-ho': { name: 'Bong Joon-ho', birthDate: '1969-09-14', bio: 'South Korean film director and screenwriter known for Memories of Murder, The Host, Snowpiercer and Parasite, which won the Academy Award for Best Picture.' },
  'david-fincher': { name: 'David Fincher', birthDate: '1962-08-28', bio: 'American film director known for Se7en, Fight Club, Zodiac, The Social Network and Gone Girl.' },
  'tarsem-singh': { name: 'Tarsem Singh', birthDate: '1961-05-26', bio: 'Indian film director known for The Cell, The Fall, Immortals and Mirror Mirror.' },
  'justine-triet': { name: 'Justine Triet', birthDate: '1978-07-17', bio: 'French film director and screenwriter known for Sibyl and Anatomy of a Fall, which won the Palme d\'Or at Cannes.' },
};

// slug -> yönetmen slug'ı
const MOVIE_DIRECTOR = {
  interstellar: 'christopher-nolan',
  'black-swan': 'darren-aronofsky',
  'dune-part-two': 'denis-villeneuve',
  'the-batman': 'matt-reeves',
  'blade-runner-2049': 'denis-villeneuve',
  'mulholland-drive': 'david-lynch',
  parasite: 'bong-joon-ho',
  zodiac: 'david-fincher',
  'the-fall': 'tarsem-singh',
  'anatomy-of-a-fall': 'justine-triet',
  'requiem-for-a-dream': 'darren-aronofsky',
};

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const slugs = args.filter((a) => !a.startsWith('--'));

if (slugs.length === 0 || slugs.some((s) => !MOVIE_DIRECTOR[s])) {
  console.error(`Geçerli film slug'ı ver: ${Object.keys(MOVIE_DIRECTOR).join(', ')}`);
  process.exit(1);
}

if (!DRY_RUN) {
  if (!AUTH_TOKEN) {
    console.error('AUTH_TOKEN yok.');
    process.exit(1);
  }
  try {
    const { exp } = JSON.parse(Buffer.from(AUTH_TOKEN.split('.')[1], 'base64url').toString());
    if (exp && exp * 1000 < Date.now()) {
      console.error('AUTH_TOKEN süresi dolmuş, hiçbir şey yazılmadı.');
      process.exit(1);
    }
  } catch {
    console.error('AUTH_TOKEN geçerli bir JWT değil.');
    process.exit(1);
  }
  const probe = await fetch(`${BACKEND_BASE_URL}/me`, { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } });
  if (probe.status === 401) {
    console.error('Backend tokeni reddetti (401), hiçbir şey yazılmadı.');
    process.exit(1);
  }
}

const authHeaders = { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` };

async function send(method, path, body) {
  const res = await fetch(`${BACKEND_BASE_URL}${path}`, { method, headers: authHeaders, body: JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
  return data;
}

async function findPersonBySlug(slug) {
  const res = await fetch(`${BACKEND_BASE_URL}/people/slug/${slug}`);
  return res.ok ? res.json() : null;
}

// Yalnızca PUT gövdesine girmeyen, sunucunun ürettiği alanlar karşılaştırma dışı.
const VOLATILE = new Set(['updatedAt', 'externalRatingUpdatedAt']);
function diffFields(before, after) {
  return Object.keys({ ...before, ...after }).filter(
    (k) => !VOLATILE.has(k) && k !== 'directorIds' && JSON.stringify(before[k]) !== JSON.stringify(after[k]),
  );
}

for (const slug of slugs) {
  const directorSlug = MOVIE_DIRECTOR[slug];
  const director = DIRECTORS[directorSlug];
  console.log(`\n== ${slug} <- ${director.name}`);

  const movie = await fetch(`${BACKEND_BASE_URL}/movies/slug/${slug}`).then((r) => r.json());
  mkdirSync(resolve('scripts/output/movie-backups'), { recursive: true });
  writeFileSync(resolve(`scripts/output/movie-backups/${slug}.json`), JSON.stringify(movie, null, 2));

  let person = await findPersonBySlug(directorSlug);
  if (!person) {
    console.log(`  yönetmen kaydı yok, oluşturulacak: ${director.name}`);
    if (!DRY_RUN) {
      person = await send('POST', '/people', {
        name: director.name,
        slug: directorSlug,
        bio: director.bio,
        bioTr: null,
        photoUrl: null,
        birthDate: director.birthDate,
      });
      console.log(`  ✓ kişi oluşturuldu (id: ${person.id})`);
    }
  } else {
    console.log(`  yönetmen kaydı zaten var (id: ${person.id})`);
  }

  if (DRY_RUN) {
    console.log(`  dry-run: PUT /movies/${movie.id} gövdesi directorIds=[<${director.name} id>] olacak (YAZILMADI).`);
    continue;
  }

  const { id, createdAt, ...original } = movie;
  void createdAt;
  const body = { ...original, directorIds: [person.id] };
  await send('PUT', `/movies/${id}`, body);

  const after = await fetch(`${BACKEND_BASE_URL}/movies/slug/${slug}`).then((r) => r.json());
  const changed = diffFields(movie, after);
  if (JSON.stringify(after.directorIds) !== JSON.stringify([person.id]) || changed.length > 0) {
    console.error(`  ✗ Doğrulama başarısız. directorIds=${JSON.stringify(after.directorIds)}, değişen alanlar: ${changed.join(', ') || '(yok)'}`);
    console.error('  Orijinal gövde geri yazılıyor...');
    await send('PUT', `/movies/${id}`, original);
    console.error('  Geri yazıldı. Yedek: scripts/output/movie-backups/' + slug + '.json');
    process.exit(1);
  }
  console.log(`  ✓ ${slug} güncellendi, directorIds=${JSON.stringify(after.directorIds)}, diğer alanlar aynı.`);
}

console.log('\nBitti.');
