import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import styles from './Footer.module.css';

export function Footer() {
  const footerRef = useRef(null);

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
          <p className={styles.footer__tagline}>Theories. News. Blogs. Built for fans.</p>
        </div>

        <div className={styles.footer__col}>
          <h4>Explore</h4>
          <Link to="/series">Series</Link>
          <Link to="/movies">Movies</Link>
          <Link to="/news">News</Link>
          <Link to="/blog">Blog</Link>
        </div>

        <div className={styles.footer__col}>
          <h4>More</h4>
          <Link to="/community">Community</Link>
          <Link to="/support">Support</Link>
          <Link to="/coming-soon">Coming Soon</Link>
          <Link to="/shop">Shop</Link>
        </div>

        <div className={styles.footer__col}>
          <h4>Follow</h4>
          <a href="#" rel="noreferrer">Instagram</a>
          <a href="#" rel="noreferrer">X / Twitter</a>
          <a href="#" rel="noreferrer">TikTok</a>
        </div>
      </div>

      <div className={styles.footer__bottom}>
        <p>&copy; {new Date().getFullYear()} Fandoom. All rights reserved.</p>
        <p>Partnerships &amp; sponsorships: partners@fandoom.tv</p>
      </div>
    </footer>
  );
}
