# Fandoom

Karanlık temalı bir fandom portalı. Diziler/filmler ("productions") için teoriler,
haberler ve blog yazıları sunar.

## Stack

- React 19 + Vite 8, JSX (`.jsx`), tip kontrolü yok (plain JS)
- Routing: `react-router-dom`
- 3D/hero görselleri: `three`, `@react-three/fiber`, `@react-three/drei`
- Animasyon: `gsap` (giriş/scroll efektleri için)
- Smooth scroll: `lenis` — zaten kurulu, ikinci bir smooth-scroll çözümü eklenmez
- Lint: `oxlint` (bkz. `.oxlintrc.json`)

## Komutlar

- `npm run dev` — geliştirme sunucusu
- `npm run build` — production build
- `npm run lint` — oxlint
- `npm run preview` — build önizleme

## Veri katmanı

`src/data/*.js` altındaki veri, ileride bağlanacak bir Spring Boot REST API'sinin
response şeklini taklit eder (bkz. dosya başlarındaki yorumlar). Fetch katmanı
değişecek ama **şekil sabit kalmalı**.

`src/data/productions.js`:
```js
{ id, slug, title, type, genre: [], synopsis, posterGradient, theme: { bg, accent, accent2, fg } }
```

`src/data/content.js`:
```js
theories:   { id, productionSlug, title, excerpt, author, votes }
news:       { id, productionSlug, title, excerpt, date }
blogPosts:  { id, productionSlug, title, excerpt, readTime }
```

Her `productionSlug`, `productions.js` içinde var olan bir `slug`'a karşılık gelmeli.
Id'ler her dizi için prefiks+sıra numarası deseninde (`t1,t2,...`, `n1,n2,...`, `b1,b2,...`).

## Component sözleşmesi

Her component kendi `.css` dosyasıyla birlikte gelir: `Foo.jsx` + `Foo.css`
(bkz. `src/components/`). Fonksiyonel component + hook, class component yok.

## Marka kimliği

`src/styles/theme.css` global token'ları tanımlar:

- Koyu zemin: `--bg #050505`, `--bg-soft`, `--card-bg`
- Marka gradyanı: `--brand-gradient` (kırmızı → magenta → pembe → mor)
- Fontlar: `--font-display` / `--font-body` (Montserrat, başlıklarda opsiyonel Fraunces)

Yeni UI, hardcoded hex renk yerine bu token'ları kullanmalı. Her production'ın kendi
`theme` paleti (`bg/accent/accent2/fg`) vardır ve global koyu estetikle uyumlu, okunur
kontrastta olmalı.
