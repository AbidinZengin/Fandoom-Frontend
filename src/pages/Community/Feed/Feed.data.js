// Feed'in veri erişim katmanı. Thread listesi bu component'e ÖZGÜ bir mock
// settir (kullanıcı düzeltmesi, 2026-09-13: eski shared/data/community.js
// thread'lerini üstüne alan ekleyerek yeniden kullanmak "eski sayfadan
// bağımsız tasarım" değildi) — backend'de forum modülü henüz yok, sadece
// News/Home/ProductionDetail'in okuduğu shared/data/community.js'e
// DOKUNULMADI, o üç sayfa etkilenmez. Kullanıcı-oluşturduğu postlar
// localStorage'da OPTIMISTIC tutulur (Faz 1 spec'i madde 5) — sayfa
// yenilenince kaybolmaz, gerçek backend'e YAZMAZ; Faz 2'de thread POST
// ucu gelince bu katman değişir.
import { getMyProfile } from '../../../shared/api/account';

const STORAGE_KEY = 'fandoom_community_local_posts';
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

const MOCK_THREADS = [
  {
    id: '1',
    surface: 'THEORY',
    productionSlug: 'breaking-bad',
    title: 'Walt Jr. always knew more than he let on',
    excerpt: 'His silence in the finale reads less like ignorance and more like a kid who stopped asking questions on purpose.',
    body: "His silence in the finale reads less like ignorance and more like a kid who stopped asking questions on purpose.\n\nGo back to season 4 — every time Walt gets cagey about the car wash money, Junior changes the subject first. That's not obliviousness, that's a teenager who's done the math and doesn't want the answer confirmed out loud.\n\nThe show never spells it out because it doesn't need to. Junior's arc isn't about finding out — it's about how long a person can choose not to know.",
    author: 'flynn_theories',
    likeCount: 612,
    commentCount: 141,
    tags: ['breaking-bad', 'theory'],
    createdAtOffset: 25 * 60 * 1000,
  },
  {
    id: '2',
    surface: 'DISCUSSION',
    productionSlug: 'stranger-things',
    title: 'Which Hawkins kid would survive a season the longest?',
    excerpt: "Not the strongest fighter — the one whose survival instinct you'd actually trust.",
    body: "Not the strongest fighter — the one whose survival instinct you'd actually trust to keep the group alive for a full season.\n\nMy pick is Max, purely on paranoia. She checks corners nobody else bothers with. Curious what the rest of you think, and why.",
    author: 'upside_down_takes',
    likeCount: 344,
    commentCount: 98,
    tags: ['stranger-things', 'discussion'],
    createdAtOffset: 55 * 60 * 1000,
  },
  {
    id: '3',
    surface: 'FAN_ART',
    productionSlug: 'house-of-the-dragon',
    title: 'Caraxes mid-dive, Blackwater Bay below',
    author: 'redwyrm_art',
    likeCount: 789,
    commentCount: 62,
    tags: ['house-of-the-dragon', 'fan-art'],
    createdAtOffset: 2 * HOUR,
  },
  {
    id: '4',
    surface: 'THEORY',
    productionSlug: 'severance',
    title: 'The elevator itself is the real severance barrier',
    excerpt: "It's not the chip — Lumon just needs everyone to believe it's the chip.",
    body: "It's not the chip — Lumon just needs everyone to believe it's the chip.\n\nThink about how much of the show's tension depends on the elevator threshold specifically, not on any scene where the chip itself is shown doing something. The chip could be a placebo and the ritual of the door closing would still produce the split, because everyone involved has agreed to act like it does.\n\nLumon's real product was never the procedure. It's the belief.",
    author: 'macrodata_mike',
    likeCount: 501,
    commentCount: 133,
    tags: ['severance', 'theory'],
    createdAtOffset: 3 * HOUR,
  },
  {
    id: '5',
    surface: 'DISCUSSION',
    productionSlug: 'from',
    title: 'Would you even try to leave, or just build a life in town?',
    excerpt: 'Genuine question — running never works in this show, so what actually gives you the better odds?',
    body: "Genuine question — running never works in this show, so what actually gives you the better odds: burning years trying to find the edge of the map, or just building a life inside the fence and hoping the town gets bored of you?\n\nI think I'd go full Boyd. Map it, sure, but live like I'm staying.",
    author: 'colony_house_9',
    likeCount: 267,
    commentCount: 74,
    tags: ['from', 'discussion'],
    createdAtOffset: 5 * HOUR,
  },
  {
    id: '6',
    surface: 'FAN_ART',
    productionSlug: 'game-of-thrones',
    title: 'The Wall at dusk, before the Watch lit the fires',
    author: 'black_gate_studio',
    likeCount: 918,
    commentCount: 104,
    tags: ['game-of-thrones', 'fan-art'],
    createdAtOffset: 7 * HOUR,
  },
  {
    id: '7',
    surface: 'THEORY',
    productionSlug: 'it-welcome-to-derry',
    title: 'Derry rebuilds itself specifically to forget, not to heal',
    excerpt: "Every generation's collective amnesia is the real horror mechanism, not the thing wearing the face.",
    body: "Every generation's collective amnesia is the real horror mechanism here, not the thing wearing the face.\n\nSPOILER for the finale: once you notice how fast the adults' memories smooth back over, the cycle stops looking like a monster hibernating and starts looking like a town that's actively choosing to forget, generation after generation, because remembering is worse.\n\nThat's a scarier premise than anything in a sewer.",
    author: 'pennywise_studies',
    likeCount: 356,
    commentCount: 81,
    tags: ['it-welcome-to-derry', 'theory'],
    spoilerFlagged: true,
    createdAtOffset: 10 * HOUR,
  },
  {
    id: '8',
    surface: 'DISCUSSION',
    productionSlug: 'pluribus',
    title: "Is 'joining' actually the rational choice in this universe?",
    excerpt: 'Everyone treats resistance as the obvious moral stance, but has the show actually earned that?',
    body: "Everyone treats resistance as the obvious moral stance, but has the show actually earned that, or are we just defaulting to 'individuality good' because that's the genre convention?\n\nGenuinely not sure the show is on the side we assume it's on.",
    author: 'hive_mind_maybe',
    likeCount: 198,
    commentCount: 47,
    tags: ['pluribus', 'discussion'],
    createdAtOffset: 14 * HOUR,
  },
  {
    id: '9',
    surface: 'FAN_ART',
    productionSlug: 'breaking-bad',
    title: 'The RV, one last time, painted from memory',
    author: 'rv_dreams',
    likeCount: 445,
    commentCount: 39,
    tags: ['breaking-bad', 'fan-art'],
    createdAtOffset: DAY,
  },
  {
    id: '10',
    surface: 'THEORY',
    productionSlug: 'stranger-things',
    title: 'Vecna needed Eleven specifically, not just any gifted kid',
    excerpt: 'The connection reads more like an origin story than a rivalry — worth going back and checking season 1 again.',
    body: "The connection reads more like an origin story than a rivalry — worth going back and checking season 1 again with this in mind.\n\nEvery other kid at Hawkins Lab gets treated as an experiment. Only El gets treated like something he's trying to finish building. That's not the language of an enemy, that's the language of an unfinished project.",
    author: 'gate_theorist',
    likeCount: 402,
    commentCount: 88,
    tags: ['stranger-things', 'theory'],
    createdAtOffset: DAY + 3 * HOUR,
  },
  {
    id: '11',
    surface: 'DISCUSSION',
    productionSlug: 'severance',
    title: "What's your actual innie job, be honest",
    excerpt: 'Mine is definitely something involving spreadsheets nobody reads. What does yours look like.',
    body: 'Mine is definitely something involving spreadsheets nobody reads. What does yours look like — and would you actually want to know if it mattered?',
    author: 'lumon_break_room',
    likeCount: 289,
    commentCount: 152,
    tags: ['severance', 'discussion'],
    createdAtOffset: DAY + 8 * HOUR,
  },
  {
    id: '12',
    surface: 'FAN_ART',
    productionSlug: 'from',
    title: "Boyd's map, redrawn with every road that doesn't exist yet",
    author: 'cartography_of_from',
    likeCount: 312,
    commentCount: 28,
    tags: ['from', 'fan-art'],
    createdAtOffset: 2 * DAY,
  },
];

