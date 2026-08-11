import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { fetchHouseGroups, fetchProductionDetail } from './HouseSigils.data';
import styles from './HouseSigils.module.css';

// Karakter kartları ile "Character Analysis" şeridi arasındaki orta bölüm —
// referans: docs/references/behance/got/mod_14.png. Kullanıcı kararıyla
// referanstaki HBO chrome'u (üst mini-nav, alt Info/HBO çubuğu) DIŞARIDA
// bırakıldı; sadece sancak + isim + motto + sayaç + prev/next kopyalandı.
//
// Sigil kaynağı çizgi-illüstrasyon poster seti (kullanıcı kararı, ikinci
// tur): her poster kendi başlığını ve motto'sunu GÖMÜLÜ taşıyor (ör.
// stark.png üstünde "STARK" / "WINTER IS COMING" zaten çizili) — bu yüzden
// görsel VARSA ayrıca h2/motto BASILMAZ (çift metin olur), sadece görsel
// eksikken (henüz kaynak bulunamamış haneler) düz metin fallback'i devreye
// girer.
export function HouseSigils() {
  const [houses, setHouses] = useState([]);
  const [index, setIndex] = useState(0);
  const [brokenSigils, setBrokenSigils] = useState({});

  const rootRef = useRef(null);
  const centerRef = useRef(null);
  const transitioningRef = useRef(false);
  const isFirstRender = useRef(true);
  const lastDirectionRef = useRef(1);

  useEffect(() => {
    let cancelled = false;
    fetchProductionDetail('series', 'game-of-thrones')
      .then((series) => fetchHouseGroups(series.id))
      .then((data) => {
        if (!cancelled) setHouses(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const house = houses[index];
  const prevHouse = houses.length ? houses[(index - 1 + houses.length) % houses.length] : null;
  const nextHouse = houses.length ? houses[(index + 1) % houses.length] : null;

  // Prev/Next: React state anlık değiştiği için "çıkış" ancak state
  // güncellenmeden ÖNCE oynatılabilir (Characters.jsx'teki FLIP akışıyla aynı
  // gerekçe) — mevcut hane küçülüp okun yönüne doğru süzülür, state değişir,
  // aşağıdaki effect yeni haneyi kademeli (stagger) ve overshoot'lu içeri alır.
  const navigate = (direction) => {
    if (transitioningRef.current) return;
    lastDirectionRef.current = direction;
    const apply = () => setIndex((i) => (i + direction + houses.length) % houses.length);
    const el = centerRef.current;

    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      apply();
      return;
    }

    // killTweensOf: aynı elemente üst üste tween binmez — binseydi GSAP
    // öncekini overwrite'la sessizce öldürür, onComplete hiç ateşlenmez ve
    // transitioningRef sonsuza kilitli kalırdı (hızlı çift tıklamada
    // gözlemlendi). onInterrupt de aynı temizliği yapar, kilit her koşulda açılır.
    gsap.killTweensOf(el);
    transitioningRef.current = true;
    const finishExit = () => {
      apply();
      gsap.set(el, { clearProps: 'opacity,transform' });
      transitioningRef.current = false;
    };
    gsap.to(el, {
      opacity: 0,
      x: direction * -16,
      scale: 0.97,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: finishExit,
      onInterrupt: finishExit,
    });
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return undefined;
    }
    const el = centerRef.current;
    if (!el) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(el.children, { opacity: 1, x: 0, scale: 1 });
      return undefined;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.children,
        { opacity: 0, x: lastDirectionRef.current * 16, y: 12, scale: 0.97 },
        {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: 'back.out(1.7)',
          stagger: 0.05,
          clearProps: 'opacity,transform',
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, [index]);

  const goPrev = () => navigate(-1);
  const goNext = () => navigate(1);

  const count = String(index + 1).padStart(2, '0');
  const total = String(houses.length).padStart(2, '0');

  if (houses.length === 0) return null;

  return (
    <section
      ref={rootRef}
      className={styles.houses}
      style={{ '--house-primary': house.customFields.primaryColor, '--house-secondary': house.customFields.secondaryColor }}
    >
      <div className={styles.houses__inner}>
        <span className={styles.houses__kicker}>Houses</span>

        <div className={styles.houses__stage}>
          <button type="button" className={styles.houses__nav} data-side="prev" onClick={goPrev}>
            <span className={styles.houses__navArrow} aria-hidden="true">&#8249;</span>
            <span className={styles.houses__navLabel}>House {prevHouse.name}</span>
          </button>

          <div className={styles.houses__center} ref={centerRef}>
            <span className={styles.houses__count}>{count} / {total}</span>

            <div
              className={styles.banner}
              style={house.customFields.bannerFit ? { '--banner-fit': house.customFields.bannerFit } : undefined}
            >
              {house.imageUrl && !brokenSigils[house.id] ? (
                <img
                  className={styles.banner__image}
                  src={house.imageUrl}
                  alt={`House ${house.name} sigil — "${house.customFields.motto}"`}
                  loading="lazy"
                  decoding="async"
                  onError={() => setBrokenSigils((prev) => ({ ...prev, [house.id]: true }))}
                />
              ) : (
                <div className={styles.banner__fallback}>
                  <span className={styles.banner__monogram} aria-hidden="true">{house.name[0]}</span>
                  <h2 className={styles.houses__name}>House {house.name}</h2>
                  <p className={styles.houses__motto}>{house.customFields.motto}</p>
                </div>
              )}
            </div>
          </div>

          <button type="button" className={styles.houses__nav} data-side="next" onClick={goNext}>
            <span className={styles.houses__navLabel}>House {nextHouse.name}</span>
            <span className={styles.houses__navArrow} aria-hidden="true">&#8250;</span>
          </button>
        </div>
      </div>
    </section>
  );
}
