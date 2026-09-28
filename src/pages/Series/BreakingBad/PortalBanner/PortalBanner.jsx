import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import { useLocalizedNavigate } from '../../../../shared/i18n/useLocalizedNavigate';
import { getStoredAuth } from '../../../../shared/api/authStorage';
import { FeedCard } from '../../../Community/Feed/FeedCard/FeedCard';
import { PortalHeader } from '../../../Community/Portal/PortalHeader/PortalHeader';
import { useMyPortalsStore } from '../../../Community/useMyPortalsStore';
import { getPortalBanner, setPortalMembership } from './PortalBanner.data';
import styles from './PortalBanner.module.css';

// Sayfa altı portal vitrini — asimetrik dergi düzeni (kullanıcı spec'i,
// 2026-09-24): 2 kolonlu grid. SOL: kolonun ÜSTÜNDE dev hook cümlesi (portala
// giden bağlantı), ALTINDA Portal sayfasındaki PortalHeader'ın birebir aynısı
// (ikon, ad, açıklama, Katıl/Joined, sayaçlar) — kullanıcı isteği: hook ile
// profil alt üst yer değiştirdi. SAĞ: "Recent
// Discussions" — portalın en yeni 2 gönderisi, Portal akışındaki FeedCard'ın
// BİREBİR aynısıyla (kullanıcı kararı: "normal postta nasıl görünüyorsa öyle";
// teori olmak zorunda değil, tür süzülmez). Hover'lı cihazlarda her gönderinin
// üstüne gelince hafif sis + "Portala Git" butonu çıkar (gönderi bir teaser'dır,
// tüm yüzeyi portala götürür); dokunmatikte katman yoktur, kartlar normal çalışır. Zemin Portal sayfasındaki panelle aynı: portal accent'i tepede,
// aşağıda siyaha erir. Yapımın portalı yoksa (her yapımın olmayabilir) / çekme
// başarısızsa bölüm hiç basılmaz; gönderi yokken sahte veri yerine davet satırı
// gösterilir.
export default function PortalBanner({ productionSlug }) {
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();
  const [data, setData] = useState(null);
  const sectionRef = useRef(null);
  const identityRef = useRef(null);
  const hookLeadRef = useRef(null);
  const hookActionRef = useRef(null);
  // Çift tık aynı anda iki istek atmasın (Portal.jsx ile aynı korumayı taşır).
  const pending = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getPortalBanner(productionSlug)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [productionSlug]);

  // Reveal YALNIZ veri ilk geldiğinde çalışır: efekt `data` nesnesine değil bu
  // bayrağa bağlı — Katıl/Ayrıl `setData` ile portal nesnesini yeniler, efekt
  // `[data]`'ya bağlı olsaydı bölüm sıfırlanıp yeniden animasyonla girerdi
  // ("joine basınca ekran yenileniyor" hatası).
  const loaded = data !== null;

  // Giriş reveal'ı — RelatedBlogs başlığıyla aynı değerler (fade + rise, tek sefer).
  useEffect(() => {
    if (!loaded) return undefined;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(sectionRef.current, {
          opacity: 0,
          y: 28,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 85%', once: true },
        });
        // Sol kolon SOLDAN kayarak girer (kullanıcı isteği; imza-dalga'nın ters
        // yönü): yukarıdan aşağı sırayla önce hook'un iki satırı, ardından portal
        // profili kademeli — panel `overflow: hidden` olduğu için soldan kırpılarak belirir.
        gsap.from([hookLeadRef.current, hookActionRef.current, identityRef.current], {
          opacity: 0,
          x: -120,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 70%', once: true },
        });
      });
    });
    return () => ctx.revert();
  }, [loaded]);

  if (!data) return null;

  const { portal, threads } = data;
  const portalPath = `/portal/${portal.slug}`;

  // Portal.jsx'teki handleToggleMember'ın aynısı: optimistic sayaç, hatada geri
  // alma, oturumsuz kullanıcı /account'a gider. (Ortak hook'a çıkarma ayrı görev.)
  const handleToggleMember = async () => {
    if (!getStoredAuth()?.token) {
      navigate('/account');
      return;
    }
    if (pending.current) return;
    pending.current = true;
    const next = !portal.isMember;
    const patch = (isMember, memberCount) =>
      setData((d) => (d ? { ...d, portal: { ...d.portal, isMember, memberCount } } : d));
    patch(next, portal.memberCount + (next ? 1 : -1));
    try {
      const res = await setPortalMembership(portal.slug, next);
      patch(res.member, res.memberCount);
      useMyPortalsStore.getState().bump();
    } catch {
      patch(!next, portal.memberCount);
    } finally {
      pending.current = false;
    }
  };

  return (
    <section
      ref={sectionRef}
      className={styles.portalBanner}
      aria-label={portal.name}
      style={portal.accentColor ? { '--portal-theme': portal.accentColor } : undefined}
    >
      <div className={styles.portalBanner__grid}>
        <div className={styles.portalBanner__identity}>
          <Link to={portalPath} className={styles.portalBanner__hook}>
            <span ref={hookLeadRef} className={styles.portalBanner__hookLead}>
              {t('series.portalBanner.hookLead')}
            </span>
            <span ref={hookActionRef} className={styles.portalBanner__hookAction}>
              {t('series.portalBanner.hookAction')}
              <svg viewBox="0 0 24 24" className={styles.portalBanner__hookArrow} aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>

          <div ref={identityRef}>
            <PortalHeader portal={portal} themeColor={portal.accentColor || undefined} onToggleMember={handleToggleMember} />
          </div>
        </div>

        <div className={styles.portalBanner__discussions}>
          <header className={styles.portalBanner__head}>
            <p className={styles.portalBanner__kicker}>{t('series.portalBanner.kicker')}</p>
            <h3 className={styles.portalBanner__heading}>{t('series.portalBanner.heading')}</h3>
          </header>

          {threads.length > 0 ? (
            <div className={styles.portalBanner__list}>
              {threads.map((thread) => (
                <div key={thread.id} className={styles.portalBanner__post}>
                  <FeedCard thread={thread} />
                  <Link to={portalPath} className={styles.portalBanner__gate} aria-label={t('series.portalBanner.cta')}>
                    <span className={styles.portalBanner__gateCta}>
                      {t('series.portalBanner.cta')}
                      <svg viewBox="0 0 24 24" className={styles.portalBanner__gateArrow} aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <Link to={portalPath} className={styles.portalBanner__invite}>
              {t('series.portalBanner.invite')}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
