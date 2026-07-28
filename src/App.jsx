import { useEffect, useLayoutEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { Navbar } from './components/Navbar/Navbar';
import Home from './pages/Home/Home';
import News from './pages/News/News';
import Community from './pages/Community/Community';
import GameOfThrones from './pages/series/GameOfThrones/GameOfThrones';
import SeasonEpisodes from './pages/series/GameOfThrones/SeasonEpisodes/SeasonEpisodes';
import EpisodePage from './pages/series/GameOfThrones/EpisodePage/EpisodePage';
import ProductionDetail from './pages/ProductionDetail/ProductionDetail';
import Placeholder from './pages/Placeholder/Placeholder';
import { initMotion } from './motion/setup';
import { isCinematicArmed, isInPageNavArmed } from './motion/cinematic';

// Route değişiminde: sayfa anında en üste döner (useLayoutEffect — eski scroll
// pozisyonu tek frame bile görünmesin) ve yeni sayfa app zemininden (--bg)
// kısa bir opacity fade ile belirir — arkada görsel olsa da geçiş koyu renk
// üstünden yumuşar. prefers-reduced-motion'da fade atlanır.
function PageTransition({ children }) {
  const { pathname } = useLocation();
  const pageRef = useRef(null);

  useLayoutEffect(() => {
    // Sayfa içi bölüm/sezon değişiminde sayfa yerinde durur — başa sarmak
    // kullanıcıyı yerinden oynatır.
    if (!isInPageNavArmed()) window.scrollTo(0, 0);
    // Carousel'in cinematic geçişi eski sayfayı '#root' üzerinden karartır —
    // yeni sayfa boyanmadan kök her durumda geri açılır.
    gsap.killTweensOf('#root');
    gsap.set('#root', { clearProps: 'opacity' });
  }, [pathname]);

  useEffect(() => {
    // Cinematic gelişte reveal'i hedef Hero üstlenir; buradaki fade
    // üstüne binip şeridi soluklaştırırdı. Sayfa içi param değişiminde
    // (bölüm/sezon) ise sayfa yerinde kalır — tüm sayfayı 0'dan fade'lemek
    // yanıp sönme yaratır ve component'in kendi crossfade'iyle çakışır.
    if (isCinematicArmed() || isInPageNavArmed()) return undefined;

    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        pageRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: 'power2.out', clearProps: 'opacity' }
      );
    });

    return () => mm.revert();
  }, [pathname]);

  return <div ref={pageRef}>{children}</div>;
}

function App() {
  useEffect(() => {
    initMotion();
  }, []);

  return (
    <BrowserRouter>
      {/* Navbar geçiş fade'inin DIŞINDA — route değişiminde yenilenmez */}
      <Navbar />
      <PageTransition>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/series/game-of-thrones" element={<GameOfThrones />} />
          <Route path="/series/game-of-thrones/seasons" element={<SeasonEpisodes />} />
          <Route
            path="/series/game-of-thrones/seasons/:seasonNumber/episodes/:episodeNumber"
            element={<EpisodePage />}
          />
          <Route path="/series/:slug" element={<ProductionDetail type="series" />} />
          <Route path="/series" element={<Placeholder title="Series" />} />
          <Route path="/movies/:slug" element={<ProductionDetail type="movie" />} />
          <Route path="/movies" element={<Placeholder title="Movies" />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/discussion" element={<Placeholder title="Discussion" />} />
          <Route path="/community/theories" element={<Placeholder title="Theories" />} />
          <Route path="/community/fan-art" element={<Placeholder title="Fan Art" />} />
          <Route path="/news" element={<News />} />
          <Route path="/blog" element={<Placeholder title="Blog" />} />
          <Route path="/support" element={<Placeholder title="Support" />} />
          <Route path="/coming-soon" element={<Placeholder title="Coming Soon" />} />
          <Route path="/shop" element={<Placeholder title="Shop" />} />
          <Route path="/account" element={<Placeholder title="Account" />} />
        </Routes>
      </PageTransition>
    </BrowserRouter>
  );
}

export default App;
