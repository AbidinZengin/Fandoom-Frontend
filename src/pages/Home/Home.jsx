import { useEffect, useState } from 'react';
import { Hero } from './Hero/Hero';
import { FeaturedCarousel } from './FeaturedCarousel/FeaturedCarousel';
import { PosterWall } from './PosterWall/PosterWall';
import { BlogSpotlight } from './BlogSpotlight/BlogSpotlight';
import { CommunitySpotlight } from './CommunitySpotlight/CommunitySpotlight';
import { Footer } from '../../components/Footer/Footer';

export default function Home() {
  // Explore kapısı: serbest scroll yok — Explore butonu YA DA ilk scroll
  // niyeti (tekerlek/swipe/klavye) kapıyı açar; sayfa Hero'nun bir altındaki
  // bölüme kayar (kullanıcı kararı: scroll
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
      <Hero explored={explored} onExplore={() => setExplored(true)} />
      <PosterWall />
            <FeaturedCarousel play={explored} />

      <BlogSpotlight />
      <CommunitySpotlight />

      <Footer />
    </>
  );
}
