import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { still } from '../EpisodePage.data';
import styles from './EpisodeBrief.module.css';

gsap.registerPlugin(ScrollTrigger);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2011-04-17" → "17 Apr 2011". Date yerine string parse: airDate saat
// taşımayan bir tarih (LocalDate), new Date() ile UTC'ye çevrilince
// kullanıcının saat dilimine göre bir gün kayabiliyordu.
function formatAirDate(isoDate) {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return null;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

const pad2 = (n) => String(n).padStart(2, '0');

// Backend'de karşılığı OLMAYAN künye alanları (credits / rating /
// trailerUrl). Kullanıcı kararı (b): kutular şimdiden doğru hizada dursun,
// alan geldiğinde tek satırda dolsun — bu yüzden slot'lar prop'la beslenir
// ve değer yokken "beklemede" durumunda kalır. Sahte veri BASILMAZ.
// `icon` verilirse metin etiketin yerine geçer (IMDb marka rozeti).
function MetaSlot({ label, icon, value, pending }) {
  return (
    <div className={styles.brief__metaSlot} data-pending={pending || undefined}>
      {icon ?? <span className={styles.brief__metaLabel}>{label}</span>}
      {value ? <span className={styles.brief__metaValue}>{value}</span> : null}
    </div>
  );
}

/**
 * Hero'nun altındaki "karar bloğu" — kullanıcı wireframe'i:
 * sol görsel kartı, sağda başlık + künye satırı + synopsis,
 * altta künye/puan slot'ları.
 *
 * Tipografi: başlık yapımın display fontunda (yalnız harf taşır), künye ve
 * gövde marka fontu Montserrat'ta kalır (learned-rules: referans serif olsa
 * da marka fontu serife çevrilmez).
 */
export function EpisodeBrief({ episode, seasonNumber, credits, rating }) {
  const hasEpisode = Boolean(episode);
  const rootRef = useRef(null);
  const figureRef = useRef(null);
  const headerRef = useRef(null);
  const synopsisRef = useRef(null);
  const metaRowRef = useRef(null);
  // Scrub hedefi: görseli VE metni saran grid katmanı. Dalga tekil
  // elemanlara (figure/header/synopsis/metaRow) dokunduğu için scrub'ı
  // onların ORTAK ATASINA bağlamak ikisini de kapsar ve aynı property'yi
  // aynı elemanda iki tween'in yazmasını önler.
  const innerRef = useRef(null);

  // Section görünüme girerken GoT sayfasının Hero'suyla AYNI DESEN (bkz.
  // GameOfThrones/Hero/Hero.jsx'in varsayılan — cinematic olmayan — dalı):
  // önce üst blok (orada logo, burada başlık/künye) fade+rise, offset'te
  // geri kalanı takip eder (orada synopsis, burada görsel+synopsis+
  // metaRow) fade+rise — imza-dalga (x kayması + stagger) DEĞİL (kullanıcı
  // kararı: "hero'nun yazılarında kullandığımız animasyonun aynısını
  // kullan"). Süreler Hero'nun BİREBİR değerleri (0.9s/0.7s) DEĞİL —
  // burada "çok hızlı" bulundu, kasıtlı olarak uzatıldı (1.3s/1.05s);
  // desen (fade+y-rise, power2.out, iki adımlı offset) aynı kalıyor.
  // once:true — geri scroll'da tekrar oynamaz, okuma akışını bölmesin.
  useLayoutEffect(() => {
    if (!rootRef.current) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      const all = [headerRef.current, figureRef.current, synopsisRef.current, metaRowRef.current];

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const rest = [figureRef.current, synopsisRef.current, metaRowRef.current].filter(Boolean);

        gsap
          .timeline({
            scrollTrigger: { trigger: rootRef.current, start: 'top 80%', once: true },
            defaults: { ease: 'power2.out' },
          })
          .from(headerRef.current, { opacity: 0, y: 28, duration: 0.9, clearProps: 'opacity,transform' }, 0)
          .from(rest, { opacity: 0, y: 16, duration: 0.7, clearProps: 'opacity,transform' }, 0.35);

        // Yukarıdaki giriş reveal'inin ÜSTÜNE, hero ile aynı çift yönlü
        // scrub: görsel ve yazılar birlikte aşağı inince gelir, yukarı
        // dönünce gider. Giriş reveal'i tekil elemanların opacity'siyle
        // oynuyor, bu ise onların ORTAK SARMALAYICISIYLA — iki opaklık
        // çarpışır, birbirini ezmez.
        //
        // Tepe noktası TAM MERKEZ, sabit 560px'lik simetrik pencere ("center
        // center±280"): blok merkezi viewport merkezine 280px kala başlar,
        // 280px geçince biter. Piksel penceresi blok/viewport boyutundan
        // bağımsız olduğu için her bölüm sayfasında güvenle sığar — "top
        // bottom → bottom top" ÖNCEKİ hâli viewport+blok yüksekliği kadar
        // (~1300px) istiyordu, kısa Footer'lı sayfalarda bitiş noktasına
        // hiç ulaşılamıyor, animasyon sayfa sonunda yarım kalıyordu
        // (kullanıcı: "sayfa bittiğinde bitiyor göremiyorum").
        //
        // Pencere DÜZ fade-in→fade-out DEĞİL, ortada bir HOLD'lu: geçişler
        // KISA (%15+%15), ortada opacity 1'de UZUN durur (%70) — aksi halde
        // tam opaklık anlık bir tepe noktasından ibaret kalıp "neredeyse hiç
        // kalmıyor" hissi veriyordu (kullanıcı düzeltmesi). Pay geniş
        // tutuldu çünkü sayfa geometrisi (başlık/synopsis yüksekliği font
        // yüklenmesine göre birkaç piksel oynayabiliyor) tam merkezi
        // hafifçe kaydırabilir — dar bir plato bu kaymada tamamen kaçırılır,
        // geniş plato toleranslı kalır.
        gsap
          .timeline({
            scrollTrigger: {
              trigger: rootRef.current,
              start: 'center center+=280',
              end: 'center center-=280',
              scrub: true,
            },
          })
          .fromTo(innerRef.current, { opacity: 0 }, { opacity: 1, ease: 'none', duration: 0.3 })
          .to(innerRef.current, { opacity: 1, duration: 1.4 })
          .to(innerRef.current, { opacity: 0, ease: 'none', duration: 0.3 });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set([...all, innerRef.current].filter(Boolean), { opacity: 1, x: 0, y: 0 });
      });
    }, rootRef);

    return () => ctx.revert();
    // Blok DOM'a girdiğinde bir kez kurulur; bölüm değişimi içeriği
    // tazeler ama dalgayı yeniden oynatmaz.
  }, [hasEpisode]);

  if (!episode) return null;

  const airDate = formatAirDate(episode.airDate);
  const meta = [
    `Season ${pad2(seasonNumber)}`,
    `Episode ${pad2(episode.episodeNumber)}`,
    episode.durationMinutes ? `${episode.durationMinutes} min` : null,
    airDate,
  ].filter(Boolean);

  return (
    <section className={styles.brief} id="episode-brief" ref={rootRef}>
      <div className={styles.brief__inner} ref={innerRef}>
        {episode.stillImageUrl && (
          <figure className={styles.brief__figure} ref={figureRef}>
            <img
              className={styles.brief__image}
              src={still(episode.stillImageUrl, 900)}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </figure>
        )}

        <div className={styles.brief__body}>
          <header className={styles.brief__header} ref={headerRef}>
            <h2 className={styles.brief__title}>{episode.title}</h2>
            <p className={styles.brief__meta}>{meta.join(' · ')}</p>
          </header>

          {episode.synopsis && (
            <p className={styles.brief__synopsis} ref={synopsisRef}>
              {episode.synopsis}
            </p>
          )}

          {/* Yıldızlı ayrı puan slotu YOK (kullanıcı kararı) — puan doğrudan
              IMDb rozetinin değeri olarak durur. */}
          <div className={styles.brief__metaRow} ref={metaRowRef}>
            <MetaSlot label="Crew" value={credits} pending={!credits} />
            <MetaSlot
              icon={<img className={styles.brief__imdb} src="/imdb.png" alt="IMDb" />}
              value={rating}
              pending={!rating}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
