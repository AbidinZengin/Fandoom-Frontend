import { useEffect, useLayoutEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useParams } from 'react-router-dom';
import gsap from 'gsap';
import { Navbar } from './components/Navbar/Navbar';
import Home from './pages/Home/Home';
import News from './pages/News/News';
import Community from './pages/Community/Community';
import GameOfThrones from './pages/series/GameOfThrones/GameOfThrones';
import BreakingBad from './pages/series/BreakingBad/BreakingBad';
import SeasonDetail from './pages/series/BreakingBad/SeasonDetail/SeasonDetail';
import SeasonEpisodes from './pages/series/GameOfThrones/SeasonEpisodes/SeasonEpisodes';
import BreakingBadSeasonEpisodes from './pages/series/BreakingBad/SeasonEpisodes/SeasonEpisodes';
import EpisodePage from './pages/series/GameOfThrones/EpisodePage/EpisodePage';
import BreakingBadEpisodePage from './pages/series/BreakingBad/EpisodePage/EpisodePage';
import Characters from './pages/series/GameOfThrones/Characters/Characters';
import WesterosMap from './pages/series/GameOfThrones/WorldMap/WorldMap';
import History from './pages/series/GameOfThrones/History/History';
import ProductionDetail from './pages/ProductionDetail/ProductionDetail';
import Blog from './pages/Blog/Blog';
import BlogPost from './pages/Blog/BlogPost/BlogPost';
import Login from './pages/Admin/Login/Login';
import BlogList from './pages/Admin/BlogList/BlogList';
import BlogEditor from './pages/Admin/BlogEditor/BlogEditor';
import SeriesHeroList from './pages/Admin/SeriesHeroList/SeriesHeroList';
import SeriesHeroEditor from './pages/Admin/SeriesHeroEditor/SeriesHeroEditor';
import AdminHome from './pages/Admin/AdminHome/AdminHome';
import PageBuilder from './pages/Admin/PageBuilder/PageBuilder';
import { RequireAuth } from './pages/Admin/RequireAuth';
import Placeholder from './pages/Placeholder/Placeholder';
import FlameLab from './pages/FlameLab/FlameLab';
import { initMotion } from './motion/setup';
import {
  isCinematicArmed,
  isInPageNavArmed,
  isBlogFlipArmed,
  isBlogReturnArmed,
} from './motion/cinematic';

// Route değişiminde: sayfa anında en üste döner (useLayoutEffect — eski scroll
// pozisyonu tek frame bile görünmesin) ve yeni sayfa app zemininden (--bg)
// kısa bir opacity fade ile belirir — arkada görsel olsa da geçiş koyu renk
// üstünden yumuşar. prefers-reduced-motion'da fade atlanır.
function PageTransition({ children }) {
  const { pathname } = useLocation();
  const pageRef = useRef(null);

  useLayoutEffect(() => {
    // Blog'dan geri dönüşte scroll'u RelatedContent kendisi geri yükler
    // (bırakılan konum) — burada başa sarmak küçülen klonun ineceği kartı
    // ekrandan çıkarırdı.
    if (isBlogReturnArmed()) return;
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
    // Blog devri/geri dönüşü kendi klonuyla kesintisiz akar — üstüne bir de
    // sayfa fade'i binerse geçiş "yanıp söner".
    if (isCinematicArmed() || isInPageNavArmed() || isBlogFlipArmed() || isBlogReturnArmed()) {
      return undefined;
    }

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

// Blog'dan blog'a geçiş AYNI route'u eşler (yalnız :slug değişir) — React
// Router bu durumda component instance'ını KORUR, remount etmez. BlogPost'un
// giriş/flip mantığı ise mount-zamanlı (useState initializer +
// useLayoutEffect), o yüzden slug değişince elle remount tetiklenir: her
// açılış "sıfırdan" gibi davranır (learned-rules: her girişte AYNI animasyon
// oynar).
function BlogPostRoute() {
  const { slug } = useParams();
  return <BlogPost key={slug} />;
}

function App() {
  useEffect(() => {
    initMotion();
    // Scroll'u zaten PageTransition elle yönetiyor (her route değişiminde
    // başa sarar). Tarayıcının kendi geri-yüklemesi buna ASENKRON olarak
    // müdahale ediyor: Blog'dan geri dönüşte kendi konumlandırmamızı
    // (pin başı) ezip eski pozisyona sıçratıyordu.
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
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
          <Route path="/series/game-of-thrones/characters" element={<Characters />} />
          <Route path="/series/game-of-thrones/westeros" element={<WesterosMap />} />
          <Route path="/series/game-of-thrones/history" element={<History />} />
          <Route path="/series/breaking-bad" element={<BreakingBad />} />
          <Route path="/series/breaking-bad/seasons" element={<BreakingBadSeasonEpisodes />} />
          <Route
            path="/series/breaking-bad/seasons/:seasonNumber/episodes/:episodeNumber"
            element={<BreakingBadEpisodePage />}
          />
          <Route path="/series/breaking-bad/seasons/:seasonNumber" element={<SeasonDetail />} />
          <Route path="/series/:slug" element={<ProductionDetail type="series" />} />
          <Route path="/series" element={<Placeholder title="Series" />} />
          <Route path="/movies/:slug" element={<ProductionDetail type="movie" />} />
          <Route path="/movies" element={<Placeholder title="Movies" />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/discussion" element={<Placeholder title="Discussion" />} />
          <Route path="/community/theories" element={<Placeholder title="Theories" />} />
          <Route path="/community/fan-art" element={<Placeholder title="Fan Art" />} />
          <Route path="/news" element={<News />} />
          <Route path="/blog/:slug" element={<BlogPostRoute />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminHome />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/page-builder"
            element={
              <RequireAuth>
                <PageBuilder />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/blogs"
            element={
              <RequireAuth>
                <BlogList />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/blogs/new"
            element={
              <RequireAuth>
                <BlogEditor />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/blogs/:id"
            element={
              <RequireAuth>
                <BlogEditor />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/series-hero"
            element={
              <RequireAuth>
                <SeriesHeroList />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/series-hero/:seriesId"
            element={
              <RequireAuth>
                <SeriesHeroEditor />
              </RequireAuth>
            }
          />
          <Route path="/support" element={<Placeholder title="Support" />} />
          <Route path="/coming-soon" element={<Placeholder title="Coming Soon" />} />
          <Route path="/shop" element={<Placeholder title="Shop" />} />
          <Route path="/account" element={<Placeholder title="Account" />} />
          {/* Geçici — alev shader'ı onaylanınca kaldırılacak */}
          <Route path="/flame-lab" element={<FlameLab />} />
        </Routes>
      </PageTransition>
    </BrowserRouter>
  );
}

export default App;
