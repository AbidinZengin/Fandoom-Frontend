import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../shared/i18n/LocalizedLink';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FandoomLogo } from '../FandoomLogo/FandoomLogo';
import { registerNavbarHide } from '../../motion/cinematic';
import { LanguageSwitcher } from './LanguageSwitcher/LanguageSwitcher';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { labelKey: 'navbar.series', to: '/series' },
  { labelKey: 'navbar.movies', to: '/movies' },
  { labelKey: 'navbar.news', to: '/news' },
  { labelKey: 'navbar.blog', to: '/blog' },
  { labelKey: 'navbar.comingSoon', to: '/coming-soon' },
  { labelKey: 'navbar.shop', to: '/shop' },
  {
    labelKey: 'navbar.community',
    to: '/community',
    dropdown: [
      { labelKey: 'navbar.discussion', to: '/community/discussion' },
      { labelKey: 'navbar.theories', to: '/community/theories' },
      { labelKey: 'navbar.fanArt', to: '/community/fan-art' },
    ],
  },
  { labelKey: 'navbar.support', to: '/support' },
];

export function Navbar() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);
  const overlayRef = useRef(null);
  const { pathname } = useLocation();
  const { t } = useTranslation();

  // Menüden bir linke gidilince overlay kendi kendine kapanır.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Overlay açıkken arkadaki sayfa kaymaz; Escape kapatır.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  // Menü öğeleri kademeli girer — utility register (0.35s), Hero/Intro'nun
  // sinematik temposu değil: menü gezinme aracıdır, sahne değil.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-menu-item]', {
          opacity: 0,
          y: 24,
          duration: 0.35,
          ease: 'power2.out',
          stagger: 0.06,
        });
      });
    }, overlayRef);

    return () => ctx.revert();
  }, [menuOpen]);

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
    <>
      <header className={styles.navbar} ref={navRef}>
        <Link to="/" className={styles.navbar__logo} aria-label={t('navbar.homeAriaLabel')}>
          <FandoomLogo showTagline={false} scale={0.16} />
        </Link>

        <nav className={styles.navbar__links}>
          {NAV_LINKS.map((item) => (
            <div
              key={item.labelKey}
              className={styles.navbar__item}
              onMouseEnter={() => item.dropdown && setOpenDropdown(item.labelKey)}
              onMouseLeave={() => item.dropdown && setOpenDropdown(null)}
            >
              {item.to ? (
                <Link to={item.to} className={styles.navbar__link}>
                  {t(item.labelKey)}
                </Link>
              ) : (
                <span className={styles.navbar__link}>{t(item.labelKey)}</span>
              )}

              {item.dropdown && openDropdown === item.labelKey && (
                <div className={styles.navbar__dropdown}>
                  {item.dropdown.map((sub) => (
                    <Link key={sub.labelKey} to={sub.to} className={styles['navbar__dropdown-link']}>
                      {t(sub.labelKey)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className={styles.navbar__actions}>
          <input
            className={styles.navbar__search}
            type="search"
            placeholder={t('navbar.searchPlaceholder')}
          />
          <LanguageSwitcher />
          <Link to="/account" className={styles.navbar__icon} aria-label={t('navbar.accountAriaLabel')}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="8" r="3.4" />
              <path d="M4.5 19.5c1.6-3.3 4.4-5 7.5-5s5.9 1.7 7.5 5" strokeLinecap="round" />
            </svg>
          </Link>

          {/* Yalnız ≤900px'te görünür — masaüstünde yatay link şeridi zaten var. */}
          <button
            type="button"
            className={styles.navbar__burger}
            onClick={() => setMenuOpen(true)}
            aria-label={t('navbar.openMenuAriaLabel')}
            aria-expanded={menuOpen}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* Overlay header'ın DIŞINDA: navbar'a GSAP transform uygulanıyor ve
          transform'lu bir ata, position:fixed çocuğun konum referansını
          kendisi olarak ezer — içeride kalsa tam ekran kaplamazdı. */}
      {menuOpen && (
        <div className={styles.navbar__overlay} ref={overlayRef}>
          <div className={styles['navbar__overlay-head']}>
            <Link to="/" className={styles.navbar__logo} aria-label={t('navbar.homeAriaLabel')}>
              <FandoomLogo showTagline={false} scale={0.16} />
            </Link>
            <LanguageSwitcher />
            <button
              type="button"
              className={styles.navbar__close}
              onClick={() => setMenuOpen(false)}
              aria-label={t('navbar.closeMenuAriaLabel')}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <input
            className={styles['navbar__overlay-search']}
            type="search"
            placeholder={t('navbar.searchPlaceholder')}
            data-menu-item
          />

          <nav className={styles['navbar__overlay-nav']}>
            {NAV_LINKS.map((item) => (
              <div key={item.labelKey} data-menu-item>
                <Link to={item.to} className={styles['navbar__overlay-link']}>
                  {t(item.labelKey)}
                </Link>

                {/* Mobilde dropdown yok — alt linkler açık liste olarak durur. */}
                {item.dropdown && (
                  <div className={styles['navbar__overlay-sub']}>
                    {item.dropdown.map((sub) => (
                      <Link
                        key={sub.labelKey}
                        to={sub.to}
                        className={styles['navbar__overlay-sublink']}
                      >
                        {t(sub.labelKey)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
