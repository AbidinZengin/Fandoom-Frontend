import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { fetchProductionDetail, fetchCharactersForSeries } from './CharactersRoute.data';
import styles from './CharactersRoute.module.css';
import backdropUrl from '../../../../assets/breaking-bad/characters-backdrop.jpg';

// SeasonRoute.jsx'in ARROW ikonuyla birebir aynı (paylaşılan bir icon
// component'i yok, SeasonRoute da kendi kopyasını tutuyor).
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4.5" y1="12" x2="19" y2="12" />
      <polyline points="13.5 6.5 19.5 12 13.5 17.5" />
    </svg>
  );
}

// SeasonRoute'un İSKELETİNİN BİREBİR AYNISI — `.page` → header +
// `.bottom`(`.focus` + `.carousel`) yuvası. 3. tur düzeltme (kullanıcı:
// "carousel yamuk yamuk duruyor" + "arka plan sabit kalmakla beraber sol
// tarafa image sağ tarafa blurlu açıklaması gelecek"):
// - Carousel'deki fan/stagger istifi (nth-child translateY + negatif
//   margin) TAMAMEN kaldırıldı — SeasonRoute'taki gibi düz sıra.
// - Backdrop ARTIK HİÇ DEĞİŞMİYOR (grup fotoğrafı sabit kalır) — önceki
//   turda karaktere tıklanınca backdrop'u o karakterin görseline
//   değiştirmek YANLIŞTI (geniş grup fotoğrafı dikey portre görüntüsüyle
//   değişince çirkin/aşırı yakınlaşmış bir kırpma çıkıyordu). Bunun
//   yerine karakterin görseli KENDİ ÇERÇEVESİNDE (kartlarla aynı
//   bordür/radius dili) `.reveal__media` olarak SOLDA render edilir,
//   `.panel` SAĞDA açılır.
// - `.panel`in buzlu camı sabit kalan backdrop'un (+scrim) üstüne biner
//   (gerçek backdrop-filter, ayrı bulanık kopya YOK) — ton kullanıcının
//   referans ekran görüntüsündeki gibi HAFİF GRİ (saturate düşürülmüş,
//   önceki turun "saturate(180%)" fazla renkli/sıcak duran hatası
//   düzeltildi).
//
// `character.quote` BİLİNÇLİ OLARAK kullanılmıyor — backend alanı
// "TR açıklama (EN orijinal replik)" tek string halinde geliyor (ör.
// Walter White: "Ben tehlikede değilim Skyler... (I am not in danger,
// Skyler...)"), render edilince ekranda TR/EN karışık görünüyordu
// (kullanıcı raporu). Bu tasarımda alıntı hiç gösterilmiyor (referans
// ekran görüntüsünde de sadece isim+açıklama var, alıntı yok).
//
// 4. tur (motion-expert): `.carousel`/`.reveal` artık HER ZAMAN DOM'da —
// SeasonRow.jsx'in accordion deseniyle aynı mantık (gsap.killTweensOf +
// ref, gsap.context YOK çünkü scoped seçici kullanılmıyor). Kapanınca
// `.reveal` içeriği (displayedIndex) fade-out TAMAMLANANA kadar ekranda
// kalır — açıklama metni aniden kaybolmasın diye. Backdrop'a (`img.
// backdrop`) HİÇBİR tween uygulanmaz (kullanıcı isteği: "backgroundun
// image'ini değiştirmeden").
export default function CharactersRoute() {
  const { t } = useTranslation();
  const [series, setSeries] = useState(null);
  const [characters, setCharacters] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [openedIndex, setOpenedIndex] = useState(null);
  const [displayedIndex, setDisplayedIndex] = useState(null);

  const trackRef = useRef(null);
  const carouselRef = useRef(null);
  const revealRef = useRef(null);
  const isFirstOpenRender = useRef(true);

  useEffect(() => {
    let cancelled = false;
    fetchProductionDetail('series', 'breaking-bad').then((data) => {
      if (!cancelled) setSeries(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!series) return undefined;
    let cancelled = false;
    fetchCharactersForSeries(series.id).then((data) => {
      if (!cancelled) setCharacters(data);
    });
    return () => {
      cancelled = true;
    };
  }, [series]);

  const isOpen = openedIndex !== null;

  // Açılışta hemen yeni karakteri göster; kapanışta eskisini fade-out
  // TAMAMLANANA kadar ekranda tut (aşağıdaki GSAP effect'i temizler) —
  // aksi halde `.reveal` içeriği openedIndex null olur olmaz aniden
  // boşalır, fade-out'un ortasında metin/görsel kaybolurdu.
  useEffect(() => {
    if (openedIndex !== null) setDisplayedIndex(openedIndex);
  }, [openedIndex]);

  useEffect(() => {
    const carousel = carouselRef.current;
    const reveal = revealRef.current;
    if (!carousel || !reveal) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isFirstOpenRender.current) {
      isFirstOpenRender.current = false;
      gsap.set(carousel, { opacity: isOpen ? 0 : 1 });
      gsap.set(reveal, { opacity: isOpen ? 1 : 0 });
      return undefined;
    }

    gsap.killTweensOf([carousel, reveal]);

    if (reduced) {
      gsap.set(carousel, { opacity: isOpen ? 0 : 1 });
      gsap.set(reveal, { opacity: isOpen ? 1 : 0 });
      if (!isOpen) setDisplayedIndex(null);
      return undefined;
    }

    if (isOpen) {
      gsap.to(carousel, { opacity: 0, duration: 0.25, ease: 'power1.in' });
      gsap.fromTo(
        reveal,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.15 }
      );
    } else {
      gsap.to(reveal, {
        opacity: 0,
        y: 10,
        duration: 0.25,
        ease: 'power1.in',
        onComplete: () => setDisplayedIndex(null),
      });
      gsap.fromTo(carousel, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out', delay: 0.15 });
    }

    return () => gsap.killTweensOf([carousel, reveal]);
  }, [isOpen]);

  if (!series || !characters || characters.length === 0) return null;

  const displayedCharacter = displayedIndex !== null ? characters[displayedIndex] : null;

  const scrollByCard = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector(`.${styles.cardWrap}`);
    const step = (card?.offsetWidth ?? 200) + 24;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  // Yüzen kart açıkken kapanmadan bir önceki/sonraki karaktere geçiş —
  // isOpen değişmediği için crossfade effect'i (satır ~96) tekrar
  // tetiklenmez, displayedIndex yalnızca openedIndex'i takip eder.
  const goToCharacter = (dir) => {
    if (openedIndex === null) return;
    const total = characters.length;
    const next = (openedIndex + dir + total) % total;
    setOpenedIndex(next);
    setActiveIndex(next);
  };

  return (
    <section className={styles.page} data-open={isOpen || undefined}>
      <img className={styles.backdrop} src={backdropUrl} alt="" aria-hidden="true" />
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.header}>
        <p className={styles.kicker}>{t('series.castKicker')}</p>
        <h2 className={styles.title}>{t('series.charactersHeading')}</h2>
      </div>

      <div className={styles.bottom}>
        <div className={styles.focus}>
          {!isOpen && (
            <button type="button" className={styles.focus__cta} onClick={() => setOpenedIndex(activeIndex)}>
              {t('series.exploreCharacterCta')} <ArrowIcon />
            </button>
          )}
        </div>

        <div className={styles.stage}>
          <div className={styles.reveal} ref={revealRef} inert={!isOpen}>
            {displayedCharacter && (
              <>
                <button type="button" className={styles.reveal__close} onClick={() => setOpenedIndex(null)}>
                  <span className={styles.reveal__closeIcon}>
                    <ArrowIcon />
                  </span>
                  {t('series.backToCharacters')}
                </button>

                <div className={styles.reveal__body}>
                  <div className={styles.reveal__media}>
                    {displayedCharacter.imageUrl && (
                      <img className={styles.reveal__image} src={displayedCharacter.imageUrl} alt={displayedCharacter.name} />
                    )}
                  </div>

                  <div className={styles.reveal__text}>
                    <span className={styles.panel__label}>{t('series.characterBioLabel')}</span>
                    <h3 className={styles.panel__name}>{displayedCharacter.name}</h3>
                    <p className={styles.panel__text}>{displayedCharacter.description}</p>
                  </div>
                </div>

                <div className={styles.reveal__nav}>
                  <button
                    type="button"
                    className={styles.navArrow}
                    data-dir="left"
                    onClick={() => goToCharacter(-1)}
                    aria-label={t('common.previous')}
                  >
                    <ArrowIcon />
                  </button>
                  <button type="button" className={styles.navArrow} onClick={() => goToCharacter(1)} aria-label={t('common.next')}>
                    <ArrowIcon />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className={styles.carousel} ref={carouselRef} inert={isOpen}>
            <div className={styles.track} ref={trackRef}>
              {characters.map((character, i) => (
                <div className={styles.cardWrap} key={character.id}>
                  <button
                    type="button"
                    className={styles.card}
                    aria-current={i === activeIndex || undefined}
                    onMouseEnter={() => setActiveIndex(i)}
                    onFocus={() => setActiveIndex(i)}
                    onClick={() => setOpenedIndex(i)}
                  >
                    {character.imageUrl && (
                      <img className={styles.card__image} src={character.imageUrl} alt="" loading="lazy" />
                    )}
                  </button>
                  <span className={styles.card__caption}>{character.name}</span>
                </div>
              ))}
            </div>

            <div className={styles.navRow}>
              <button
                type="button"
                className={styles.navArrow}
                data-dir="left"
                onClick={() => scrollByCard(-1)}
                aria-label={t('common.previous')}
              >
                <ArrowIcon />
              </button>
              <button type="button" className={styles.navArrow} onClick={() => scrollByCard(1)} aria-label={t('common.next')}>
                <ArrowIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
