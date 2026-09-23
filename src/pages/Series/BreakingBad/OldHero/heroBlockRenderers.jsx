import gsap from 'gsap';
import styles from './OldHero.module.css';

// "Dinamik Render Motoru" — kullanıcının AST tasarımı: type → component
// eşleyen bir registry. Yeni bir blok TİPİ eklemek bu dosyaya bir satır
// eklemek demek, backend/şema değişikliği GEREKMEZ (content/styles zaten
// serbest JSON). Sadece Series Hero'ya özel değil — ileride başka bir
// slot (Blog Cover vb.) bu registry'nin bir kopyasını/genişletilmiş
// hâlini kullanabilir.

// Geliştiricinin kaydettiği animasyon preset'leri — admin panelde bir
// dropdown'dan SEÇİLİR, serbest kod YAZILMAZ (güvenlik + "excalidraw gibi
// basit" hedefi). `params` listesi editördeki kontrol UI'sini otomatik
// üretir (bkz. BlockItem.jsx).
export const ANIMATION_PRESETS = {
  none: { label: 'None', params: [], apply: () => null },
  fadeUpStagger: {
    label: 'Fade Up',
    params: [
      { key: 'duration', label: 'Duration', type: 'range', min: 0.2, max: 2, step: 0.05, default: 0.9 },
      { key: 'delay', label: 'Delay', type: 'range', min: 0, max: 1.5, step: 0.02, default: 0 },
    ],
    apply(target, params = {}) {
      return gsap.from(target, {
        opacity: 0,
        y: 28,
        duration: params.duration ?? 0.9,
        delay: params.delay ?? 0,
        ease: 'power3.out',
        clearProps: 'opacity,transform',
      });
    },
  },
  parallaxDrift: {
    label: 'Parallax Drift (scroll)',
    params: [{ key: 'amount', label: 'Amount (%)', type: 'range', min: 2, max: 20, step: 1, default: 6 }],
    apply(target, params = {}, { scrollTrigger } = {}) {
      const amount = params.amount ?? 6;
      return gsap.fromTo(
        target,
        { yPercent: -amount },
        { yPercent: amount, ease: 'none', scrollTrigger }
      );
    },
  },
};

function positionStyle(block) {
  return {
    position: 'absolute',
    left: `${block.x}%`,
    top: `${block.y}%`,
    width: `${block.width}%`,
    height: block.height != null ? `${block.height}%` : 'auto',
  };
}

// Kaçış kapısı: yapılandırılmış kontrollerin dışında kalan herhangi bir
// CSS özelliği. Statik/inert metin — JS/kod ÇALIŞTIRMAZ, sadece
// `key: value;` çiftlerini styles objesine merge eder.
function parseCustomCss(customCss) {
  if (!customCss) return {};
  const result = {};
  customCss.split(';').forEach((decl) => {
    const idx = decl.indexOf(':');
    if (idx === -1) return;
    const key = decl.slice(0, idx).trim();
    const value = decl.slice(idx + 1).trim();
    if (key && value) result[key] = value;
  });
  return result;
}

function mergedStyle(block, extra) {
  return { ...positionStyle(block), ...extra, ...(block.styles ?? {}), ...parseCustomCss(block.customCss) };
}

// Kullanıcı kararı: TR/EN ayrımı editörde YOK — tek serbest metin alanı.
function resolveText(content) {
  return content?.text || '';
}

function ImageBlockRenderer({ block }) {
  if (!block.content?.imageUrl) return null;
  return (
    <div data-hero-block data-hero-block-id={block.id} style={mergedStyle(block)}>
      <img
        src={block.content.imageUrl}
        alt=""
        style={{ display: 'block', width: '100%', height: block.height != null ? '100%' : 'auto', objectFit: 'cover' }}
      />
    </div>
  );
}

function LogoBlockRenderer({ block }) {
  if (!block.content?.imageUrl) return null;
  return (
    <img
      data-hero-block
      data-hero-block-id={block.id}
      src={block.content.imageUrl}
      alt=""
      style={mergedStyle(block, { display: 'block' })}
    />
  );
}

function TextBlockRenderer({ block }) {
  const text = resolveText(block.content);
  if (!text) return null;
  return (
    <p data-hero-block data-hero-block-id={block.id} style={mergedStyle(block, { margin: 0, color: 'var(--fg)' })}>
      {text}
    </p>
  );
}

// META BİLEREK block.content'i yok sayar — kullanıcı kararı: gerçek
// veriden (Series titleTr/synopsis/genres'ten türeyen metaLine) otomatik
// kompoze edilir, elle yazılmaz.
function MetaBlockRenderer({ block, context }) {
  if (!context?.metaLine) return null;
  return (
    <p data-hero-block data-hero-block-id={block.id} className={styles.hero__meta} style={mergedStyle(block)}>
      {context.metaLine}
    </p>
  );
}

function ButtonBlockRenderer({ block }) {
  const text = resolveText(block.content) || 'Watch Trailer';
  return (
    <button
      data-hero-block
      data-hero-block-id={block.id}
      type="button"
      className={styles.hero__trailer}
      style={mergedStyle(block)}
    >
      <svg viewBox="0 0 24 24" className={styles.hero__trailerIcon} aria-hidden="true">
        <path d="M8 5v14l11-7z" fill="currentColor" />
      </svg>
      {text}
    </button>
  );
}

function BoxBlockRenderer({ block }) {
  const text = resolveText(block.content);
  return (
    <div
      data-hero-block
      data-hero-block-id={block.id}
      style={mergedStyle(block, { boxSizing: 'border-box', padding: 'var(--space-sm)' })}
    >
      {text && <p style={{ margin: 0, color: 'var(--fg)' }}>{text}</p>}
    </div>
  );
}

export const BLOCK_RENDERERS = {
  IMAGE: ImageBlockRenderer,
  LOGO: LogoBlockRenderer,
  TITLE: TextBlockRenderer,
  SYNOPSIS: TextBlockRenderer,
  META: MetaBlockRenderer,
  BUTTON: ButtonBlockRenderer,
  BOX: BoxBlockRenderer,
};

export function HeroBlockRenderer({ block, context }) {
  const Component = BLOCK_RENDERERS[block.type];
  if (!Component) return null;
  return <Component block={block} context={context} />;
}