function withComputedTime(thread) {
  return { ...thread, createdAt: new Date(Date.now() - thread.createdAtOffset).toISOString() };
}

function readLocalPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalPosts(posts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch {
    // localStorage kullanılamıyorsa (gizli sekme/kota) sessizce vazgeç —
    // post yine de bu oturumda state üzerinden görünür kalır.
  }
}

// FeedCard ve ThreadBody arasında paylaşılan zaman etiketi — ikisi de aynı
// mock thread verisini gösterir, tek yerde tanımlı.
export function timeAgo(iso, t) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return t('community.feed.timeJustNow');
  if (minutes < 60) return t('community.feed.timeMinutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('community.feed.timeHoursAgo', { count: hours });
  return t('community.feed.timeDaysAgo', { count: Math.floor(hours / 24) });
}

export const SORT_OPTIONS = ['hot', 'new', 'top'];

export function sortThreads(list, sort) {
  const copy = [...list];
  if (sort === 'top') return copy.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
  if (sort === 'new') return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return copy.sort((a, b) => (b.likeCount ?? 0) + (b.commentCount ?? 0) - ((a.likeCount ?? 0) + (a.commentCount ?? 0)));
}

export function getFeedThreads(surface) {
  const local = readLocalPosts().filter((p) => !surface || p.surface === surface);
  const base = MOCK_THREADS.filter((t) => !surface || t.surface === surface).map(withComputedTime);
  return [...local, ...base];
}

export function getThreadById(id) {
  return readLocalPosts().find((p) => p.id === id) ?? MOCK_THREADS.map(withComputedTime).find((t) => t.id === id) ?? null;
}

export async function createThread({ surface, title, body, imageUrl, tags }) {
  const profile = await getMyProfile();
  const post = {
    id: String(Date.now()),
    surface,
    title,
    excerpt: body ? body.slice(0, 200) : '',
    body: body || undefined,
    author: profile.username,
    likeCount: 0,
    commentCount: 0,
    tags: tags ?? [],
    imageUrl: imageUrl || undefined,
    createdAt: new Date().toISOString(),
    isLocalDraft: true,
  };
  writeLocalPosts([post, ...readLocalPosts()]);
  return post;
}
