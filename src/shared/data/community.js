// KALICI mock — content.js'in (theories/news/blogPosts) yerini alıyor. Backend'de
// forum/community modülü henüz yok; şekli gelecekteki `GET /api/community/threads?
// surface=...` sözleşmesinin taslağıdır (learned-rules "Topluluk" bölümü —
// Category.surface modeli). Yapım/Evren burada KLASÖR değil, thread'e iliştirilen
// çapraz-kesen bir alan (productionSlug) — organizasyon ekseni surface'tir.

export const SURFACES = [
  { key: 'DISCUSSION', label: 'Discussion', to: '/community/discussion' },
  { key: 'THEORY', label: 'Theories', to: '/community/theories' },
  { key: 'FAN_ART', label: 'Fan Art', to: '/community/fan-art' },
  { key: 'NEWS', label: 'News', to: '/news' },
  { key: 'BLOG', label: 'Blog', to: '/blog' },
];

// GoT + House of the Dragon tek evren adayı (task_plan.md 2c) — diğer yapımlar
// şimdilik evrensiz. Evren KLASÖR değildir, sadece "evrene göre gez" girişi.
export const universes = [
  {
    id: 'westeros',
    name: 'Westeros',
    slug: 'westeros',
    productionSlugs: ['game-of-thrones', 'house-of-the-dragon'],
  },
];

export const threads = [
  // --- Theories (content.js'ten taşındı) ---
  {
    id: 't1',
    surface: 'THEORY',
    productionSlug: 'from',
    title: 'The town is a purgatory built from collective guilt',
    excerpt: 'Every resident carries an unresolved sin — the town manifests each of their fears as monsters.',
    author: 'nightcrawler_22',
    votes: 482,
  },
  {
    id: 't2',
    surface: 'THEORY',
    productionSlug: 'severance',
    title: "Lumon's founder is still alive, severed from himself",
    excerpt: 'Kier Eagan may be the first person ever severed — hiding in plain sight as an "innie".',
    author: 'macro_dat_analysis',
    votes: 356,
  },
  {
    id: 't3',
    surface: 'THEORY',
    productionSlug: 'game-of-thrones',
    title: 'The Night King was created to fight a greater threat',
    excerpt: 'The Children of the Forest built the Night King as a weapon against something worse than men.',
    author: 'valyrian_scrolls',
    votes: 701,
  },

  // --- News (content.js'ten taşındı) ---
  {
    id: 'n1',
    surface: 'NEWS',
    productionSlug: 'house-of-the-dragon',
    title: 'House of the Dragon renewed for a fourth season',
    excerpt: 'The Targaryen saga continues as the show is confirmed for another chapter.',
    date: '2026-07-02',
  },
  {
    id: 'n2',
    surface: 'NEWS',
    productionSlug: 'stranger-things',
    title: 'Final season release date confirmed',
    excerpt: 'The Hawkins saga comes to a close this winter.',
    date: '2026-06-18',
  },
  {
    id: 'n3',
    surface: 'NEWS',
    productionSlug: 'severance',
    title: 'Severance season 3 begins filming',
    excerpt: 'Lumon Industries reopens its doors for a new batch of episodes.',
    date: '2026-05-30',
  },

  // --- Blog (content.js'ten taşındı — News'ten AYRI yüzey, learned-rules) ---
  {
    id: 'b1',
    surface: 'BLOG',
    productionSlug: 'the-bear',
    title: 'Why The Bear is the most stressful show on television',
    excerpt: 'A look at how sound design and editing manufacture anxiety on purpose.',
    readTime: '6 min read',
  },
  {
    id: 'b2',
    surface: 'BLOG',
    productionSlug: 'from',
    title: 'Ranking every monster design in From',
    excerpt: 'From the crawling horrors to the ones that whisper your name.',
    readTime: '9 min read',
  },
  {
    id: 'b3',
    surface: 'BLOG',
    productionSlug: 'game-of-thrones',
    title: 'The costume design language of House Targaryen',
    excerpt: 'How color and fabric silently narrate a century of civil war.',
    readTime: '7 min read',
  },

  // --- Discussion (yeni yüzey, önceden mock'u yoktu) ---
  {
    id: 'd1',
    surface: 'DISCUSSION',
    productionSlug: 'game-of-thrones',
    title: 'Which house would you actually want to be born into?',
    excerpt: "Not who's the strongest — who'd you want to wake up as for a normal Tuesday in Westeros.",
    author: 'starkbannerman',
    replyCount: 128,
  },
  {
    id: 'd2',
    surface: 'DISCUSSION',
    productionSlug: 'severance',
    title: 'Would you get severed if it were real?',
    excerpt: 'Genuinely asking — half of us said yes immediately and that worries me.',
    author: 'outie_perspective',
    replyCount: 94,
  },
  {
    id: 'd3',
    surface: 'DISCUSSION',
    productionSlug: null,
    title: 'What show do you think deserves way more attention?',
    excerpt: "Not asking for the biggest hits — what's the one nobody talks about that you can't stop thinking about?",
    author: 'quietwatcher',
    replyCount: 61,
  },

  // --- Fan Art (yeni yüzey; görsel asset henüz yok, kart aşamada gradient placeholder kullanır) ---
  {
    id: 'f1',
    surface: 'FAN_ART',
    productionSlug: 'house-of-the-dragon',
    title: 'Vhagar over Dragonstone',
    author: 'inkwing_art',
  },
  {
    id: 'f2',
    surface: 'FAN_ART',
    productionSlug: 'stranger-things',
    title: 'Hawkins, 1986 — a poster study',
    author: 'retrogrid',
  },
  {
    id: 'f3',
    surface: 'FAN_ART',
    productionSlug: 'the-bear',
    title: 'The kitchen line, mid-rush',
    author: 'linecook.doodles',
  },
];

export const getThreadsBySurface = (surface) => threads.filter((t) => t.surface === surface);
export const getThreadsByProduction = (slug) => threads.filter((t) => t.productionSlug === slug);
