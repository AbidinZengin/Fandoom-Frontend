// Mock content data (theories / news / blog) — shaped to mirror a future Spring Boot
// REST response. Swap the fetch layer later, keep this shape.

export const theories = [
  {
    id: 't1',
    productionSlug: 'from',
    title: 'The town is a purgatory built from collective guilt',
    excerpt: 'Every resident carries an unresolved sin — the town manifests each of their fears as monsters.',
    author: 'nightcrawler_22',
    votes: 482,
  },
  {
    id: 't2',
    productionSlug: 'severance',
    title: "Lumon's founder is still alive, severed from himself",
    excerpt: 'Kier Eagan may be the first person ever severed — hiding in plain sight as an "innie".',
    author: 'macro_dat_analysis',
    votes: 356,
  },
  {
    id: 't3',
    productionSlug: 'game-of-thrones',
    title: 'The Night King was created to fight a greater threat',
    excerpt: 'The Children of the Forest built the Night King as a weapon against something worse than men.',
    author: 'valyrian_scrolls',
    votes: 701,
  },
];

export const news = [
  {
    id: 'n1',
    productionSlug: 'house-of-the-dragon',
    title: 'House of the Dragon renewed for a fourth season',
    excerpt: 'The Targaryen saga continues as the show is confirmed for another chapter.',
    date: '2026-07-02',
  },
  {
    id: 'n2',
    productionSlug: 'stranger-things',
    title: 'Final season release date confirmed',
    excerpt: 'The Hawkins saga comes to a close this winter.',
    date: '2026-06-18',
  },
  {
    id: 'n3',
    productionSlug: 'severance',
    title: 'Severance season 3 begins filming',
    excerpt: 'Lumon Industries reopens its doors for a new batch of episodes.',
    date: '2026-05-30',
  },
];

export const blogPosts = [
  {
    id: 'b1',
    productionSlug: 'the-bear',
    title: 'Why The Bear is the most stressful show on television',
    excerpt: 'A look at how sound design and editing manufacture anxiety on purpose.',
    readTime: '6 min read',
  },
  {
    id: 'b2',
    productionSlug: 'from',
    title: "Ranking every monster design in From",
    excerpt: 'From the crawling horrors to the ones that whisper your name.',
    readTime: '9 min read',
  },
  {
    id: 'b3',
    productionSlug: 'game-of-thrones',
    title: 'The costume design language of House Targaryen',
    excerpt: 'How color and fabric silently narrate a century of civil war.',
    readTime: '7 min read',
  },
];
