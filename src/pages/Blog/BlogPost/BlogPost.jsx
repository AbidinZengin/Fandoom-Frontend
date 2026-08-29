import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedNavigate as useNavigate } from '../../../shared/i18n/useLocalizedNavigate';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Footer } from '../../../components/Footer/Footer';
import { ContentActions } from '../../../components/ContentActions/ContentActions';
import { RelatedContent } from '../../../components/RelatedContent/RelatedContent';
import { getStoredAuth } from '../../../shared/api/authStorage';
import { getMySavedItemStatus, addToList, updateSavedItemProgress } from '../../../shared/api/account';
import { theme as gotTheme } from '../../series/GameOfThrones/GameOfThrones.data';
import { theme as bbTheme } from '../../series/BreakingBad/BreakingBad.data';
import { armBlogReturn, readBlogFlip, blogExpandedBox } from '../../../motion/cinematic';
import { getBlogDetail, getAdjacentBlogs } from './BlogPost.data';
import { TagChips } from './TagChips/TagChips';
import { SidebarRelated } from './SidebarRelated/SidebarRelated';
import { Comments } from './Comments/Comments';
import { ArticleNav } from './ArticleNav/ArticleNav';
import styles from './BlogPost.module.css';

gsap.registerPlugin(ScrollTrigger);

