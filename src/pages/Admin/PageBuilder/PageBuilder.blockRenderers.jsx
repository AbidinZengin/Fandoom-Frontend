import { registerComponent } from '../../../shared/builder/registry';
import { uploadImage } from '../../../shared/api/media';
import { TextBlockField } from '../BlogEditor/BlockList/BlockItem/TextBlockField';
import { SHAPE_CONTROLS, FILTER_PRESETS, CURSOR_PRESETS, resolveEffectiveStyle } from './PageBuilder.data';
import styles from './Canvas/Canvas.module.css';

// registry.js'in `component` sözleşmesi burada tanımlanır (motor bu
// prop şekline kör, ilk gerçek tüketici bu sayfa): { block, breakpoint,
// mode, onPatchContent, onCommit }. Efektif stil (breakpoint×hover
// kademeli) her renderer'da resolveEffectiveStyle ile aynı şekilde
// okunur — Canvas'ın kendisi de aynı fonksiyonu blok pozisyonlaması
// DIŞINDaki görsel efektler için kullanır.
//
// `blur` kontrolü kendi CSS özelliği DEĞİL (filter'ın bir fonksiyonu) —
// serbest metin `filter` alanıyla (gelişmiş: grayscale/hue-rotate vb.)
// ÇAKIŞMASIN diye burada birleştirilir, ikisi birlikte yazılabilir.
function composeFilter(s) {
  return [s.blur ? `blur(${s.blur}px)` : null, s.filter || null].filter(Boolean).join(' ') || undefined;
}

function ShapeRenderer({ block, breakpoint, mode, variant }) {
  const s = resolveEffectiveStyle(block, breakpoint, mode);
  const className = variant === 'diamond' ? styles.shapeDiamond : variant === 'circle' ? styles.shapeCircle : styles.shapeRect;
  return (
    <div
      className={className}
      style={{
        background: s.background,
        borderColor: s.borderColor,
        borderWidth: s.borderWidth,
        borderStyle: s.borderWidth ? (s.borderStyle || 'solid') : undefined,
        borderRadius: variant === 'rect' ? s.borderRadius : undefined,
        mixBlendMode: s.mixBlendMode,
        transform: s.transform,
        filter: composeFilter(s),
        cursor: s.cursor,
        opacity: s.opacity,
        boxShadow: s.boxShadow,
        zIndex: s.zIndex,
      }}
    />
  );
}

function TextRenderer({ block, breakpoint, mode, onPatchContent, onCommit }) {
  const s = resolveEffectiveStyle(block, breakpoint, mode);
  return (
    <div
      className={styles.textWrap}
      style={{
        background: s.background,
        borderRadius: s.borderRadius,
        borderColor: s.borderColor,
        borderWidth: s.borderWidth,
        borderStyle: s.borderWidth ? (s.borderStyle || 'solid') : undefined,
        padding: s.padding,
        mixBlendMode: s.mixBlendMode,
        transform: s.transform,
        filter: composeFilter(s),
        cursor: s.cursor,
        boxShadow: s.boxShadow,
        opacity: s.opacity,
        zIndex: s.zIndex,
      }}
    >
      <TextBlockField
        className={styles.textField}
        style={{
          color: s.color,
          fontSize: s.fontSize,
          fontFamily: s.fontFamily,
          fontWeight: s.fontWeight,
          letterSpacing: s.letterSpacing,
          lineHeight: s.lineHeight,
          textAlign: s.textAlign,
          textTransform: s.textTransform,
          textDecoration: s.textDecoration,
          textShadow: s.textShadow,
          // TextBlockField.module.css'in :focus outline'ı (var(--accent))
          // BlogEditor için düşünülmüş — PageBuilder'da (üretim temasına
          // göre mor/farklı renk çıkabiliyor) kullanıcı raporu: "mor
          // çerçeveye asla gerek yok". Inline style CSS class'ın :focus
          // kuralını ezer (SADECE bu kullanım, BlogEditor etkilenmez).
          outline: 'none',
        }}
        placeholder="Metin…"
        value={block.content?.text ?? ''}
        onChange={(text) => onPatchContent({ text })}
        onBlur={onCommit}
        autosize={block.layout.h == null}
      />
    </div>
  );
}

