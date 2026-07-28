import { useEffect, useState } from 'react';
import { Hero } from './Hero/Hero';
import { FeaturedCarousel } from './FeaturedCarousel/FeaturedCarousel';
import { ContentSection } from './ContentSection/ContentSection';
import { Footer } from '../../components/Footer/Footer';
import { theories, news, blogPosts } from './Home.data';

export default function Home() {
  // Explore kapısı: serbest scroll yok — Explore butonu YA DA ilk scroll
  // niyeti (tekerlek/swipe/klavye) kapıyı açar; sayfa Featured Titles'a
  // kayar ve giriş dalgası o anda başlar (kullanıcı kararı: scroll
  // denemesi "site bozuk" hissi vermesin).
  const [explored, setExplored] = useState(false);

  useEffect(() => {
    if (explored) return undefined;
    document.body.style.overflow = 'hidden';

    const open = () => setExplored(true);
    const onWheel = (e) => {
      if (e.deltaY > 0) open();
    };
    const onKeyDown = (e) => {
      if (['ArrowDown', 'PageDown', 'End'].includes(e.key)) open();
      // Space yalnız sayfa zeminindeyken scroll niyetidir (buton/inputta değil)
      if (e.key === ' ' && e.target === document.body) open();
    };
    let touchStartY = 0;
    const onTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      if (touchStartY - e.touches[0].clientY > 24) open();
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [explored]);

  return (
    <>
      <Hero onExplore={() => setExplored(true)} />
      <FeaturedCarousel play={explored} />

      <ContentSection
        kicker="Community"
        heading="Top Theories"
        items={theories}
        renderMeta={(item) => (
          <>
            <span>{item.author}</span>
            <span>&middot;</span>
            <span>{item.votes} votes</span>
          </>
        )}
      />

      <ContentSection
        kicker="Newsroom"
        heading="Latest News"
        items={news}
        mirror
        renderMeta={(item) => <span>{item.date}</span>}
      />

      <ContentSection
        kicker="Editorial"
        heading="Featured Blog Posts"
        items={blogPosts}
        renderMeta={(item) => <span>{item.readTime}</span>}
      />

      <Footer />
    </>
  );
}