// Dive Deeper carousel'inden (RelatedContent) devralınan bağımsız Blog yazısı
// sayfası. Zemin DÜZ SİYAH — arka plan görseli yok (kullanıcı kararı).
//
// KESİNTİSİZ DEVİR: kaynak sayfadaki büyüyen klon document.body'de yaşadığı
// için route değişiminde silinmez, ekranda durmaya devam eder. Bu sayfa kendi
// kutusunu TAM AYNI geometride (blogExpandedBox — tek kaynak) çizer ve
// görseli yüklenir yüklenmez klonu kaldırır. İki kare arasında görsel fark
// olmadığından sayfa değişimi algılanmaz.
export default function BlogPost() {
  const { t } = useTranslation();
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

  // Tema, blogun etiketlendiği yapıma göre çözülür — sabit GoT teması
  // DEĞİL (kullanıcı raporu: "renk paleti ve fontu gotta kalmış turuncu").
  // tags asenkron geldiği için (resolveTags) bu effect item'a bağımlı;
  // hiç tag yoksa GoT'a düşer (önceki, tek-yapımlı davranışla geriye uyumlu).
  const productionSlug = item?.tags?.[0]?.productionSlug;
  const activeTheme = productionSlug === 'breaking-bad' ? bbTheme : gotTheme;
  // Hero başlığının display fontu da AYNI şekilde yapıma bağlı: BB sayfaları
  // (Hero.module.css) Montserrat kullanıyor, GoT kendi dekoratif fontunu.
  const heroFontFamily =
    productionSlug === 'breaking-bad' ? "'Montserrat', sans-serif" : "'Game of Thrones', 'Cinzel', serif";

  useEffect(() => {
    const root = document.documentElement;
    const prev = {
      bg: root.style.getPropertyValue('--bg'),
      accent: root.style.getPropertyValue('--accent'),
      cardBg: root.style.getPropertyValue('--card-bg'),
    };
    root.style.setProperty('--bg', activeTheme.bg);
    root.style.setProperty('--accent', activeTheme.accent);
    root.style.setProperty('--card-bg', activeTheme.cardBg);
    return () => {
      root.style.setProperty('--bg', prev.bg || '#050505');
      root.style.setProperty('--accent', prev.accent || '#a02cd8');
      root.style.setProperty('--card-bg', prev.cardBg || '#101012');
    };
  }, [activeTheme]);

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

  // Gövde metninin giriş animasyonu — SeasonStory'nin ("sezon incelemesi")
  // imzasının BİREBİR aynısı (kullanıcı kararı, 2026-08): scrub/pin/parallax
  // YOK, sade fade+y reveal, scroll'a girince BİR KEZ oynar. Blok mimarisi
  // artık serbest x/y canvas değil SeasonStory'nin lede/section/verdict
  // yapısı olduğu için EpisodeStory'den devralınan scrub koreografisi de
  // onunla birlikte kaldırıldı.
  useLayoutEffect(() => {
    if (!item?.story || !storyRef.current) return undefined;

    const ctx = gsap.context((self) => {
      const mm = gsap.matchMedia();
      const reveals = self.selector('[data-reveal]');

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        reveals.forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 32,
            duration: 0.8,
            ease: 'power3.out',
            clearProps: 'opacity,transform',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          });
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(reveals, { opacity: 1, y: 0 });
      });
    }, storyRef);

    return () => ctx.revert();
  }, [item]);

  // Okuma ilerlemesi — Save/Bookmark'la HİÇBİR ilgisi yok (kullanıcı kararı,
  // 2026-08-29): kullanıcı bir şeye tıklamadan, salt scroll davranışıyla
  // READLIST'e otomatik eklenir ve gerçek yüzde periyodik yazılır. İlk %5'in
  // altı (göz atma) READLIST'e hiç düşmez — "sadece açıp kapattım" gürültüsü
  // olmasın diye. Geriye scroll ilerlemeyi DÜŞÜRMEZ (en uzak nokta esas).
  useEffect(() => {
    if (!item?.story) return undefined;
    if (!getStoredAuth()?.token) return undefined;

    const state = { savedItemId: null, lastSent: 0, maxProgress: 0 };

    const computeProgress = () => {
      const el = storyRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const articleTop = window.scrollY + rect.top;
      const articleHeight = rect.height;
      if (articleHeight <= 0) return 0;
      const viewportBottom = window.scrollY + window.innerHeight;
      const scrolledInto = Math.max(0, viewportBottom - articleTop);
      return Math.min(100, Math.max(0, Math.round((scrolledInto / articleHeight) * 100)));
    };

    // beforeunload'daki son çağrı fetch'in tamamlanacağını garanti etmez
    // (best-effort) — kritik bir veri değil, kayıp olursa bir sonraki
    // periyodik senkronda telafi olur.
    const sync = async () => {
      state.maxProgress = Math.max(state.maxProgress, computeProgress());
      const progress = state.maxProgress;
      if (progress < 5 || progress === state.lastSent) return;
      try {
        if (!state.savedItemId) {
          const status = await getMySavedItemStatus('BLOG', item.id, 'READLIST');
          state.savedItemId = status.saved
            ? status.savedItemId
            : (await addToList(item.id, 'BLOG', { listType: 'READLIST' })).id;
        }
        await updateSavedItemProgress(state.savedItemId, progress);
        state.lastSent = progress;
      } catch {
        // Okuma takibi kritik değil, sessiz geç.
      }
    };

    const intervalId = setInterval(sync, 2000);
    window.addEventListener('beforeunload', sync);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', sync);
      sync();
    };
  }, [item?.id, item?.story]);

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
          <h1 className={styles.notfound__title}>{t('common.contentNotFound')}</h1>
        </div>
        <Footer />
      </>
    );
  }

  if (!item) return null;

  return (
    <>
      <section className={styles.hero} style={{ '--font-got': heroFontFamily }}>
        {/* Geri dönüş TIKLAMAYLA (kullanıcı kararı) — kutu geldiği kartın
            yerine küçülerek kapanır. */}
        <button type="button" className={styles.back} onClick={goBack}>
          <span aria-hidden="true">&#8249;</span>
          <span>{t('common.back')}</span>
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

          {/* Başlık bloğu artık resmin ALTINDA ayrı bir sıra değil, resmin
              ÜZERİNE (sol-alt köşeye) bindirilmiş — SeasonDetail'in
              backdrop-üstü overlay deseniyle aynı dil (kullanıcı kararı,
              2026-08). Kutunun kendi boyutu/pozisyonu (flip-geçişi) HİÇ
              değişmedi, sadece içeriği zenginleşti. */}
          <div className={styles.hero__scrim} aria-hidden="true" />
          <div className={styles.hero__caption}>
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
        </div>
      </section>

      <div className={styles.content}>
        <div className={styles.content__main}>
          {item.story && (
            <article className={styles.story} ref={storyRef}>
              <div
                className={styles.story__content}
                data-gated={(Boolean(item.spoilerThrough) && !revealed) || undefined}
              >
                <div className={styles.story__lede} data-reveal="">
                  {item.story.lede.map((paragraph) => (
                    <p key={paragraph.slice(0, 32)} className={styles.story__ledeText}>
                      {paragraph}
                    </p>
                  ))}
                </div>

                <div className={styles.story__sections}>
                  {item.story.sections.map((section) => (
                    <article key={section.id} className={styles.section} data-reveal="">
                      {section.heading && <h2 className={styles.section__heading}>{section.heading}</h2>}

                      {section.photo && (
                        <figure className={styles.section__figure}>
                          <img
                            className={styles.section__image}
                            src={section.photo.url}
                            alt={section.photo.alt ?? ''}
                            loading="lazy"
                            decoding="async"
                          />
                        </figure>
                      )}

                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                      ))}

                      {section.pullQuote && <blockquote className={styles.section__quote}>{section.pullQuote}</blockquote>}
                    </article>
                  ))}
                </div>

                {item.story.verdict.length > 0 && (
                  <div className={styles.story__verdict} data-reveal="">
                    <p className={styles.story__verdictLabel}>{t('series.reckoningLabel')}</p>
                    {item.story.verdict.map((paragraph) => (
                      <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                    ))}
                  </div>
                )}

                {item.spoilerThrough && !revealed && (
                  <div className={styles.spoilerGate}>
                    <p className={styles.spoilerGate__label}>{t('blog.spoilerWarning')}</p>
                    <p className={styles.spoilerGate__hint}>
                      {t('blog.spoilerHint', {
                        season: item.spoilerThrough.seasonNumber,
                        episode: item.spoilerThrough.episodeNumber,
                      })}
                    </p>
                    <button
                      type="button"
                      className={styles.spoilerGate__button}
                      onClick={() => setRevealed(true)}
                    >
                      {t('blog.reveal')}
                    </button>
                  </div>
                )}
              </div>
            </article>
          )}
        </div>

        <aside className={styles.content__sidebar}>
          <SidebarRelated items={item.relatedBlogs} />
        </aside>
      </div>

      {/* Beğen/kaydet/paylaş — makale bitince "okudun mu, paylaş" (kullanıcı
          kararı): hero'nun resim üzerinde yüzen reels-tarzı rayı yerine
          makale sonunda, ArticleNav'ın üstünde yatay bir sıra. */}
      <div className={styles.storyActions}>
        <ContentActions
          itemId={item.id}
          itemType="BLOG"
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