function ImageRenderer({ block, breakpoint, mode, onPatchContent, onCommit }) {
  const s = resolveEffectiveStyle(block, breakpoint, mode);
  const handleFile = async (file) => {
    if (!file) return;
    const { url } = await uploadImage(file);
    onPatchContent({ imageUrl: url });
    onCommit();
  };
  return (
    <div
      className={styles.imageFigure}
      style={{
        background: s.background,
        borderRadius: s.borderRadius,
        borderColor: s.borderColor,
        borderWidth: s.borderWidth,
        borderStyle: s.borderWidth ? (s.borderStyle || 'solid') : undefined,
        mixBlendMode: s.mixBlendMode,
        transform: s.transform,
        filter: composeFilter(s),
        cursor: s.cursor,
        opacity: s.opacity,
        boxShadow: s.boxShadow,
        zIndex: s.zIndex,
      }}
    >
      {block.content?.imageUrl ? (
        // objectPosition dropdown'la DEĞİL, Canvas.jsx'teki çift-tıkla-gir +
        // sürükle-kaydır jestiyle (startImagePan) sürekli % olarak set edilir
        // — kullanıcı raporu: "kırpma çapası değil, elimle kırpabiliyor
        // olmalıyım".
        <img className={styles.imageImg} style={{ objectFit: s.objectFit, objectPosition: s.objectPosition }} src={block.content.imageUrl} alt="" />
      ) : (
        // Kullanıcı raporu: "image'in yer değiştirememesi" — eskiden TÜM
        // placeholder alanı (block.locked'sız her yeri) tıklamayı yutuyordu,
        // blok hiç sürüklenemiyordu. Artık sadece ORTADAKİ küçük buton
        // dosya seçimini tetikliyor (stopPropagation SADECE onda), geri
        // kalan boş alan normal blok taşıma/boyutlandırmaya açık.
        <div className={styles.imagePlaceholder}>
          <label className={styles.imagePlaceholderBtn} onPointerDown={(e) => e.stopPropagation()}>
            Görsel seç
            <input type="file" accept="image/*" className={styles.imageInput} onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>
        </div>
      )}
    </div>
  );
}

