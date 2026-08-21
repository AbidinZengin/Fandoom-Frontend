import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../shared/i18n/LocalizedLink';
import gsap from 'gsap';
import styles from './Footer.module.css';

export function Footer() {
  const footerRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(footerRef.current, {
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 90%',
          },
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(footerRef.current, { opacity: 1 });
      });
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer className={styles.footer} ref={footerRef}>
      <div className={styles.footer__top}>
        <div>
          <span className={styles.footer__wordmark}>FANDOOM</span>
          <p className={styles.footer__tagline}>{t('footer.tagline')}</p>
        </div>

        <div className={styles.footer__col}>
          <h4>{t('footer.exploreHeading')}</h4>
          <Link to="/series">{t('navbar.series')}</Link>
          <Link to="/movies">{t('navbar.movies')}</Link>
          <Link to="/news">{t('navbar.news')}</Link>
          <Link to="/blog">{t('navbar.blog')}</Link>
        </div>

        <div className={styles.footer__col}>
          <h4>{t('footer.moreHeading')}</h4>
          <Link to="/community">{t('navbar.community')}</Link>
          <Link to="/support">{t('navbar.support')}</Link>
          <Link to="/coming-soon">{t('navbar.comingSoon')}</Link>
          <Link to="/shop">{t('navbar.shop')}</Link>
        </div>

        <div className={styles.footer__col}>
          <h4>{t('footer.followHeading')}</h4>
          <a href="#" rel="noreferrer">Instagram</a>
          <a href="#" rel="noreferrer">X / Twitter</a>
          <a href="#" rel="noreferrer">TikTok</a>
        </div>
      </div>

      <div className={styles.footer__bottom}>
        <p>{t('footer.rights', { year: new Date().getFullYear() })}</p>
        <p>{t('footer.partnerships')}</p>
      </div>
    </footer>
  );
}
