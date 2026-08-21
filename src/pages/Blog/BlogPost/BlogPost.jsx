import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLocalizedNavigate as useNavigate } from '../../../shared/i18n/useLocalizedNavigate';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Footer } from '../../../components/Footer/Footer';
import { RelatedContent } from '../../../components/RelatedContent/RelatedContent';
import { theme } from '../../series/GameOfThrones/GameOfThrones.data';
import {
  armBlogReturn,
  readBlogFlip,
  blogExpandedBox,
  rememberBlogOrigin,
  recallBlogOrigin,
} from '../../../motion/cinematic';
import { getBlogDetail, getAdjacentBlogs } from './BlogPost.data';
import { TagChips } from './TagChips/TagChips';
import { PostActions } from './PostActions/PostActions';
import { Comments } from './Comments/Comments';
import { ArticleNav } from './ArticleNav/ArticleNav';
import styles from './BlogPost.module.css';

gsap.registerPlugin(ScrollTrigger);

// Alt yazı konumu (sağ/sol/orta) görsel bloğun SIRASINA göre döngüsel seçilir
// — kullanıcı isteği: "content'e göre", art arda gelen görseller aynı köşede
// yığılmasın. Konum, giriş animasyonunun yönünü de belirler (bkz. aşağıdaki
// GSAP effect'i): sağ→sağdan kayar, sol→soldan kayar, orta→aşağıdan yükselir.
const CAPTION_POSITIONS = ['right', 'left', 'center'];

// Serbest canvas konumu — x/y/width yüzde (0-100), height opsiyonel yüzde
// (null = içeriğe göre otomatik, CSS height:auto). learned-rules
// [blog-blok-pozisyon]: editördeki BlockItem ile AYNI koordinat sistemi.
// isLegacyLayout=true iken (x/y/width/height'i olmayan eski blog) HİÇ
// pozisyon stili dönmez — blok normal akışta kalır (bkz. .story__legacyBody),
// çakışma riski sıfır (kullanıcı raporu: tahmini y hesabı "imagelerin
// üstüne çakışıyor"du).
const blockPositionStyle = (block, isLegacy) => {
  // --block-font-scale: legacy/modern fark etmeksizin uygulanır (editördeki
  // BlockItem ile AYNI CSS değişkeni, bkz. BlogPost.module.css).
  const fontScale = { '--block-font-scale': block.fontScale ?? 1 };
  if (isLegacy) return fontScale;
  return {
    ...fontScale,
    position: 'absolute',
    left: `${block.x}%`,
    top: `${block.y}%`,
    width: `${block.width}%`,
    height: block.height != null ? `${block.height}%` : undefined,
  };
};

// Marka bütünlüğü için AÇIK font seçici değil, editördeki (BlockItem)
// sabit üç seçenekle AYNI liste — learned-rules: "Fandoom marka fontu
// Montserrat KALIR".
const FONT_CLASS = {
  GOT: styles.fontGot,
  FRAUNCES: styles.fontFraunces,
  MONTSERRAT: styles.fontMontserrat,
};
const fontClassOf = (block) => (block.fontFamily ? FONT_CLASS[block.fontFamily] : undefined);

