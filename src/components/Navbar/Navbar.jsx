import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FandoomLogo } from '../FandoomLogo/FandoomLogo';
import { registerNavbarHide } from '../../motion/cinematic';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { label: 'Series', to: '/series' },
  { label: 'Movies', to: '/movies' },
  { label: 'News', to: '/news' },
  { label: 'Blog', to: '/blog' },
  { label: 'Coming Soon', to: '/coming-soon' },
  { label: 'Shop', to: '/shop' },
  {
    label: 'Community',
    to: '/community',
    dropdown: [
      { label: 'Discussion', to: '/community/discussion' },
      { label: 'Theories', to: '/community/theories' },
      { label: 'Fan Art', to: '/community/fan-art' },
    ],
  },
  { label: 'Support', to: '/support' },
];

export function Navbar() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const navRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // ease: 'none' — a scrub-linked tween shouldn't add its own easing
        // curve on top of the scroll-driven progress, or it fights/lags it.
        // Navbar tamamen transparan — scroll'da sadece padding daralır,
        // zemin/blur/border kazanmaz (kullanıcı kararı).
        gsap.to(navRef.current, {
          paddingTop: 4,
          paddingBottom: 4,
          ease: 'none',
          scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: '+=160',
            scrub: true,
          },
        });

        // Aşağı scroll'da navbar yukarı kayarak gizlenir, yukarı
        // scroll'da geri gelir. Tween tersine çevrilebilir (play/reverse)
        // olsun diye paused tutulur; progress(1) ile görünür başlar.
        const hideAnim = gsap
          .from(navRef.current, {
            yPercent: -100,
            paused: true,
            duration: 0.4,
            ease: 'power2.out',
          })
          .progress(1);

        // Bölüm sayfası girişinde EpisodePage navbar'ı dışarıdan geri çeker.
        // Süre verilirse (sinematik giriş — normal scroll-hide'ın 0.4s'inden
        // YAVAŞ) ayrı bir tween kullanılır, sonunda hideAnim'in progress'i
        // görsel sıçrama olmadan senkronlanır ki sıradaki scroll yön
        // değişimi (play/reverse) doğru yerden devam etsin.
        registerNavbarHide((duration) => {
          if (duration) {
            gsap.to(navRef.current, {
              yPercent: -100,
              duration,
              ease: 'power2.out',
              onComplete: () => hideAnim.progress(0),
            });
          } else {
            hideAnim.reverse();
          }
        });

        ScrollTrigger.create({
          start: 'top top',
          end: 'max',
          onUpdate: (self) => {
            if (self.direction === -1) {
              hideAnim.play();
            } else {
              hideAnim.reverse();
            }
          },
        });
      });
    }, navRef);

    return () => ctx.revert();
  }, []);

  return (
    <header className={styles.navbar} ref={navRef}>
      <Link to="/" className={styles.navbar__logo} aria-label="Fandoom home">
        <FandoomLogo showTagline={false} scale={0.16} />
      </Link>

      <nav className={styles.navbar__links}>
        {NAV_LINKS.map((item) => (
          <div
            key={item.label}
            className={styles.navbar__item}
            onMouseEnter={() => item.dropdown && setOpenDropdown(item.label)}
            onMouseLeave={() => item.dropdown && setOpenDropdown(null)}
          >
            {item.to ? (
              <Link to={item.to} className={styles.navbar__link}>
                {item.label}
              </Link>
            ) : (
              <span className={styles.navbar__link}>{item.label}</span>
            )}

            {item.dropdown && openDropdown === item.label && (
              <div className={styles.navbar__dropdown}>
                {item.dropdown.map((sub) => (
                  <Link key={sub.label} to={sub.to} className={styles['navbar__dropdown-link']}>
                    {sub.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className={styles.navbar__actions}>
        <input className={styles.navbar__search} type="search" placeholder="Search titles, theories..." />
        <Link to="/account" className={styles.navbar__icon} aria-label="Account">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="8" r="3.4" />
            <path d="M4.5 19.5c1.6-3.3 4.4-5 7.5-5s5.9 1.7 7.5 5" strokeLinecap="round" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
