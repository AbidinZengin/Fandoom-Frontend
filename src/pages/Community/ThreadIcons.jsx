import commentIcon from '../../assets/icons/comment.png';
import linkIcon from '../../assets/icons/link.png';

// Thread kartlarının ortak çizgi-ikonları (FeedCard, ThreadBody). Harici ikon
// paketi yok (yeni paket eklenmez) — inline SVG, boyut font-size'la (1em)
// yönetilir, renk currentColor. `filled` aktif durumu (beğenildi/kaydedildi).
const BASE = {
  width: '1em',
  height: '1em',
  viewBox: '0 0 24 24',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

// Yorum ve bağlantı ikonları kullanıcının kendi PNG asset'leridir (2026-09-21) —
// siyah çizgili görseller. Siyah PNG koyu zeminde görünmez ve durumlara göre
// renk almaz, bu yüzden görselin ALFA KANALI maske olarak kullanılır, boya
// currentColor'dır (diğer çizgi ikonlarıyla aynı soluk/belirgin davranış).
// Boyut yine font-size'dan (1em); komşu stiller bu ikonları `[data-icon]` ile
// yakalar (svg seçicisi span'e uymaz).
function MaskIcon({ name, src }) {
  const mask = `url(${src})`;
  return (
    <span
      data-icon={name}
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: '1em',
        height: '1em',
        flexShrink: 0,
        backgroundColor: 'currentColor',
        maskImage: mask,
        WebkitMaskImage: mask,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
  );
}

export function CommentIcon() {
  return <MaskIcon name="comment" src={commentIcon} />;
}

// Paylaş = bağlantıyı kopyala (backend'de paylaşım sayacı yok), bu yüzden ikon zincir.
export function LinkIcon() {
  return <MaskIcon name="link" src={linkIcon} />;
}

export function HeartIcon({ filled }) {
  return (
    <svg {...BASE} fill={filled ? 'currentColor' : 'none'}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

export function BookmarkIcon({ filled }) {
  return (
    <svg {...BASE} fill={filled ? 'currentColor' : 'none'}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function ImageIcon() {
  return (
    <svg {...BASE} fill="none">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

export function MoreIcon() {
  return (
    <svg {...BASE} fill="currentColor" stroke="none">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

export function BoldIcon() {
  return (
    <svg {...BASE} fill="none">
      <path d="M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z" />
    </svg>
  );
}

export function ItalicIcon() {
  return (
    <svg {...BASE} fill="none">
      <path d="M19 4h-9M14 20H5M15 4L9 20" />
    </svg>
  );
}

// Spoiler = "gizli göz" (eye-off).
export function SpoilerIcon() {
  return (
    <svg {...BASE} fill="none">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22" />
    </svg>
  );
}

// Onay / vazgeç (composer bağlantı girdisi): metin glyph'i çok ince kaldığı için
// çizgi ikon, diğerlerinden bir tık kalın (2).
export function CheckIcon() {
  return (
    <svg {...BASE} strokeWidth={2} fill="none">
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg {...BASE} strokeWidth={2} fill="none">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function ArrowUpIcon() {
  return (
    <svg {...BASE} fill="none">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export function ChevronIcon() {
  return (
    <svg {...BASE} fill="none">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function StarIcon() {
  return (
    <svg {...BASE} fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// Kalem ucu — composer başlık satırının sağ ucu. Kullanıcının kendi pen-nib.svg'si
// (2026-09-21), dolgulu tek path; BASE'teki stroke kapatılır, renk currentColor.
export function PenNibIcon() {
  return (
    <svg {...BASE} stroke="none" fill="currentColor">
      <path d="m23.707,8.707l-2.293,2.293L13,2.586,15.293.293c.391-.391,1.023-.391,1.414,0l7,7c.391.391.391,1.023,0,1.414ZM11.19,3.604l-4.605,1.703c-1.488.551-2.637,1.791-3.073,3.317L.111,20.545c-.18.612-.134,1.254.109,1.821l7.848-7.848c-.044-.165-.068-.339-.068-.518,0-1.105.895-2,2-2s2,.895,2,2-.895,2-2,2c-.179,0-.353-.024-.518-.068l-7.848,7.848c.335.144.696.219,1.061.219.251,0,.504-.035.751-.108l11.884-3.377c1.521-.432,2.76-1.574,3.315-3.054l1.746-4.655L11.19,3.604Z" />
    </svg>
  );
}