// Dive Deeper carousel'inden (RelatedContent) devralınan bağımsız Blog yazısı
// sayfası. Zemin DÜZ SİYAH — arka plan görseli yok (kullanıcı kararı).
//
// KESİNTİSİZ DEVİR: kaynak sayfadaki büyüyen klon document.body'de yaşadığı
// için route değişiminde silinmez, ekranda durmaya devam eder. Bu sayfa kendi
// kutusunu TAM AYNI geometride (blogExpandedBox — tek kaynak) çizer ve
// görseli yüklenir yüklenmez klonu kaldırır. İki kare arasında görsel fark
// olmadığından sayfa değişimi algılanmaz.
export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const imageRef = useRef(null);
  const boxRef = useRef(null);
  const storyRef = useRef(null);
  // Devirle mi geldik? Öyleyse klon ekranı zaten dolduruyor — bu sayfanın
  // kendi giriş fade'i OLMAMALI (üst üste binip yanıp sönme yaratırdı).
  // Geri dönüş için gereken originRect/returnScrollY de burada saklanır
  // (readBlogFlip zaman pencereli, sonra okunamaz).
  const [flip] = useState(() => readBlogFlip());
  const handoff = Boolean(flip);
  const [ready, setReady] = useState(!handoff);

  // Kutu ölçüsü kaynak sayfayla AYNI formülden gelir; resize'da güncellenir.
  const [box, setBox] = useState(() => blogExpandedBox());

  // Spoiler gate — tıkla-aç (hover DEĞİL, [topluluk-spoiler] kuralı). Her
  // slug için sıfırdan kapalı başlar; slug değişince (App.jsx'teki key={slug}
  // remount'u sayesinde) component sıfırdan mount olur, bu state de sıfırlanır.
  const [revealed, setRevealed] = useState(false);
  // Önceki/sonraki yazı — ayrı bir çağrı (getAdjacentBlogs), null iken
  // ArticleNav hiçbir şey basmaz.
  const [adjacent, setAdjacent] = useState({ previous: null, next: null });
  useEffect(() => {
    const onResize = () => setBox(blogExpandedBox());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Backend'den detay çekilir — yalnız PUBLISHED döner, çağrı viewCount'u
  // artırır. slug değişince (App.jsx'teki key={slug} remount'u) component
  // sıfırdan mount olur, bu effect de sıfırdan çalışır.
  useEffect(() => {
    let cancelled = false;
    getBlogDetail(slug)
      .then((data) => {
        if (!cancelled) setItem(data);
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true);
          // Karttan devirle (flip) girildiyse tam ekran klon zaten body'ye
          // eklenmiş olabilir — hero hiç mount olmayacağı için (aşağıdaki
          // notFound erken dönüşü) normal temizlik (bkz. takeOver aşağıda)
          // hiç tetiklenmez ve klon ekranda kalıcı asılı kalırdı (kullanıcı
          // raporu: "sadece ana image görünüyor").
          document.querySelectorAll('body > [data-blog-flip]').forEach((el) => el.remove());
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    setAdjacent({ previous: null, next: null });
    getAdjacentBlogs(slug).then((data) => {
      if (!cancelled) setAdjacent(data);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // GoT tema rengini basar — içerik şimdilik yalnız GoT'tan geldiği için
  // (EpisodePage ile aynı desen). Blog çok-yapımlı bir yüzeye dönüşünce tema
  // kaynağı da parametrik olmalı; kapsam dışı, teslim özetinde raporlanır.
  useEffect(() => {
    const root = document.documentElement;
    const prev = {
      bg: root.style.getPropertyValue('--bg'),
      accent: root.style.getPropertyValue('--accent'),
      cardBg: root.style.getPropertyValue('--card-bg'),
    };
    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--card-bg', theme.cardBg);
    return () => {
      root.style.setProperty('--bg', prev.bg || '#050505');
      root.style.setProperty('--accent', prev.accent || '#a02cd8');
      root.style.setProperty('--card-bg', prev.cardBg || '#101012');
    };
  }, []);

  // Klonu KALDIRMA anı: bu sayfanın görseli boyanmaya hazır olduğunda.
  // Erken kaldırmak (mount'ta) bir kare boşluk bırakır — devrin tek görünür
  // hatası bu olurdu. Görsel w780 → w1920'ye yükseldiği için `decode()`
  // beklenir; desteklenmeyen/başarısız durumda load olayına düşer.
  useLayoutEffect(() => {
    if (!handoff) return undefined;
    const img = imageRef.current;
    if (!img) return undefined;

    let cancelled = false;
    const takeOver = () => {
      if (cancelled) return;
      setReady(true);
      // Klon ve perde React'in dışında, kaynak sayfada oluşturuldu —
      // seçiciyle bulunup kaldırılır (ikisi de body'nin doğrudan çocuğu).
      document.querySelectorAll('body > [data-blog-flip]').forEach((el) => el.remove());
    };

    Promise.resolve()
      .then(() => (img.decode ? img.decode() : Promise.reject(new Error('no decode'))))
      .then(takeOver)
      .catch(() => {
        if (img.complete) takeOver();
        else {
          img.onload = takeOver;
          img.onerror = takeOver;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [handoff, item]);

  // Gövde metninin scroll motion'ı — EpisodeStory'nin (bölüm sayfası derin-
  // analizi) imzasının BİREBİR aynısı, kullanıcı isteğiyle buraya taşındı:
  // başlık scroll'a bağlı (linear, scrub) aşağıdan yükselip belirir, alıntı
  // çizgisi soldan süpürülüp metin soldan kayar, görsel masaüstünde hafif
  // dikey parallax alır. Gövde metni (paragraf) HİÇ animasyon almaz —
  // EpisodeStory'de de statik akıyor.
  useLayoutEffect(() => {
    if (!item || !storyRef.current) return undefined;

    const ctx = gsap.context((self) => {
      const mm = gsap.matchMedia();
      const blockEls = self.selector('[data-story-block]');
      const quoteBlocks = self.selector('[data-story-quote]');
      const images = self.selector('[data-story-image]');
      const captions = self.selector('[data-story-caption]');

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Blok girişi editörden seçilen animasyona göre (learned-rules
        // [blog-blok-pozisyon] — kullanıcı kararı: "componentlerin
        // animasyonlarını control edebilmem lazım"). PINNED, canvas serbest
        // konumlu olduğu için pinSpacing:false ile (boşluk eklemez, diğer
        // blokların pozisyonunu bozmaz) sabit bir süre (~400px) sabitlenir.
        blockEls.forEach((el) => {
          const animation = el.dataset.animation || 'FADE_UP';
          if (animation === 'NONE') {
            gsap.set(el, { opacity: 1 });
            return;
          }
          if (animation === 'PINNED') {
            ScrollTrigger.create({
              trigger: el,
              start: 'top top+=96',
              end: '+=400',
              pin: true,
              pinSpacing: false,
            });
            return;
          }
          const from =
            animation === 'FADE_LEFT'
              ? { opacity: 0, x: -64 }
              : animation === 'FADE_RIGHT'
                ? { opacity: 0, x: 64 }
                : { opacity: 0, y: 64 };
          gsap.fromTo(el, from, {
            opacity: 1,
            x: 0,
            y: 0,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 62%', scrub: 1.2 },
          });
        });

        quoteBlocks.forEach((block) => {
          const rule = block.querySelector('[data-story-quote-rule]');
          const text = block.querySelector('[data-story-quote-text]');
          gsap
            .timeline({
              scrollTrigger: { trigger: block, start: 'top bottom', end: 'top 55%', scrub: 1.2 },
            })
            .fromTo(rule, { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 0.45 }, 0)
            .fromTo(
              text,
              { opacity: 0, x: -48 },
              { opacity: 1, x: 0, ease: 'none', duration: 0.55 },
              0.3,
            );
        });

        // Alt yazı köşeye yapışık duruyor (rotasyon YOK), konumuna göre
        // (data-caption-pos — bkz. CAPTION_POSITIONS) o yönden kayarak
        // açığa çıkar: sağ→sağdan, sol→soldan, orta→aşağıdan.
        captions.forEach((caption) => {
          const pos = caption.dataset.captionPos;
          const from = pos === 'left' ? { x: -48 } : pos === 'center' ? { y: 32 } : { x: 48 };
          const to = pos === 'center' ? { y: 0 } : { x: 0 };
          gsap.fromTo(
            caption,
            { opacity: 0, ...from },
            {
              opacity: 1,
              ...to,
              ease: 'none',
              scrollTrigger: { trigger: caption, start: 'top bottom', end: 'top 65%', scrub: 1.2 },
            },
          );
        });
      });

      // Parallax yalnız masaüstünde — EpisodeStory'deki 900px eşiğiyle AYNI.
      mm.add(
        { motionOk: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 901px)' },
        (mmCtx) => {
          const { motionOk, desktop } = mmCtx.conditions;
          if (!motionOk || !desktop) return;

          images.forEach((image) => {
            gsap.fromTo(
              image,
              { yPercent: -3.5 },
              {
                yPercent: 3.5,
                ease: 'none',
                scrollTrigger: {
                  trigger: image.closest('figure') ?? image,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              },
            );
          });
        },
      );

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(blockEls, { opacity: 1, x: 0, y: 0 });
        quoteBlocks.forEach((block) => {
          gsap.set(block.querySelector('[data-story-quote-rule]'), { scaleX: 1 });
          gsap.set(block.querySelector('[data-story-quote-text]'), { opacity: 1, x: 0 });
        });
        gsap.set(captions, { opacity: 1, x: 0, y: 0 });
      });
    }, storyRef);

    return () => ctx.revert();
  }, [item]);

  // GERİ DÖNÜŞ: sayfanın en üstündeyken YUKARI SCROLL (açılışın karşılığı) ya
  // da Back butonu. Kutu, geldiği kartın dikdörtgenine geri küçülür — ama bu
  // küçülme burada DEĞİL, kaynak sayfa yerine oturduktan sonra orada oynar
  // (açılışın tam aynası: orada kutu büyürken perde kapanıyordu, dönüşte perde
  // açılırken kutu küçülür). Klon document.body'de olduğu için route
  // değişimini sağ atlatır.
  const closingRef = useRef(false);

  const goBack = () => {
    if (closingRef.current) return;
    closingRef.current = true;

    const back = () => {
      armBlogReturn({
        scrollLeft: flip?.returnScrollLeft ?? 0,
        scrollY: flip?.returnScrollY ?? 0,
        // Küçülme BURADA oynatılmaz — kaynak sayfa yerine oturduktan sonra
        // orada oynar (açılışın tam aynası olsun diye). originIndex ile kartın
        // GERÇEK konumu orada yeniden ölçülür; originRect yalnız yedektir.
        originRect: flip?.originRect ?? null,
        originIndex: flip?.originIndex ?? -1,
        // Blog hub'da (SpotlightCard + TopBlogsRow) İKİ ayrı flip kaynağı
        // aynı sayfada bulunabiliyor — bu ayırt edici olmadan ikisi de aynı
        // dönüş verisini kendine mal edip yanlış/duplicate restore yapardı.
        originComponent: flip?.originComponent ?? null,
      });
      // navigate(-1) DEĞİL: geçmişte geri gitmek tarayıcının scroll
      // geri-yüklemesini tetikleyip kaynak sayfanın kendi konumlandırmasını
      // eziyordu. `replace` hem bunu önler hem geçmişte Blog sayfası
      // bırakmaz.
      navigate(flip?.returnPath ?? -1, { replace: true });
    };

    const boxEl = boxRef.current;
    const target = flip?.originRect;
    if (!boxEl || !target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      back();
      return;
    }

    const rect = boxEl.getBoundingClientRect();

    // Klon, kutunun BULUNDUĞU yerde kurulur ve öyle KALIR — küçülmesi kaynak
    // sayfada oynayacak. Burada yalnız perde siyaha çekilir: bu sayfanın
    // kendi yazıları sönsün ve altında sayfa değişimi görünmesin diye.
    const scrim = document.createElement('div');
    scrim.dataset.blogFlip = '';
    scrim.style.cssText =
      'position:fixed;inset:0;z-index:69;background:#000;opacity:0;pointer-events:none;';
    document.body.appendChild(scrim);

    const clone = document.createElement('img');
    clone.dataset.blogFlip = '';
    clone.src = imageRef.current?.currentSrc || item.imageUrl;
    clone.alt = '';
    clone.style.cssText =
      `position:fixed;z-index:70;object-fit:cover;pointer-events:none;` +
      `top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;` +
      `border-radius:var(--radius-lg);box-shadow:0 0 50px rgba(0,0,0,0.35);`;
    document.body.appendChild(clone);

    // Gerçek kutu gizlenir ki klonla üst üste binmesin.
    gsap.set(boxEl, { opacity: 0 });

    // Kısa bir kararma, sonra devir. Küçülme + perdenin AÇILMASI kaynak
    // sayfada oynar (bkz. RelatedContent) — açılışın tam aynası: orada kutu
    // büyürken perde kapanıyordu, burada perde açılırken kutu küçülür.
    gsap.to(scrim, { opacity: 1, duration: 0.2, ease: 'power2.out', onComplete: back });
  };

  // Yukarı scroll ile dönüş — açılışın (aşağı scroll ile büyütme) karşılığı.
  // Yalnız sayfanın en üstünde devreye girer; aşağıda normal scroll çalışır.
  // Back butonu ayrıca durur: scroll-hijack klavyeyle erişilebilir değil.
  const goBackRef = useRef(goBack);
  goBackRef.current = goBack;

  useEffect(() => {
    if (!flip?.originRect) return undefined;

    const onWheel = (e) => {
      if (e.deltaY < 0 && window.scrollY <= 5) {
        e.preventDefault();
        goBackRef.current();
      }
    };
    let touchY = 0;
    const onTouchStart = (e) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      if (!touchY) return;
      if (e.touches[0].clientY - touchY > 20 && window.scrollY <= 5) {
        e.preventDefault();
        goBackRef.current();
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [flip]);

  if (notFound) {
    return (
      <>
        <div className={styles.notfound}>
          <h1 className={styles.notfound__title}>Content not found.</h1>
        </div>
        <Footer />
      </>
    );
  }

  if (!item) return null;

  // Render sırasında sıfırlanan sayaç — CAPTION_POSITIONS'ı görsel bloklar
  // arasında döngüsel dağıtır (blocks.map içindeki IMAGE case'inde artar).
  let imageOrdinal = 0;

  return (
    <>
      <section className={styles.hero}>
        {/* Geri dönüş TIKLAMAYLA (kullanıcı kararı) — kutu geldiği kartın
            yerine küçülerek kapanır. */}
        <button type="button" className={styles.back} onClick={goBack}>
          <span aria-hidden="true">&#8249;</span>
          <span>Back</span>
        </button>

        {/* Kutu, klonun bıraktığı yerin AYNISI: viewport'ta dikey ortalı,
            blogExpandedBox ölçüsünde, aynı radius/gölge. */}
        <div
          className={styles.hero__box}
          ref={boxRef}
          style={{ width: `${box.width}px`, height: `${box.height}px`, opacity: ready ? 1 : 0 }}
        >
          <img
            ref={imageRef}
            className={styles.hero__image}
            src={item.imageUrl}
            alt={item.imageAlt}
            fetchPriority="high"
          />
        </div>

        <div
          className={styles.hero__caption}
          style={{ width: `${box.width}px`, opacity: ready ? 1 : 0 }}
        >
          {/* kicker = editörün yazdığı serbest başlık (ör. "SEASON 6 ·
              EPISODE 9 BEHIND THE SCENES"), bölüm/tag verisine bağımlı
              DEĞİL — bölümden bağımsız içerikte de anlamlı kalır. */}
          {item.kicker && <p className={styles.hero__kicker}>{item.kicker}</p>}
          <h1 className={styles.hero__title}>{item.title}</h1>
          {item.axis && <p className={styles.hero__axis}>{item.axis}</p>}

          {/* Yayın tarihi + okuma süresi — ikisi de backend'de vardı, hiç
              gösterilmiyordu ("blog gibi hissettirsin" kullanıcı isteği). */}
          {(item.publishedAt || item.readingTimeMinutes != null) && (
            <p className={styles.hero__meta}>
              {[
                item.publishedAt &&
                  new Date(item.publishedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }),
                item.readingTimeMinutes != null && `${item.readingTimeMinutes} min read`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}

          <TagChips tags={item.tags} />
        </div>

      </section>

      <article className={styles.story} ref={storyRef}>
        <div
          className={`${styles.story__bodyWrap} ${item.isLegacyLayout ? styles.story__bodyWrapLegacy : ''}`}
          style={item.isLegacyLayout ? undefined : { height: `${item.canvasHeight}px` }}
          data-gated={(Boolean(item.spoilerThrough) && !revealed) || undefined}
        >
          {item.blocks.map((block) => {
            switch (block.blockType) {
              case 'HEADING':
                return (
                  <h2
                    key={block.id}
                    className={`${styles.story__heading} ${item.isLegacyLayout ? styles.legacyText : ''} ${fontClassOf(block) ?? ''}`}
                    style={blockPositionStyle(block, item.isLegacyLayout)}
                    data-story-heading=""
                    data-story-block=""
                    data-animation={block.animation ?? 'FADE_UP'}
                  >
                    {block.text}
                  </h2>
                );
              case 'QUOTE':
                return (
                  <blockquote
                    key={block.id}
                    className={`${styles.story__quote} ${item.isLegacyLayout ? styles.legacyText : ''} ${fontClassOf(block) ?? ''}`}
                    style={blockPositionStyle(block, item.isLegacyLayout)}
                    data-story-quote=""
                    data-story-block=""
                    data-animation={block.animation ?? 'FADE_UP'}
                  >
                    <span className={styles.story__quoteRule} data-story-quote-rule="" aria-hidden="true" />
                    <span
                      className={block.dropCap ? styles.dropCap : undefined}
                      data-story-quote-text=""
                    >
                      {block.text}
                    </span>
                  </blockquote>
                );
              case 'IMAGE': {
                const captionPos = CAPTION_POSITIONS[imageOrdinal % CAPTION_POSITIONS.length];
                imageOrdinal += 1;
                return (
                  <figure
                    key={block.id}
                    className={`${styles.story__figure} ${item.isLegacyLayout ? styles.legacyImage : ''}`}
                    style={blockPositionStyle(block, item.isLegacyLayout)}
                    data-story-block=""
                    data-animation={block.animation ?? 'FADE_UP'}
                  >
                    <img
                      className={styles.story__figureImage}
                      data-story-image=""
                      src={block.imageUrl}
                      alt={block.imageAlt ?? ''}
                      loading="lazy"
                      decoding="async"
                    />
                    {block.imageAlt && (
                      <figcaption
                        className={styles.story__figcaption}
                        data-story-caption=""
                        data-caption-pos={captionPos}
                      >
                        {block.imageAlt}
                      </figcaption>
                    )}
                  </figure>
                );
              }
              case 'PARAGRAPH':
              default:
                return (
                  <p
                    key={block.id}
                    className={`${styles.story__body} ${item.isLegacyLayout ? styles.legacyText : ''} ${fontClassOf(block) ?? ''} ${block.dropCap ? styles.dropCap : ''}`}
                    style={blockPositionStyle(block, item.isLegacyLayout)}
                    data-story-block=""
                    data-animation={block.animation ?? 'FADE_UP'}
                  >
                    {block.text}
                  </p>
                );
            }
          })}

          {item.spoilerThrough && !revealed && (
            <div className={styles.spoilerGate}>
              <p className={styles.spoilerGate__label}>Spoiler warning</p>
              <p className={styles.spoilerGate__hint}>
                Contains details through Season {item.spoilerThrough.seasonNumber}, Episode{' '}
                {item.spoilerThrough.episodeNumber}
              </p>
              <button
                type="button"
                className={styles.spoilerGate__button}
                onClick={() => setRevealed(true)}
              >
                Reveal
              </button>
            </div>
          )}
        </div>
      </article>

      {/* Beğen/kaydet/paylaş — makale bitince "okudun mu, paylaş" (kullanıcı
          kararı): hero'nun resim üzerinde yüzen reels-tarzı rayı yerine
          makale sonunda, ArticleNav'ın üstünde yatay bir sıra. */}
      <div className={styles.storyActions}>
        <PostActions
          id={item.id}
          shareTitle={item.title}
          shareUrl={`${window.location.origin}/blog/${item.slug}`}
        />
      </div>

      <ArticleNav previous={adjacent.previous} next={adjacent.next} />

      <Comments />

      <RelatedContent items={item.relatedBlogs} />

      <Footer />
    </>
  );
}
