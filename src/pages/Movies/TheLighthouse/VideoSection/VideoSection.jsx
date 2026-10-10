import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import VideoCard from './VideoCard/VideoCard';
import VideoLightbox from './VideoLightbox/VideoLightbox';
import { getVideos } from './VideoSection.data';
import styles from './VideoSection.module.css';

// TheLighthouse sayfasında CharactersRoute'tan sonra gelen "alakalı videolar"
// bölümü. Kart tıklanınca video YOK yerinde oynar — VideoLightbox kartın
// kutusundan büyür ve YouTube'un resmi oynatıcısı (IFrame API) bizim
// kontrollerimizle sitede oynar (indirme yok, izlenme kanala yazılır).
// Başlık deseni CharactersRoute ile aynı: kicker pill + iki satır (gri / beyaz).
// Veri şimdilik mock (bkz. .data.js).
export default function VideoSection() {
  const { t } = useTranslation();
  const headingId = useId();
  const videos = getVideos();
  const [openIndex, setOpenIndex] = useState(null);
  // Her kartın çerçeve kutusu: lightbox açılış/kapanış FLIP'inin başlangıç/bitişi.
  const frames = useRef(new Map());

  const sectionRef = useRef(null);
  const kickerRef = useRef(null);
  const titleLeadRef = useRef(null);
  const titleActionRef = useRef(null);
  const trackRef = useRef(null);

  // Section scroll ile görünüme girerken TEK SEFERLİK reveal (CharactersRoute ile
  // aynı desen): kicker yukarıdan, başlığın iki satırı soldan kademeli, kartlar
  // soldan kademeli akar. Hedefler ref ile seçilir (module class'ları hash'li).
  // Hareket azaltılmışsa animasyon kurulmaz, her şey baştan görünür.
  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const scrollTrigger = { trigger: sectionRef.current, start: 'top 75%', once: true };

        gsap.from(kickerRef.current, {
          opacity: 0,
          y: 28,
          duration: 0.9,
          ease: 'power3.out',
          clearProps: 'opacity,transform',
          scrollTrigger,
        });

        gsap.from([titleLeadRef.current, titleActionRef.current], {
          opacity: 0,
          x: -120,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          delay: 0.12,
          clearProps: 'opacity,transform',
          scrollTrigger,
        });

        gsap.from(trackRef.current.children, {
          opacity: 0,
          x: -64,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.12,
          delay: 0.3,
          clearProps: 'opacity,transform',
          scrollTrigger,
        });
      });
    }, sectionRef);

    // Üstteki bölümler (karakterler) veriyle geç yüklenip sayfa boyunu değiştirir:
    // tetik konumları yerleşimden sonra yeniden ölçülür.
    const timerId = setTimeout(() => ScrollTrigger.refresh(), 250);

    return () => {
      clearTimeout(timerId);
      ctx.revert();
    };
  }, []);

  const getOriginRect = useCallback(
    (index) => frames.current.get(videos[index]?.id)?.getBoundingClientRect(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (!videos.length) return null;

  return (
    <section ref={sectionRef} className={styles.section} aria-labelledby={headingId}>
      <div className={styles.header}>
        <p ref={kickerRef} className={styles.kicker}>
          {t('series.videosHeading')}
        </p>
        <h2 className={styles.title} id={headingId}>
          <span ref={titleLeadRef} className={styles.titleLead}>
            {t('series.videosTitleLead')}
          </span>
          <span ref={titleActionRef} className={styles.titleAction}>
            {t('series.videosTitleAction')}
          </span>
        </h2>
      </div>

      <div ref={trackRef} className={styles.track}>
        {videos.map((video, index) => (
          <VideoCard
            key={video.id}
            video={video}
            frameRef={(el) => {
              if (el) frames.current.set(video.id, el);
              else frames.current.delete(video.id);
            }}
            onOpen={() => setOpenIndex(index)}
          />
        ))}
      </div>

      {openIndex !== null && (
        <VideoLightbox
          videos={videos}
          initialIndex={openIndex}
          getOriginRect={getOriginRect}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </section>
  );
}
