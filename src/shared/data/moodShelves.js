// MOCK: ruh hali rafları (Home + Series/Movies hub'ları ortak kullanır).
// Backend'de mood/küratörlü liste alanı yok; şimdilik raf → slug eşlemesi
// burada, yapım verisi gerçek API'den gelir. Backend gelince bu dosya
// endpoint'e döner, çağıranların .data.js katmanı değişir.
const MOOD_SHELVES = [
  {
    id: 'mind-benders',
    title: 'Mind Benders',
    slugs: ['mulholland-drive', 'enemy', 'memento', 'severance', 'pluribus', 'anatomy-of-a-fall', 'silo'],
  },
  {
    id: 'descent-into-madness',
    title: 'Slow Descent into Madness',
    slugs: ['black-swan', 'the-lighthouse', 'requiem-for-a-dream', 'the-shining', 'girl-interrupted'],
  },
  {
    id: 'beautiful-nightmares',
    title: 'Beautiful Nightmares',
    slugs: ['midsommar', 'pearl', 'eyes-wide-shut', 'frankenstein'],
  },
  {
    id: 'antiheroes',
    title: "Characters You Shouldn't Root For",
    slugs: [
      'nightcrawler',
      'taxi-driver',
      'american-psycho',
      'breaking-bad',
      'gone-girl',
      'a-clockwork-orange',
      'the-boys',
      'euphoria',
      'house-of-the-dragon',
      'game-of-thrones',
      'invincible',
    ],
  },
  {
    id: 'lights-on',
    title: 'Watch With the Lights On',
    slugs: [
      'the-silence-of-the-lambs',
      'zodiac',
      'from',
      'it-welcome-to-derry',
      'the-terror',
      'stranger-things',
      'the-last-of-us',
      'sinister',
      'weapons',
    ],
  },
];

// Verilen yapım listesini raflara dağıtır; listede olmayan slug'lar düşer,
// boş kalan raf dönmez (Series hub'ında film rafları kendiliğinden elenir).
export function groupByMood(productions) {
  const bySlug = new Map(productions.map((p) => [p.slug, p]));
  return MOOD_SHELVES.map((shelf) => ({
    id: shelf.id,
    title: shelf.title,
    productions: shelf.slugs.map((slug) => bySlug.get(slug)).filter(Boolean),
  })).filter((shelf) => shelf.productions.length > 0);
}
