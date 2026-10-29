import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import { fetchProductions } from './PosterWall.data';
import styles from './PosterWall.module.css';

gsap.registerPlugin(ScrollTrigger);

const ROW_COUNT = 3;
// Bir şerit kopyasının viewport'u rahat aşması için alt sınır — az yapım
// varsa aynı posterler tekrar eder, döngüde boşluk açılmaz.
const MIN_PER_ROW = 12;
// Şerit bir tam tur için bu kadar saniye sürer; sinematik yavaş tempo.
const LOOP_SECONDS = 140;
const HOVER_TIME_SCALE = 0.3;
// Şeritlerin eğimi (CSS'teki rotate ile aynı) — seçilen kart bu açıdan başlar.
const TILT_DEG = -8;

// Yapımları şeritlere dağıtır; her şeridin başlangıç noktası farklı olsun
// diye dizi şerit indeksi kadar döndürülür (Featured carousel'in sırasıyla
// birebir aynı dizilmesin).
function buildRows(productions) {
  const rows = Array.from({ length: ROW_COUNT }, () => []);
  productions.forEach((p, i) => rows[i % ROW_COUNT].push(p));
  return rows.map((row, r) => {
    if (row.length === 0) return row;
    const shift = (r * 3) % row.length;
    const rotated = [...row.slice(shift), ...row.slice(0, shift)];
    const filled = [];
    while (filled.length < MIN_PER_ROW) filled.push(...rotated);
    return filled;
  });
}

// Tüm yapımlarda Explore butonu BİREBİR aynı ok ikonunu kullanır (Movies hero'ları ile aynı).
function ArrowIcon() {
  return (
    <svg className={styles['wall__arrow']} viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="3.33" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4.5" y1="12" x2="19" y2="12" />
      <polyline points="13.5 6.5 19.5 12 13.5 17.5" />
    </svg>
  );
}

