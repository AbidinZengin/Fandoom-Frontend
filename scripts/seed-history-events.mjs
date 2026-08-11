#!/usr/bin/env node
// GoT History sayfasının 9 dönemini (History.source.en.md) gerçek backend'e
// yazan tek seferlik seed aracı. Her dönem için: yerel görseli Cloudinary'e
// yükler, sonra POST /api/series/:id/lore/events ile Event kaydı oluşturur.
// AUTH_TOKEN verilmezse backend'e YAZMAZ — sadece dry-run raporu üretir.
//
// Kullanım (PowerShell, .env.local + tek seferlik AUTH_TOKEN override):
//   $env:AUTH_TOKEN="..."; node scripts/seed-history-events.mjs --era dawn-age
// Tüm dönemler:
//   $env:AUTH_TOKEN="..."; node scripts/seed-history-events.mjs

import { createHash } from 'node:crypto';
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

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'b0bc5njd';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'fandoom/history';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const SERIES_SLUG = process.env.SERIES_SLUG || 'game-of-thrones';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;

const eraArgIdx = process.argv.indexOf('--era');
const eraFilter = eraArgIdx !== -1 ? process.argv[eraArgIdx + 1] : null;

const missing = [];
if (!CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
if (!CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
if (missing.length > 0) {
  console.error(`Eksik ortam değişkeni: ${missing.join(', ')}`);
  process.exit(1);
}
if (!AUTH_TOKEN) {
  console.warn('AUTH_TOKEN yok — sadece dry-run: Cloudinary\'e yüklenir ama backend\'e YAZILMAZ.');
}

const IMG_DIR = 'd:/İndirilenler/';

const ERAS = [
  {
    slug: 'dawn-age',
    name: 'The First Men and the Pact',
    orderIndex: -12000,
    pinned: false,
    date: 'ca. 12,000 BC – ca. 10,000 BC',
    quote: 'The Pact records less a peace than the simple fact that neither people could finish the other.',
    locations: ['Battle Isle', 'Broken Arm', 'Stepstones'],
    imagePath: `${IMG_DIR}aWqXWXE.jpeg`,
    description: [
      "No hard record survives of Westeros's history before men; everything known rests on legend, set down in writing only thousands of years later by septons. By tradition, the continent was home before men to the children of the forest and to giants.",
      'Around 12,000 BC, the First Men crossed the Arm of Dorne from Essos and set foot on Westeros — armed with bronze, and superior to the children in both numbers and craft. The children tried to sever the land bridge using the Hammer of the Waters; the attempt failed to stop the invasion, and only left behind the Broken Arm and the Stepstones. Despite fierce resistance, the First Men spread across the continent and carved it into hundreds of petty kingdoms.',
      "After roughly two thousand years of conflict, the two peoples signed the Pact at the Isle of Faces around 10,000 BC: the open lands went to the First Men, the deep woods to the children. Over time the First Men adopted worship of the old gods — the Pact's most lasting legacy was not the war, but this shared faith.",
    ].join('\n\n'),
  },
  {
    slug: 'age-of-heroes',
    name: 'The Long Night and the Wall',
    orderIndex: -10000,
    pinned: false,
    date: 'ca. 10,000 BC – ca. 8,000/6,000 BC',
    quote: 'The stones of the Wall record not a victory, but a border no one dared trust again.',
    locations: ['Winterfell', "Storm's End", 'Wall'],
    imagePath: `${IMG_DIR}old-powers-waken-shadows-stir-an-age-of-wonder-and-terror-v0-i251bbevicw01.webp`,
    description: [
      "The peace that followed the Pact came to be remembered as the age of great figures — many of today's noble houses trace their founding to this era: Brandon the Builder, who raised House Stark in the North; Lann the Clever, who is said to have won Casterly Rock from House Casterly; Garth Greenhand, founder of House Gardener in the Reach. In the Stormlands, House Durrandon rose with Durran Godsgrief, said to have built Storm's End, while the Grey King ruled the Iron Islands.",
      'The age ends with the Long Night, placed by tradition somewhere between 8,000 and 6,000 BC: a generation-long winter, an invasion of the White Walkers from the far north, and the near-annihilation of humanity. The children of the forest and the First Men united, armed with dragonglass, to drive the enemy back at the Battle for the Dawn — legend credits the victory to the Last Hero, and to Azor Ahai, said to have carried the flaming sword Lightbringer, though maesters dispute whether either figure ever truly existed.',
      "In the aftermath, Brandon the Builder is said to have raised the Wall with the giants' help, and the Night's Watch became its sworn guardians; the same Brandon is credited with building Winterfell and becoming the first King in the North, founding House Stark. The legend of the Night's King — a thirteenth Lord Commander said to have ruled Nightfort through sorcery for thirteen years before being overthrown by King Brandon Stark and the wildling king Joramun — is regarded by most maesters as little more than myth.",
    ].join('\n\n'),
  },
  {
    slug: 'coming-of-the-andals',
    name: 'Steel and the Faith of the Seven',
    orderIndex: -4000,
    pinned: false,
    date: 'ca. 6,000/4,000/2,000 BC (disputed)',
    quote: 'The Andal conquest stops at the North, but the North itself is never quite the same again.',
    locations: ['Fingers', 'Moat Cailin', 'Iron Islands'],
    imagePath: `${IMG_DIR}From Klickpin.com- Chic tailoring ideas for inspiration you can revisit anytime with easy charm that keep sewing-pin-id-597641813069003093.jpg`,
    description: [
      'The Faith of the Seven, born in the Andal hills of Essos, drove the Andals to invade Westeros on the promise of seven gods said to have appeared to Hugor of the Hill. The Andals crossed the narrow sea and landed at the Fingers in the Vale — a people marked with a seven-pointed star carved into their chests and armed with steel; sources disagree sharply on how long ago they arrived, with estimates ranging from six thousand to as few as two thousand years.',
      "Over centuries of war, the First Men's six southern kingdoms fell one by one, and most of their great houses were wiped out; only the North held, thanks to the defensible chokepoint at Moat Cailin. The children of the forest withdrew further still, retreating into the deep woods and the lands beyond the Wall.",
      'The Iron Islands fell to the Andals a full thousand years after the invasion began — the line of Iron Island kings descending from Urron Greyiron ends here. Unlike elsewhere, though, the Andals who settled the isles brought no new faith with them; instead they were absorbed into the local worship of the Drowned God.',
    ].join('\n\n'),
  },
  {
    slug: 'age-of-valyria',
    name: 'The Valyrian Freehold',
    // NOT: kaynak taslakta (History.source.en.md) bu döneme atanan sortValue
    // -4700'dü — ama Coming of the Andals'ın -4000'i buna göre DAHA BÜYÜK
    // olduğu için ascending sort iki dönemi ters sıraya sokuyordu (Valyria
    // Andals'tan önce görünüyordu). -3900: Andals(-4000) ile Seven
    // Kingdoms(-3000) arasında, kaynağın kendi kronolojik çakışmasını
    // (Andal istilası ile Valyria Freehold'u aynı yüzyıllarda geçiyor)
    // doğru okuma sırasına (taslaktaki 3. sonra 4. dönem) zorlar.
    orderIndex: -3900,
    pinned: false,
    date: 'ca. 4,700 BC – 102 BC',
    quote: 'The one certainty left after the Doom is that no source has ever told it whole.',
    locations: ['Valyria', 'Fourteen Flames', 'Dragonstone', "Slaver's Bay"],
    imagePath: `${IMG_DIR}From Klickpin.com- Luxury boho home decor ideas that look expensive while staying practical realistic and beginner friendly for anyone who loves b.png`,
    description: [
      'The Valyrian Freehold traces its origins to a people of sheepherders living near the Fourteen Flames in southern Essos, who tamed the dragons that nested there. Through the use of blood magic to control the dragons, the Valyrians rose swiftly to dominate the region; the towers of their capital, Valyria, and the Valyrian steel forged there stood as the enduring record of the empire\'s wealth.',
      "Valyria's greatest rival was Old Ghis, the oldest empire of the eastern continent. The two powers fought five separate wars; in the last of them, around 4,700 BC, Valyria burned the Ghiscari capital with dragonfire rather than risk a sixth war, salting and sowing the ground with sulfur to render it forever barren. After this victory, Valyria extended its reach over the cities of Slaver's Bay as well.",
      "House Targaryen left Valyria in 114 BC — after Lord Aenar Targaryen's daughter Daenys dreamed of the Freehold's doom — and settled on Dragonstone, an island off the coast of Westeros. Twelve years later, in 102 BC, the Doom of Valyria struck: the Fourteen Flames erupted, tearing the peninsula apart, destroying much of the city, and wiping out nearly every dragon in the world. The exact cause of the Doom remains unknown; maesters describe it as a volcanic or seismic catastrophe, though records from the period are sparse and contradictory.",
      "In the wake of the Freehold's collapse, the surviving city-states declared their independence — today's Free Cities and the cities of Slaver's Bay each carry forward a different piece of Valyria's legacy. The Targaryens, sheltered on Dragonstone as the only surviving house of dragonlords, became the sole branch of that legacy to take root in Westeros.",
    ].join('\n\n'),
  },
  {
    slug: 'seven-kingdoms',
    name: 'The Birth of Six Kingdoms',
    orderIndex: -3000,
    pinned: false,
    date: 'ca. 3,000 BC – ca. 42 BC',
    quote: "Every new castle is an admission that the last one wasn't strong enough.",
    locations: ['Riverlands', 'Harrenhal'],
    imagePath: `${IMG_DIR}From Klickpin.com- Morning scripture reflections on a budget with charm and practical value with grace and hope-pin-id-1095711784324980482.jpg`,
    description: [
      "In the centuries following the Andal invasions, the last southern kingdoms of the First Men also fell, and the Andals raised six powerful kingdoms in their place. Around 3,000 BC, the wildlings united under the brother kings Gendel and Gorne and slipped past the Night's Watch through a network of tunnels beneath the Wall, only to be driven back by the army of the King in the North, House Stark.",
      'In a period remembered simply as "a thousand years ago," House Stark forced its chief rival, House Bolton — which had practiced flaying its enemies — to submit and abandon the custom; around the same time, Karlon Stark defeated a rebel lord, and his descendants took the name Karstark. In these same years, the Rhoynar fleeing Valyria migrated to Dorne — the last great migration into Westeros.',
      'Further south, around 400 BC, House Teague fell in the War of the Six Kings, and the Riverlands passed to Storm King Arlan III Durrandon; around 100 BC, Harwyn Hoare won the Riverlands back from the Durrandons at the Battle of Fairmarket. His son, Harren Hoare, began a construction that would take forty years, starting around 42 BC: Harrenhal.',
    ].join('\n\n'),
  },
  {
    slug: 'targaryen-dynasty',
    name: 'Three Centuries of Dragon Rule',
    orderIndex: -2,
    pinned: false,
    date: '2 BC – ca. 280 AC',
    quote: 'Dragons built the dynasty, but in time only the name was left to hold it up.',
    locations: ["King's Landing", 'Summerhall', 'Stepstones'],
    imagePath: `${IMG_DIR}From Klickpin.com- Dessert Ideas That Make Everyday Better 27976-pin-id-14707136280780771-story-1.jpg`,
    description: [
      "Between 2 BC and 1 AC, Aegon the Conqueror united six of the Seven Kingdoms and raised the Red Keep at King's Landing; only Dorne remained independent. Joined by his sisters Visenya and Rhaenys, his conquest ended with the Iron Islands' surrender and the death of the Storm King — Aegon's coronation marks the start of the calendar year 1 AC.",
      "The dynasty's first century was unstable: Aenys I's marriage scandalized the Faith and sparked a rebellion, which his brother, Maegor the Cruel, crushed in blood. Jaehaerys I the Conciliator, who followed, reigned fifty-four years in what became the dynasty's longest peace — a stability shattered between 129 and 131 AC by the Dance of the Dragons, a succession war between Aegon II and his half-sister Rhaenyra in which most of the family's dragons perished; when the last dragon died in 153 AC, the Iron Throne came to be held by title alone, not by living flame.",
      "The following century is marked by four separate Blackfyre Rebellions challenging the throne's legitimacy, and by the Tragedy of Summerhall in 259 AC, when much of the royal family died in a fire; the War of the Ninepenny Kings in 260 AC brought a young Tywin Lannister and Barristan Selmy to prominence as knights. Toward the century's end, Aerys II's imprisonment at Duskendale marks the beginning of the king's later unraveling.",
    ].join('\n\n'),
  },
  {
    slug: 'fall-of-the-dragons',
    name: 'The War of the Usurper',
    orderIndex: 282,
    pinned: false,
    date: '281–283 AC',
    quote: 'The war starts over a crown, but a different reckoning is settled in the streets of King\'s Landing.',
    locations: ['Harrenhal', 'Trident', "King's Landing", 'Tower of Joy'],
    imagePath: `${IMG_DIR}From Klickpin.com- Golden rainy day beauty for boards that feel current and for busy days for natural everyday beauty-pin-id-97038566966273320.jpg`,
    description: [
      'In 281 AC, during the suppression of the Kingswood Brotherhood, a young squire named Jaime Lannister is knighted by Ser Arthur Dayne, the Sword of the Morning, and named to the Kingsguard by Aerys II — an appointment that drives his father, Tywin Lannister, to resign as Hand of the King. That same year, at a tournament at Harrenhal, Prince Rhaegar Targaryen crowns Lyanna Stark of the North queen of love and beauty over his own wife, Elia Martell — a tournament later remembered as the "False Spring," and the first visible sign of the war to come.',
      "In 282–283 AC, Rhaegar's abduction of Lyanna drives King Aerys to execute her brother Brandon Stark and their father, Rickard Stark; when Aerys then demands the heads of Robert Baratheon and Eddard Stark, House Arryn, House Stark, and House Baratheon raise the banner of rebellion, joined soon after by House Tully. The rebellion turns decisively at the Battle of the Trident with Rhaegar's death; House Lannister, seemingly marching to the king's aid, switches sides during the Sack of King's Landing — Aerys is killed by Jaime Lannister, and Elia Martell and her children, Rhaenys and Aegon, are slaughtered by Lannister men.",
      'After the final clash at the Tower of Joy, Eddard Stark finds a dying Lyanna; by the war\'s end, Robert Baratheon sits the Iron Throne and marries Cersei Lannister. Ned returns to Winterfell with the boy he presents to the world as his bastard son, Jon Snow.',
    ].join('\n\n'),
  },
  {
    slug: 'king-roberts-reign',
    name: 'Thirteen Years of Peace',
    orderIndex: 284,
    pinned: false,
    date: '284–297 AC',
    quote: 'Thirteen years of peace is only the interest accruing on a debt no one has paid down.',
    locations: ['Dragonstone', 'Iron Islands', 'Braavos', 'Pentos'],
    imagePath: `${IMG_DIR}From Klickpin.com- Balanced citizen awareness tips for living for boards that feel current and for respectful conversat-pin-id-180495897562095106.png`,
    description: [
      "In 284 AC, Stannis Baratheon, on his brother King Robert's order, lays siege to Dragonstone, the Targaryens' last stronghold; before the castle surrenders, Queen Rhaella dies giving birth to Daenerys during a violent storm. Ser Willem Darry smuggles the young Viserys and Daenerys to Braavos — the dynasty's last two members grow up in exile.",
      "In 289 AC, Balon Greyjoy declares himself King of the Iron Islands and launches a rebellion; the short war costs him two sons, and he surrenders, sending his remaining son, Theon, to be raised as a ward in Eddard Stark's household. The rest of Robert's reign passes in relative calm — remembered for tourneys and hunts, but increasingly overshadowed by mounting royal debt.",
      'In 297 AC, Magister Illyrio Mopatis of Pentos begins hosting the now grown Viserys and Daenerys at his manse, promising his support to reclaim the Iron Throne — the first step of the dynasty\'s return is taken not from the throne itself, but from across the narrow sea.',
    ].join('\n\n'),
  },
  {
    slug: 'song-of-ice-and-fire',
    name: 'The War of the Five Kings and Beyond',
    orderIndex: 298,
    pinned: true,
    date: '298 AC –',
    quote: 'A poisoned cup ends thirteen years of false peace in a single afternoon.',
    locations: ["King's Landing", 'Wall', 'Riverlands', "Slaver's Bay"],
    imagePath: `${IMG_DIR}daenerys-targaryen-with-drogon-rhaegal-and-viserion-artwork-v0-jn6urtweoadh1.webp`,
    description: [
      "In 298 AC, Hand of the King Jon Arryn is poisoned shortly after learning the truth about the parentage of King Robert's heirs — the first link in a chain that will soon claim Robert's own life. In the wake of the king's death, the Seven Kingdoms are dragged into the War of the Five Kings — the throne once seized from the Mad King by his own Kingsguard's blade now stands on the edge of changing hands again.",
      "In the North, the White Walkers are seen again for the first time in thousands of years; the Night's Watch launches a great ranging to investigate the threat. The war's darkest hour comes in the Riverlands: the Red Wedding, where guest right is deliberately broken, remains forever after a symbol of betrayal in the North's memory.",
      'In Essos, the last exiled Targaryen hatches three dragon eggs and conquers the cities of Slaver\'s Bay. Years later the war will end with the fall of the Wall and the melting of the Iron Throne — but that ending is only the outcome of what is first set in motion here, in 298 AC.',
    ].join('\n\n'),
  },
];

function cloudinarySignature(params) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(toSign + CLOUDINARY_API_SECRET).digest('hex');
}

async function uploadLocalFileToCloudinary(filePath, publicIdHint) {
  if (!existsSync(filePath)) throw new Error(`Dosya bulunamadı: ${filePath}`);
  const buffer = readFileSync(filePath);
  const ext = filePath.split('.').pop();
  const blob = new Blob([buffer]);

  const timestamp = Math.floor(Date.now() / 1000);
  const signParams = { folder: CLOUDINARY_FOLDER, timestamp };
  const signature = cloudinarySignature(signParams);

  const form = new FormData();
  form.append('file', blob, `${publicIdHint}.${ext}`);
  form.append('api_key', CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('folder', CLOUDINARY_FOLDER);
  form.append('signature', signature);

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(uploadData.error?.message || 'Cloudinary upload başarısız');
  return uploadData.secure_url;
}

async function createLoreEvent(seriesId, body) {
  const res = await fetch(`${BACKEND_BASE_URL}/series/${seriesId}/lore/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || `POST /lore/events başarısız (${res.status})`);
  return data;
}

async function main() {
  const eras = eraFilter ? ERAS.filter((e) => e.slug === eraFilter) : ERAS;
  if (eras.length === 0) {
    console.error(`Dönem bulunamadı: ${eraFilter}`);
    process.exit(1);
  }

  let seriesId = null;
  if (AUTH_TOKEN) {
    console.log(`Series detayı çekiliyor: ${SERIES_SLUG}`);
    const series = await fetch(`${BACKEND_BASE_URL}/series/slug/${SERIES_SLUG}`).then((r) => r.json());
    seriesId = series.id;
    console.log(`Series id: ${seriesId}`);
  }

  const reportPathPre = resolve('scripts/output/history-events-report.json');
  const existingReport = existsSync(reportPathPre) ? JSON.parse(readFileSync(reportPathPre, 'utf8')) : [];
  const force = process.argv.includes('--force');

  const rows = [];
  for (const era of eras) {
    const already = existingReport.find((r) => r.slug === era.slug && r.status === 'ok' && r.eventId);
    if (already && !force) {
      console.log(`\n${era.slug}: zaten yazılmış (eventId: ${already.eventId}), atlandı`);
      rows.push(already);
      continue;
    }
    try {
      console.log(`\n${era.slug} (${era.name}) işleniyor...`);
      const imageUrl = await uploadLocalFileToCloudinary(era.imagePath, `got-history-${era.slug}`);
      console.log(`  ✓ Cloudinary: ${imageUrl}`);

      const body = {
        name: era.name,
        description: era.description,
        orderIndex: era.orderIndex,
        imageUrl,
        locationId: null,
        pinned: era.pinned,
        customFields: JSON.stringify({ date: era.date, quote: era.quote, locations: era.locations }),
      };

      let created = null;
      if (AUTH_TOKEN) {
        created = await createLoreEvent(seriesId, body);
        console.log(`  ✓ Event oluşturuldu (id: ${created.id})`);
      } else {
        console.log('  · dry-run: backend\'e yazılmadı');
      }

      rows.push({ slug: era.slug, status: 'ok', imageUrl, eventId: created?.id ?? null, body });
    } catch (err) {
      console.log(`  ✗ ${era.slug}: ${err.message}`);
      rows.push({ slug: era.slug, status: 'error', error: err.message });
    }
  }

  mkdirSync(resolve('scripts/output'), { recursive: true });
  const reportPath = resolve('scripts/output/history-events-report.json');
  const existing = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, 'utf8')) : [];
  for (const row of rows) {
    const i = existing.findIndex((r) => r.slug === row.slug);
    if (i === -1) existing.push(row);
    else existing[i] = row;
  }
  writeFileSync(reportPath, JSON.stringify(existing, null, 2));
  console.log(`\nRapor: scripts/output/history-events-report.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