export function registerPageBuilderComponents() {
  registerComponent('RECTANGLE', {
    name: 'Rectangle',
    component: (props) => <ShapeRenderer {...props} variant="rect" />,
    defaultContent: {},
    defaultStyles: { background: '#ffffff', opacity: 1 },
    controls: SHAPE_CONTROLS,
  });
  registerComponent('DIAMOND', {
    name: 'Diamond',
    component: (props) => <ShapeRenderer {...props} variant="diamond" />,
    defaultContent: {},
    defaultStyles: { background: '#ffffff', opacity: 1 },
    controls: SHAPE_CONTROLS,
  });
  registerComponent('CIRCLE', {
    name: 'Circle',
    component: (props) => <ShapeRenderer {...props} variant="circle" />,
    defaultContent: {},
    defaultStyles: { background: '#ffffff', opacity: 1 },
    controls: SHAPE_CONTROLS,
  });
  registerComponent('TEXT', {
    name: 'Text',
    component: TextRenderer,
    defaultContent: { text: '' },
    defaultStyles: { color: '#111111', fontSize: '16px' },
    // Data sekmesinin tip-uyumluluk kontrolü bunu okur: bu block SADECE
    // 'text' kind'lı değişkenlere bağlanabilir, content'in hangi anahtara
    // yazılacağını da burada belirtir (bkz. ContextPanel Data tab).
    bindableField: { key: 'text', kind: 'text' },
    controls: [
      { key: 'color', label: 'Text color', type: 'color', default: '#111111' },
      { key: 'fontSize', label: 'Size', type: 'text', default: '16px' },
      {
        key: 'fontFamily',
        label: 'Font',
        type: 'select',
        default: '',
        options: [
          { value: '', label: 'Default' },
          { value: "'Montserrat', sans-serif", label: 'Montserrat' },
          { value: "'Fraunces', serif", label: 'Fraunces' },
        ],
      },
      {
        key: 'fontWeight',
        label: 'Weight',
        type: 'select',
        default: '400',
        options: [
          { value: '400', label: 'Regular' },
          { value: '500', label: 'Medium' },
          { value: '600', label: 'Semibold' },
          { value: '700', label: 'Bold' },
          { value: '800', label: 'Extrabold' },
        ],
      },
      {
        key: 'letterSpacing',
        label: 'Letter spacing',
        type: 'text',
        default: '',
        presets: [{ value: '-0.02em' }, { value: '0' }, { value: '0.02em' }, { value: '0.05em' }, { value: '0.1em' }],
      },
      { key: 'lineHeight', label: 'Line height', type: 'text', default: '', presets: [{ value: '1' }, { value: '1.2' }, { value: '1.4' }, { value: '1.6' }] },
      {
        key: 'textAlign',
        label: 'Align',
        type: 'select',
        default: 'left',
        options: [
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ],
      },
      {
        key: 'textTransform',
        label: 'Transform',
        type: 'select',
        default: 'none',
        options: [
          { value: 'none', label: 'None' },
          { value: 'uppercase', label: 'Uppercase' },
          { value: 'capitalize', label: 'Capitalize' },
        ],
      },
      {
        key: 'textDecoration',
        label: 'Decoration',
        type: 'text',
        default: '',
        presets: [{ value: 'none' }, { value: 'underline' }, { value: 'line-through' }, { value: 'underline dotted' }],
      },
      {
        key: 'textShadow',
        label: 'Text shadow',
        type: 'text',
        default: '',
        presets: [
          { value: '0 1px 2px rgba(0,0,0,.4)', label: 'Hafif' },
          { value: '0 2px 10px rgba(0,0,0,.6)', label: 'Derin' },
          { value: '0 0 12px currentColor', label: 'Glow' },
        ],
      },
      // Metin bloğu düz metin ya da (background+radius verilince) buton/
      // pill görünümü alabilir — ayrı bir BUTTON tipi icat edilmedi,
      // "excalidraw tarzı" tek esnek metin bloğu tercih edildi.
      { key: 'background', label: 'Background', type: 'color', default: '' },
      { key: 'borderRadius', label: 'Radius', type: 'text', default: '' },
      { key: 'borderColor', label: 'Border color', type: 'color', default: '' },
      { key: 'borderWidth', label: 'Border width', type: 'text', default: '', presets: [{ value: '1px' }, { value: '2px' }, { value: '3px' }, { value: '4px' }] },
      {
        key: 'borderStyle',
        label: 'Border style',
        type: 'select',
        default: 'solid',
        options: [
          { value: 'solid', label: 'Solid' },
          { value: 'dashed', label: 'Dashed' },
          { value: 'dotted', label: 'Dotted' },
          { value: 'double', label: 'Double' },
        ],
      },
      { key: 'rotate', label: 'Rotate (°)', type: 'slider', min: -180, max: 180, step: 1, default: 0 },
      { key: 'scale', label: 'Scale', type: 'slider', min: 0.5, max: 2, step: 0.05, default: 1 },
      { key: 'blur', label: 'Blur (px)', type: 'slider', min: 0, max: 20, step: 1, default: 0 },
      {
        key: 'mixBlendMode',
        label: 'Blend mode',
        type: 'select',
        default: 'normal',
        options: [
          { value: 'normal', label: 'Normal' },
          { value: 'multiply', label: 'Multiply' },
          { value: 'screen', label: 'Screen' },
          { value: 'overlay', label: 'Overlay' },
          { value: 'darken', label: 'Darken' },
          { value: 'lighten', label: 'Lighten' },
        ],
      },
      // Kullanıcı düzeltmesi: "style/effect kısmı block tipine göre
      // ayrılmasın, hepsi hepsini kullanabiliyor olsun" — RECTANGLE/DIAMOND/
      // CIRCLE'ın (SHAPE_CONTROLS) sahip olduğu ama TEXT'te eksik olan
      // jenerik görsel kontroller (transform/filter/cursor) buraya da
      // eklendi, TextRenderer'da da UYGULANIYOR (bkz. aşağıdaki style).
      {
        key: 'transform',
        label: 'Transform (gelişmiş)',
        type: 'text',
        default: '',
        presets: [{ value: 'skew(-8deg, 0)' }, { value: 'skewY(4deg)' }, { value: 'translateY(-6px)' }, { value: 'perspective(600px) rotateY(20deg)' }],
      },
      { key: 'filter', label: 'Filter (gelişmiş)', type: 'text', default: '', presets: FILTER_PRESETS },
      { key: 'cursor', label: 'Cursor', type: 'text', default: '', presets: CURSOR_PRESETS },
    ],
  });
  registerComponent('IMAGE', {
    name: 'Image',
    component: ImageRenderer,
    defaultContent: { imageUrl: null },
    defaultStyles: { borderRadius: 'var(--radius-sm)' },
    bindableField: { key: 'imageUrl', kind: 'image' },
    controls: [
      // Kullanıcı düzeltmesi: "style/effect kısmı block tipine göre
      // ayrılmasın, hepsi hepsini kullanabiliyor olsun" — RECTANGLE/DIAMOND/
      // CIRCLE'ın (SHAPE_CONTROLS) sahip olduğu ama IMAGE'da eksik olan
      // background/borderStyle/transform/cursor buraya da eklendi,
      // ImageRenderer'da da UYGULANIYOR (bkz. aşağıdaki style).
      { key: 'background', label: 'Background', type: 'color', default: '' },
      {
        key: 'borderRadius',
        label: 'Radius',
        type: 'select',
        default: 'var(--radius-sm)',
        options: [
          { value: '0', label: 'None' },
          { value: 'var(--radius-sm)', label: 'Small' },
          { value: 'var(--radius-md)', label: 'Medium' },
          { value: 'var(--radius-lg)', label: 'Large' },
          { value: '50%', label: 'Circle' },
        ],
      },
      { key: 'borderColor', label: 'Border color', type: 'color', default: '' },
      { key: 'borderWidth', label: 'Border width', type: 'text', default: '', presets: [{ value: '1px' }, { value: '2px' }, { value: '3px' }, { value: '4px' }] },
      {
        key: 'borderStyle',
        label: 'Border style',
        type: 'select',
        default: 'solid',
        options: [
          { value: 'solid', label: 'Solid' },
          { value: 'dashed', label: 'Dashed' },
          { value: 'dotted', label: 'Dotted' },
          { value: 'double', label: 'Double' },
        ],
      },
      {
        key: 'objectFit',
        label: 'Fit',
        type: 'select',
        default: 'cover',
        options: [
          { value: 'cover', label: 'Cover' },
          { value: 'contain', label: 'Contain' },
          { value: 'fill', label: 'Fill' },
          { value: 'none', label: 'None' },
        ],
      },
      { key: 'rotate', label: 'Rotate (°)', type: 'slider', min: -180, max: 180, step: 1, default: 0 },
      { key: 'scale', label: 'Scale', type: 'slider', min: 0.5, max: 2, step: 0.05, default: 1 },
      { key: 'blur', label: 'Blur (px)', type: 'slider', min: 0, max: 20, step: 1, default: 0 },
      {
        key: 'mixBlendMode',
        label: 'Blend mode',
        type: 'select',
        default: 'normal',
        options: [
          { value: 'normal', label: 'Normal' },
          { value: 'multiply', label: 'Multiply' },
          { value: 'screen', label: 'Screen' },
          { value: 'overlay', label: 'Overlay' },
          { value: 'darken', label: 'Darken' },
          { value: 'lighten', label: 'Lighten' },
        ],
      },
      {
        key: 'transform',
        label: 'Transform (gelişmiş)',
        type: 'text',
        default: '',
        presets: [{ value: 'skew(-8deg, 0)' }, { value: 'skewY(4deg)' }, { value: 'translateY(-6px)' }, { value: 'perspective(600px) rotateY(20deg)' }],
      },
      { key: 'filter', label: 'Filter (gelişmiş)', type: 'text', default: '', presets: FILTER_PRESETS },
      { key: 'cursor', label: 'Cursor', type: 'text', default: '', presets: CURSOR_PRESETS },
    ],
  });
}
