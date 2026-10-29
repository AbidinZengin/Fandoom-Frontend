import { useEffect, useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import { CommentIcon, HeartIcon } from '../../../Community/ThreadIcons';
import { formatCount } from '../../../Community/formatCount';
import { threadPath } from '../../../Community/threadLink';
import { Cover } from '../Cover/Cover';
import styles from './PeekCard.module.css';

const OPEN_SECONDS = 0.8;
const CLOSE_SECONDS = 0.7;
const MAX_W = 960;
const MAX_H = 680;
// Görselsiz (yalnız metin) kart geniş bir boşluk olmasın diye daha dar kalır.
const MAX_W_TEXT = 640;
// İçerik (başlık + özet + alt satır) sığsın diye kartın alt sınırı.
const MIN_H = 360;
// Görselin oranı bu aralıkta kalır; görselsiz/ölçüsüz thread varsayılan oranı kullanır.
const RATIO_MIN = 0.62;
const RATIO_MAX = 2.2;
const RATIO_DEFAULT = 1.5;
// Bu yüksekliğin altında kart "kompakt" olur (özet kısalır).
const COMPACT_H = 440;
const EDGE = 16;
// Sticky navbar'ın altında kalmasın (mobilde navbar görünür olabiliyor).
const NAVBAR_CLEARANCE = 72;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Vitrin kartına tıklayınca kartın yerinden kalkıp bölümün ortasına gelen büyük
// kart (PosterWall'daki "öne gelen kart" fikri). Kapanışta kartın CANLI konumuna
// geri uçar (sayfa kaydıysa bile doğru yere iner). Boyutlar px olarak GSAP'te
// animasyonlanır; içerik, kart oturduktan sonra fade-in eder (yeniden akış yok).
export function PeekCard({ thread, ratio, like, onToggleLike, sectionRef, getSourceRect, onClosed }) {
  const { t } = useTranslation();
  const cardRef = useRef(null);
  const contentRef = useRef(null);
  const backdropRef = useRef(null);
  const closeBtnRef = useRef(null);
  const closingRef = useRef(false);
  const tweenRef = useRef(null);
  const image = thread.media?.[0]?.type === 'IMAGE' ? thread.media[0].url : null;

  // Hedef: bölümün içinde, görünür alanın ortası (sayfa kaymış olsa da ekranda kalır).
  const targetRect = () => {
    const sec = sectionRef.current.getBoundingClientRect();
    const viewTop = -sec.top + NAVBAR_CLEARANCE;
    const viewHeight = window.innerHeight - NAVBAR_CLEARANCE - EDGE;
    const availW = Math.min(image ? MAX_W : MAX_W_TEXT, sec.width - EDGE * 2);
    const availH = Math.min(MAX_H, viewHeight, sec.height - EDGE * 2);
    // Kart görselin KENDİ oranında: dikey görsel dikey, yatay görsel yatay kart.
    const r = Math.min(RATIO_MAX, Math.max(RATIO_MIN, image ? ratio ?? RATIO_DEFAULT : RATIO_DEFAULT));
    const width = Math.min(availW, availH * r);
    const height = Math.min(availH, Math.max(MIN_H, width / r));
    const wantedTop = viewTop + (viewHeight - height) / 2;
    const top = Math.max(EDGE, Math.min(wantedTop, sec.height - height - EDGE));
    return { left: (sec.width - width) / 2, top, width, height };
  };

  useLayoutEffect(() => {
    const from = getSourceRect();
    const to = targetRect();
    cardRef.current.dataset.compact = to.height < COMPACT_H ? 'true' : 'false';
    const instant = reducedMotion();
    const ctx = gsap.context(() => {
      gsap.set(cardRef.current, { ...(from ?? to), opacity: 1 });
      gsap.set(contentRef.current, { opacity: 0, y: 12 });
      gsap.set(backdropRef.current, { opacity: 0 });
      const d = instant ? 0 : OPEN_SECONDS;
      gsap
        .timeline({ defaults: { ease: 'power3.inOut' } })
        .to(backdropRef.current, { opacity: 1, duration: instant ? 0 : 0.5 }, 0)
        .to(cardRef.current, { ...to, duration: d }, 0)
        .to(contentRef.current, { opacity: 1, y: 0, duration: instant ? 0 : 0.5, ease: 'power3.out' }, instant ? 0 : 0.55);
    });
    closeBtnRef.current?.focus();
    return () => ctx.revert();
    // Yalnız açılışta çalışır: kaynak/hedef o anki ölçüden alınır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    const card = cardRef.current;
    const instant = reducedMotion();
    if (instant || !getSourceRect()) {
      gsap.to([card, backdropRef.current], { opacity: 0, duration: instant ? 0 : 0.4, onComplete: onClosed });
      return;
    }

    gsap.killTweensOf([card, contentRef.current, backdropRef.current]);
    const start = {
      left: gsap.getProperty(card, 'left'),
      top: gsap.getProperty(card, 'top'),
      width: gsap.getProperty(card, 'width'),
      height: gsap.getProperty(card, 'height'),
    };
    gsap.to(contentRef.current, { opacity: 0, duration: 0.2 });
    gsap.to(backdropRef.current, { opacity: 0, duration: CLOSE_SECONDS, ease: 'power2.inOut' });

    // Kaynak kart sayfa kaydıkça yer değiştirir: hedef her karede yeniden ölçülür.
    const progress = { p: 0 };
    const mix = (a, b) => a + (b - a) * progress.p;
    tweenRef.current = gsap.to(progress, {
      p: 1,
      duration: CLOSE_SECONDS,
      ease: 'power3.inOut',
      onUpdate: () => {
        const to = getSourceRect();
        if (!to) return;
        gsap.set(card, {
          left: mix(start.left, to.left),
          top: mix(start.top, to.top),
          width: mix(start.width, to.width),
          height: mix(start.height, to.height),
        });
      },
      onComplete: onClosed,
    });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Unmount'ta yarım kalan tween'i öldür (StrictMode/route değişimi güvenliği).
  useEffect(() => () => tweenRef.current?.kill(), []);

  return (
    <>
      <div ref={backdropRef} className={styles.peek__backdrop} onClick={close} aria-hidden="true" />
      <div
        ref={cardRef}
        className={styles.peek}
        role="dialog"
        aria-modal="true"
        aria-label={thread.title}
        data-image={image ? 'true' : undefined}
      >
        {image && <Cover src={image} className={styles.peek__image} />}

        <div ref={contentRef} className={styles.peek__content}>
          <button
            ref={closeBtnRef}
            type="button"
            className={styles.peek__close}
            aria-label={t('account.profile.closeModal')}
            onClick={close}
          >
            ×
          </button>

          <div className={styles.peek__text}>
            {thread.portal?.slug && (
              <Link to={`/portal/${thread.portal.slug}`} className={styles.peek__portal}>
                {thread.portal.name}
              </Link>
            )}
            <h3 className={styles.peek__title}>{thread.title}</h3>
            {thread.excerpt && <p className={styles.peek__excerpt}>{thread.excerpt}</p>}

            <div className={styles.peek__footer}>
              <div className={styles.peek__meta}>
                {thread.author?.username && <span>@{thread.author.username}</span>}
                <button
                  type="button"
                  className={styles.peek__like}
                  aria-pressed={like.liked}
                  onClick={() => onToggleLike(thread)}
                >
                  <HeartIcon filled={like.liked} />
                  {formatCount(like.count)}
                </button>
                <span className={styles.peek__stat}>
                  <CommentIcon />
                  {formatCount(thread.commentCount)}
                </span>
              </div>
              <Link to={threadPath(thread)} className={styles.peek__cta}>
                {t('community.feed.readMore')} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
