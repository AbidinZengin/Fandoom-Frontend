import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './TitleSequence.module.css';

gsap.registerPlugin(ScrollTrigger);

// Faz 1'deki süzülen kimyasal semboller — meth formülüyle ilişkili 5 gerçek
// değer. Blur/font-size kimliğe (variant) bağlı sabit, ama KONUM sabit
// DEĞİL — her döngüde farklı bir POSITIONS durağına düşer (kullanıcı
// kararı: "meth ortada çıktıysa ikincide sağda üçüncüde solda çıksın").
// Rotasyon YOK. Her biri o döngüdeki konumundan merkeze doğru akarak
// küçülür (kullanıcı kararı: "merkeze yoğunlaşacak şekilde akacak,
// büyükten küçülecek") — converge vektörü konumun kendisinden hesaplanır.
const FLOATS = [
  { key: 'h', text: 'H' },
  { key: 'n', text: 'N' },
  { key: 'formula', text: 'C10H15N' },
  { key: 'weight', text: '149.24' },
  { key: 'meth', text: 'meth' },
];

const POSITIONS = [
  { top: 20, left: 16 },
  { top: 62, left: 76 },
  { top: 26, left: 60 },
  { top: 70, left: 18 },
  { top: 46, left: 46 },
  { top: 15, left: 70 },
  { top: 78, left: 55 },
  { top: 50, left: 10 },
];

