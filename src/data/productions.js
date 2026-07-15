// Mock data shaped to mirror a future Spring Boot REST response
// (GET /api/productions, GET /api/productions/:slug) — swap the fetch layer later,
// keep this shape.

export const productions = [
  {
    id: 'from',
    slug: 'from',
    title: 'From',
    type: 'series',
    genre: ['Horror', 'Mystery'],
    synopsis:
      'Residents of a town that traps all who enter are powerless to leave, forced to survive creatures that come out at night.',
    posterGradient: 'linear-gradient(160deg, #10140f 0%, #26311f 45%, #3d1414 100%)',
    theme: {
      bg: '#0b0f0a',
      accent: '#6f7a3f',
      accent2: '#8a2f1f',
      fg: '#e4e2d6',
    },
  },
  {
    id: 'got',
    slug: 'game-of-thrones',
    title: 'Game of Thrones',
    type: 'series',
    genre: ['Fantasy', 'Drama'],
    synopsis:
      'Noble families vie for control of the Iron Throne while an ancient enemy returns after being dormant for thousands of years.',
    posterGradient: 'linear-gradient(160deg, #17130a 0%, #3a2c10 45%, #5a1414 100%)',
    theme: {
      bg: '#120e08',
      accent: '#b8933f',
      accent2: '#6b1414',
      fg: '#efe6d2',
    },
  },
  {
    id: 'severance',
    slug: 'severance',
    title: 'Severance',
    type: 'series',
    genre: ['Sci-Fi', 'Thriller'],
    synopsis:
      'Employees at Lumon Industries undergo a procedure that splits their memories between their work and personal lives.',
    posterGradient: 'linear-gradient(160deg, #06100e 0%, #0f2b26 45%, #123632 100%)',
    theme: {
      bg: '#05100e',
      accent: '#1fb5a3',
      accent2: '#e7e7e2',
      fg: '#eafffb',
    },
  },
  {
    id: 'house-dragon',
    slug: 'house-of-the-dragon',
    title: 'House of the Dragon',
    type: 'series',
    genre: ['Fantasy', 'Drama'],
    synopsis: 'The Targaryen civil war, a century before the events of Game of Thrones.',
    posterGradient: 'linear-gradient(160deg, #140506 0%, #350a0a 45%, #591414 100%)',
    theme: { bg: '#120404', accent: '#c23b3b', accent2: '#2b0a0a', fg: '#f4e6e2' },
  },
  {
    id: 'stranger-things',
    slug: 'stranger-things',
    title: 'Stranger Things',
    type: 'series',
    genre: ['Sci-Fi', 'Horror'],
    synopsis: 'A group of kids uncover supernatural mysteries in their small town.',
    posterGradient: 'linear-gradient(160deg, #0a0512 0%, #1f0e33 45%, #3d0d1a 100%)',
    theme: { bg: '#0a0512', accent: '#e0334f', accent2: '#5b2ce0', fg: '#efe6ff' },
  },
  {
    id: 'the-bear',
    slug: 'the-bear',
    title: 'The Bear',
    type: 'series',
    genre: ['Drama', 'Comedy'],
    synopsis: 'A young chef returns home to run his family sandwich shop after a tragedy.',
    posterGradient: 'linear-gradient(160deg, #120a05 0%, #2e1a0a 45%, #4a2410 100%)',
    theme: { bg: '#120a05', accent: '#e08a2e', accent2: '#2e1a0a', fg: '#f6ead9' },
  },
];

export const getProductionBySlug = (slug) => productions.find((p) => p.slug === slug);