// posterUrl TMDb'den küçük bir boyutla (ör. w300) geliyor; kart ve duvar büyük
// render edildiği için bulanıklaşıyordu. TMDb boyut segmenti büyük varyantla
// değiştirilir; TMDb dışı URL'ler değişmeden döner (FeaturedCarousel ile aynı yaklaşım).
const posterAt = (url, size) => (url ? url.replace(/\/t\/p\/[^/]+\//, `/t/p/${size}/`) : url);

const productionPath = (p) => `/${p.type === 'MOVIE' ? 'movies' : 'series'}/${p.slug}`;

export function PosterWall() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  const trackRefs = useRef([]);
  const slotRef = useRef(null);
  const cardRef = useRef(null);
  const flipRef = useRef(null);
  const exploreRef = useRef(null);
  // Seçilen posterin şeritteki asıl img'i: kart ondan "kalkar", kapanınca geri görünür.
  const sourceImgRef = useRef(null);
  // Kapanış sürerken tekrar tetiklenmesin; unmount'ta yarım kalan tween öldürülsün.
  const closingRef = useRef(false);
  const closeTweenRef = useRef(null);
  // Kart açıkken başka poster seçilirse: önce eski kart döner, bitince bu açılır.
  const pendingPickRef = useRef(null);
  const [productions, setProductions] = useState([]);
  // Duvarın türü: 'SERIES' | 'MOVIE' — şeritleri ve Explore route'unu belirler.
  const [kind, setKind] = useState('SERIES');
  const rows = useMemo(() => buildRows(productions.filter((p) => p.type === kind)), [productions, kind]);
  // picked: { production, from: { left, top, width, height } } — from, section'a göreli.
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchProductions({ size: 60 }).then((data) => {
      if (!cancelled) setProductions(data.content.filter((p) => p.posterUrl));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (rows.length === 0) return undefined;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Şerit: iki kopya yan yana, -50% = tam bir kopya genişliği → kesintisiz döngü.
        // Çift indeksli şeritler sola, tek indeksli sağa akar.
        const tweens = trackRefs.current.map((track, i) => {
          if (!track) return null;
          const toLeft = i % 2 === 0;
          const tween = gsap.fromTo(
            track,
            { xPercent: toLeft ? 0 : -50 },
            { xPercent: toLeft ? -50 : 0, duration: LOOP_SECONDS, ease: 'none', repeat: -1 }
          );
          tween.progress(i * 0.31);
          return tween;
        });

        // Ekran dışındayken şeritler durur (gereksiz kare maliyeti yok).
        const trigger = ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => tweens.forEach((tw) => tw && (self.isActive ? tw.resume() : tw.pause())),
        });

        // Fare üstündeyken akış yavaşlar (dokunmatikte pointerType 'mouse' değil).
        const el = sectionRef.current;
        const slow = (e) => {
          if (e.pointerType !== 'mouse') return;
          tweens.forEach((tw) => tw && gsap.to(tw, { timeScale: HOVER_TIME_SCALE, duration: 0.9 }));
        };
        const normal = (e) => {
          if (e.pointerType !== 'mouse') return;
          tweens.forEach((tw) => tw && gsap.to(tw, { timeScale: 1, duration: 0.9 }));
        };
        el.addEventListener('pointerenter', slow);
        el.addEventListener('pointerleave', normal);

        // Başlık bloğu scroll ile girer: fade + hafif y, kademeli.
        gsap.from(contentRef.current.children, {
          opacity: 0,
          y: 40,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          clearProps: 'opacity,transform',
          scrollTrigger: { trigger: el, start: 'top 70%', once: true },
        });

        return () => {
          el.removeEventListener('pointerenter', slow);
          el.removeEventListener('pointerleave', normal);
          trigger.kill();
        };
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [rows]);

  // Kart: tıklanan posterin yerinden kalkar, dönerek (rotateY 360) soldaki
  // yuvaya oturur; ardından Explore butonu belirir. Yuva ölçüsü yerleşimden
  // (CSS) gelir, bu yüzden ölçüm layout effect'inde yapılır.
  useLayoutEffect(() => {
    if (!picked) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sec = sectionRef.current.getBoundingClientRect();
    const slot = slotRef.current.getBoundingClientRect();
    const to = {
      left: slot.left - sec.left,
      top: slot.top - sec.top,
      width: slot.width,
      height: slot.height,
    };

    const ctx = gsap.context(() => {
      gsap.set(cardRef.current, { ...picked.from, rotation: TILT_DEG, opacity: 1 });
      gsap.set(flipRef.current, { rotateY: 0 });
      gsap.set(exploreRef.current, { opacity: 0, y: 24 });

      const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
      tl.to(cardRef.current, { ...to, rotation: 0, duration: reduced ? 0 : 1.2 }, 0)
        .to(flipRef.current, { rotateY: 360, duration: reduced ? 0 : 1.2 }, 0)
        .to(exploreRef.current, { opacity: 1, y: 0, duration: reduced ? 0 : 0.7, ease: 'power3.out' }, reduced ? 0 : 0.9);
    }, sectionRef);

    return () => ctx.revert();
  }, [picked]);

  const restoreSource = () => {
    if (sourceImgRef.current) sourceImgRef.current.style.visibility = '';
    sourceImgRef.current = null;
  };

  // Unmount'ta seçili posteri geri görünür bırak.
  useEffect(
    () => () => {
      closeTweenRef.current?.kill();
      restoreSource();
    },
    []
  );

  const pick = (production, img, e) => {
    e.stopPropagation();
    // Kapanış sürüyorsa son tıklanan sıraya girer; kart açıksa önce o kapanır.
    if (closingRef.current || picked) {
      pendingPickRef.current = { production, img };
      close();
      return;
    }
    openPick(production, img);
  };

  const openPick = (production, img) => {
    const sec = sectionRef.current.getBoundingClientRect();
    const box = img.getBoundingClientRect(); // eğik img'in sınır kutusu — merkez doğru
    const width = img.offsetWidth;
    const height = img.offsetHeight;
    restoreSource();
    img.style.visibility = 'hidden';
    sourceImgRef.current = img;
    setPicked({
      production,
      from: {
        left: box.left + box.width / 2 - width / 2 - sec.left,
        top: box.top + box.height / 2 - height / 2 - sec.top,
        width,
        height,
      },
    });
  };

  const switchKind = (next) => {
    if (next === kind) return;
    closeTweenRef.current?.kill();
    closeTweenRef.current = null;
    closingRef.current = false;
    pendingPickRef.current = null;
    restoreSource();
    setPicked(null);
    setKind(next);
  };

  // Kapanış: kart, kaynak posterin CANLI konumuna uçar. Şeritler akmaya devam
  // ettiği için hedef her karede yeniden ölçülür (hareketli hedef). Poster
  // döngüde ekran dışına çıkmışsa kart gerçek (ekran dışı) konumuna doğru uçar
  // ve bölümün kenarında kesilerek yok olur (kullanıcı kararı: fade fallback yok).
  const close = () => {
    if (!picked || closingRef.current) return;
    const card = cardRef.current;
    const img = sourceImgRef.current;
    const section = sectionRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    closingRef.current = true;

    const finish = () => {
      closingRef.current = false;
      closeTweenRef.current = null;
      restoreSource();
      setPicked(null);
      const next = pendingPickRef.current;
      pendingPickRef.current = null;
      if (next) openPick(next.production, next.img);
    };

    // Açılış zaman çizelgesi yarıdaysa onu bırak, mevcut durumdan devam et.
    gsap.killTweensOf([card, flipRef.current, exploreRef.current]);
    gsap.to(exploreRef.current, { opacity: 0, duration: 0.3 });

    if (!img || reduced) {
      gsap.to(card, { opacity: 0, duration: reduced ? 0 : 0.4, onComplete: finish });
      return;
    }

    const start = {
      left: gsap.getProperty(card, 'left'),
      top: gsap.getProperty(card, 'top'),
      width: gsap.getProperty(card, 'width'),
      height: gsap.getProperty(card, 'height'),
      rotation: gsap.getProperty(card, 'rotation'),
    };
    // pick() ile aynı ölçüm: eğik img'in sınır kutusunun merkezi doğru konumu verir.
    const liveTarget = () => {
      const sec = section.getBoundingClientRect();
      const box = img.getBoundingClientRect();
      const width = img.offsetWidth;
      const height = img.offsetHeight;
      return {
        left: box.left + box.width / 2 - width / 2 - sec.left,
        top: box.top + box.height / 2 - height / 2 - sec.top,
        width,
        height,
        rotation: TILT_DEG,
      };
    };

    const progress = { p: 0 };
    const mix = (a, b) => a + (b - a) * progress.p;
    gsap.to(flipRef.current, { rotateY: 0, duration: 1, ease: 'power3.inOut' });
    closeTweenRef.current = gsap.to(progress, {
      p: 1,
      duration: 1,
      ease: 'power3.inOut',
      onUpdate: () => {
        const t = liveTarget();
        gsap.set(card, {
          left: mix(start.left, t.left),
          top: mix(start.top, t.top),
          width: mix(start.width, t.width),
          height: mix(start.height, t.height),
          rotation: mix(start.rotation, t.rotation),
        });
      },
      onComplete: finish,
    });
  };

  // Boş alana tıklama / Esc: kullanıcı kapatmak istiyor, sıradaki açılış varsa iptal.
  const dismiss = () => {
    pendingPickRef.current = null;
    close();
  };

  useEffect(() => {
    if (!picked) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <section ref={sectionRef} className={styles['wall']} onClick={dismiss}>
      <div className={styles['wall__tilt']} aria-hidden="true">
        {rows.map((row, i) => (
          <div key={i} className={styles['wall__row']}>
            <div
              ref={(el) => {
                trackRefs.current[i] = el;
              }}
              className={styles['wall__track']}
            >
              {[0, 1].map((copy) =>
                row.map((p, j) => (
                  <img
                    key={`${copy}-${j}`}
                    className={styles['wall__poster']}
                    src={posterAt(p.posterUrl, 'w500')}
                    alt=""
                    loading="lazy"
                    draggable="false"
                    onLoad={(e) => {
                      e.currentTarget.dataset.loaded = 'true';
                    }}
                    onClick={(e) => pick(p, e.currentTarget, e)}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles['wall__fog']} aria-hidden="true" />

      <div ref={contentRef} className={styles['wall__content']}>
        {/* Sol yuva: seçilen kartın ineceği boş alan (kart section'a göre mutlak konumlanır). */}
        <div ref={slotRef} className={styles['wall__slot']} data-open={picked ? 'true' : 'false'} />

        <div className={styles['wall__text']}>
          {/* lang: text-transform: uppercase Türkçe i/İ, ı/I eşlemesini dile göre yapar. */}
          <h2 className={styles['wall__heading']} lang={i18n.language}>
            <span className={styles['wall__headingTop']}>{t('home.posterWallHeadingTop')}</span>
            <span className={styles['wall__headingBottom']}>{t('home.posterWallHeadingBottom')}</span>
          </h2>
          <p className={styles['wall__depth']}>{t('home.posterWallDepth')}</p>
          <div className={styles['wall__actions']}>
            <Link to={kind === 'MOVIE' ? '/movies' : '/series'} className={styles['wall__cta']}>
              {t('home.posterWallViewAll')} <ArrowIcon />
            </Link>
            <div className={styles['wall__switch']} role="group" aria-label={t('home.posterWallViewAll')}>
              <button
                type="button"
                className={styles['wall__switchBtn']}
                aria-pressed={kind === 'SERIES'}
                onClick={() => switchKind('SERIES')}
              >
                {t('navbar.series')}
              </button>
              <span className={styles['wall__switchSep']} aria-hidden="true">
                |
              </span>
              <button
                type="button"
                className={styles['wall__switchBtn']}
                aria-pressed={kind === 'MOVIE'}
                onClick={() => switchKind('MOVIE')}
              >
                {t('navbar.movies')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {picked && (
        <div ref={cardRef} className={styles['wall__card']} onClick={(e) => e.stopPropagation()}>
          <div ref={flipRef} className={styles['wall__flip']}>
            <img className={styles['wall__face']} src={posterAt(picked.production.posterUrl, 'w780')} alt="" draggable="false" />
            <img
              className={`${styles['wall__face']} ${styles['wall__face--back']}`}
              src={posterAt(picked.production.posterUrl, 'w780')}
              alt=""
              draggable="false"
            />
          </div>
          <div ref={exploreRef} className={styles['wall__exploreWrap']}>
            <Link
              to={productionPath(picked.production)}
              className={styles['wall__explore']}
              aria-label={t('home.posterWallExplore', { title: picked.production.title })}
            >
              {t('common.explore')} <ArrowIcon />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