// Breaking Bad'in gerçek jeneriğinin (periyodik tablo Br/Ba + tipografik
// birleşme) DOM/CSS/SVG tabanlı yeniden yaratımı — video değil (kalite
// kaygısı, kullanıcı kararı). Kompozisyon BİRİKİMLİDİR (Br kalır, Ba eklenir,
// hiçbir öğe ekrandan çıkmaz) — bu yüzden GoT Intro'nun "sahneler girip
// çıkar" tekniği yerine STICKY kompozisyon + TEK master scrub timeline
// kullanılıyor (proje zaten sticky'yi editoryal analiz bölümlerinde
// kullanıyor, pin YOK — v3 GoT Intro kararıyla tutarlı). Sayfanın giriş
// bölümüydü — GoT'taki lore-anlatan "Intro"dan farklı olarak burada derin
// lore YOK, sadece dizinin ikonik jeneriği canlandırılıyor.
//
// Faz sırası (kullanıcıyla 3 turda netleşti): 1) karanlık + subliminal
// formül/molekül flaşları, 2) Br belirir, 3) Ba belirir (+hafif kamera
// yakınlaşması), 4) duman içeri süzülür, 5) duman içinden "eaking"/"d"
// harfleri girip "Breaking"/"Bad"ı tamamlar, 6) duman dağılır → final
// statik glow'lu logo.
//
// "Hero" ismi Billboard'a devretti (kullanıcı kararı, 2026-08) — bu
// component artık TitleSequence; sayfada ŞU AN render edilmiyor
// (BreakingBad.jsx'te kaldırıldı) ama dosya bilerek silinmedi.
export function TitleSequence() {
  const trackRef = useRef(null);
  const floatRefs = useRef([]);
  floatRefs.current = [];
  const registerFloatRef = (el) => {
    if (el) floatRefs.current.push(el);
  };
  const sceneRef = useRef(null);
  const brRef = useRef(null);
  const baRef = useRef(null);
  const smokeARef = useRef(null);
  const smokeBRef = useRef(null);
  const smokeCRef = useRef(null);
  const eakingRef = useRef(null);
  const dRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const floats = floatRefs.current;

        gsap.set(floats, { opacity: 0 });
        gsap.set(
          [brRef.current, baRef.current, eakingRef.current, dRef.current],
          { opacity: 0 }
        );
        gsap.set([smokeARef.current, smokeBRef.current, smokeCRef.current], { opacity: 0 });
        gsap.set([brRef.current, baRef.current], { scale: 0.82 });
        gsap.set([eakingRef.current, dRef.current], { clipPath: 'inset(0 100% 0 0)' });

        const tl = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          scrollTrigger: {
            trigger: trackRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1,
          },
        });

        // 1) Karanlıkta z-derinlikli kimyasal semboller RÖLE halinde süzülür:
        // her element kameraya yakın/büyük belirir (z-ekseninden geliyormuş
        // hissi), MERKEZE DOĞRU akarak küçülür ve kaybolur (kullanıcı kararı:
        // "merkeze yoğunlaşacak şekilde akacak, büyükten küçülecek") — 5
        // element birkaç kez tekrar sahneye döner ("birileri gittikçe
        // başkaları gelecek"), dönme YOK.
        const CYCLES = 5;
        const RELAY_STEP = 0.11;
        const CYCLE_GAP = 0.75;
        for (let c = 0; c < CYCLES; c += 1) {
          FLOATS.forEach((f, i) => {
            const el = floats[i];
            const pos = POSITIONS[(i * 3 + c * 2) % POSITIONS.length];
            // Merkeze (%50,%50) doğru çeken vektör — konumun kendisinden
            // hesaplanır, döngü değişince konum değiştiği için sabit değil.
            // Güçlendirildi (kullanıcı kararı: "ortada daha çok yoğunlaşsınlar").
            const convergeX = (50 - pos.left) * 1.7;
            const convergeY = (50 - pos.top) * 1.3;
            const start = c * CYCLE_GAP + i * RELAY_STEP;

            tl.set(el, { top: `${pos.top}%`, left: `${pos.left}%` }, start)
              .fromTo(
                el,
                { opacity: 0, scale: 1.6, x: 0, y: 0 },
                { opacity: 1, scale: 1, x: convergeX * 0.55, y: convergeY * 0.55, duration: 0.4, ease: 'power1.out' },
                start
              )
              .to(
                el,
                { opacity: 0, scale: 0.3, x: convergeX * 1.1, y: convergeY * 1.1, duration: 0.4, ease: 'power1.in' },
                start + 0.5
              );
          });
        }

        // 2) Br belirir
        tl.to(brRef.current, { opacity: 1, scale: 1, duration: 1 }, 4.6)
          // 3) Ba belirir + hafif kamera yakınlaşması
          .to(baRef.current, { opacity: 1, scale: 1, duration: 1 }, 5.5)
          .to(sceneRef.current, { scale: 1.05, duration: 1.6 }, 5.5)
          // 4) Duman içeri süzülür
          .to(smokeARef.current, { opacity: 0.85, x: '4%', duration: 1.6 }, 6.4)
          .to(smokeBRef.current, { opacity: 0.7, x: '-5%', duration: 1.8 }, 6.6)
          .to(smokeCRef.current, { opacity: 0.6, y: '-4%', duration: 1.7 }, 6.8)
          // 5) Duman içinden tipografi tamamlanır
          .to(eakingRef.current, { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 1 }, 7.8)
          .to(dRef.current, { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.7 }, 8.5)
          // 6) Duman dağılır → final statik hâl
          .to([smokeARef.current, smokeBRef.current, smokeCRef.current], { opacity: 0, duration: 1.4 }, 9.1);
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(
          [...floatRefs.current, smokeARef.current, smokeBRef.current, smokeCRef.current],
          { opacity: 0 }
        );
        gsap.set([brRef.current, baRef.current, eakingRef.current, dRef.current], {
          opacity: 1,
          scale: 1,
          clipPath: 'inset(0 0% 0 0)',
        });
      });
    }, trackRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className={styles.heroTrack} ref={trackRef}>
      <div className={styles.heroStage}>
        <div className={styles.heroStage__vignette} aria-hidden="true" />

        <div className={styles.floats} aria-hidden="true">
          {FLOATS.map((f) => (
            <span key={f.key} className={styles.float} ref={registerFloatRef} data-variant={f.key}>
              {f.key === 'formula' ? (
                <>
                  C<sub>10</sub>H<sub>15</sub>N
                </>
              ) : (
                f.text
              )}
            </span>
          ))}
        </div>

        <div className={styles.heroStage__smoke} aria-hidden="true">
          <div className={styles.smoke} ref={smokeARef} data-variant="a" />
          <div className={styles.smoke} ref={smokeBRef} data-variant="b" />
          <div className={styles.smoke} ref={smokeCRef} data-variant="c" />
        </div>

        <div className={styles.scene} ref={sceneRef}>
          <div className={styles.line}>
            <span className={styles.element} ref={brRef}>
              <span className={styles.element__number}>35</span>
              Br
            </span>
            <span className={styles.line__rest} ref={eakingRef}>
              eaking
            </span>
          </div>
          <div className={`${styles.line} ${styles['line--second']}`}>
            <span className={styles.element} ref={baRef}>
              <span className={styles.element__number}>56</span>
              Ba
            </span>
            <span className={styles.line__rest} ref={dRef}>
              d
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
