import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { Footer } from '../../components/Footer/Footer';
import { UniverseBrowse } from './UniverseBrowse/UniverseBrowse';
import { SurfaceHighlight } from './SurfaceHighlight/SurfaceHighlight';
import { getSurfaceHighlights, getUniverseCards } from './Community.data';
import styles from './Community.module.css';

// Community hub — bağımsız üst-seviye sayfa (learned-rules [[topluluk-yapı]]:
// yapım sayfalarının İÇİNE gömülmez). Evrene-göre-gez kartları + 5 yüzeyden
// (Discussion/Theories/Fan Art/News/Blog) karışık öne-çıkanlar vitrini, her biri
// kendi spoke sayfasına devreder. Motion: 3. "utility" register (0.3-0.4s,
// [[topluluk-görsel]]) — Hero/Intro'nun sinematik 0.8-1.2s'inden kısa/hızlı.
export default function Community() {
  const { t } = useTranslation();
  const surfaceHighlights = getSurfaceHighlights();
  const [universeCards, setUniverseCards] = useState([]);
  const headRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getUniverseCards().then((cards) => {
      if (!cancelled) setUniverseCards(cards);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-reveal]', {
          opacity: 0,
          y: 20,
          duration: 0.4,
          ease: 'power2.out',
          stagger: 0.06,
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('[data-reveal]', { opacity: 1 });
      });
    }, headRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <div className={styles.community}>
        <header className={styles.community__head} ref={headRef}>
          <span className={styles.community__kicker} data-reveal>
            Fandoom
          </span>
          <h1 className={styles.community__title} data-reveal>
            {t('navbar.community')}
          </h1>
          <p className={styles.community__lead} data-reveal>
            {t('community.lead')}
          </p>
        </header>

        {universeCards.length > 0 && <UniverseBrowse universes={universeCards} />}

        <div className={styles.community__surfaces}>
          {surfaceHighlights.map((surface) => (
            <SurfaceHighlight key={surface.key} surface={surface} />
          ))}
        </div>
      </div>

      <Footer />
    </>
  );
}
