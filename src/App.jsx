import { useEffect, useLayoutEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useParams } from 'react-router-dom';
import gsap from 'gsap';
import { Navbar } from './components/Navbar/Navbar';
import Home from './pages/Home/Home';
import News from './pages/News/News';
import CommunityLayout from './pages/Community/CommunityLayout';
import Feed from './pages/Community/Feed/Feed';
import ThreadDetail from './pages/Community/ThreadDetail/ThreadDetail';
import Portal from './pages/Community/Portal/Portal';
import ProfileView from './pages/Community/ProfileView/ProfileView';
import GameOfThrones from './pages/Series/GameOfThrones/GameOfThrones';
import BreakingBad from './pages/Series/BreakingBad/BreakingBad';
import HouseOfTheDragon from './pages/Series/HouseOfTheDragon/HouseOfTheDragon';
import Severance from './pages/Series/Severance/Severance';
import Pluribus from './pages/Series/Pluribus/Pluribus';
import From from './pages/Series/From/From';
import ItWelcomeToDerry from './pages/Series/ItWelcomeToDerry/ItWelcomeToDerry';
import StrangerThings from './pages/Series/StrangerThings/StrangerThings';
import SeasonDetail from './pages/Series/BreakingBad/SeasonDetail/SeasonDetail';
import HouseOfTheDragonSeasonDetail from './pages/Series/HouseOfTheDragon/SeasonDetail/SeasonDetail';
import SeasonEpisodes from './pages/Series/GameOfThrones/SeasonEpisodes/SeasonEpisodes';
import BreakingBadSeasonEpisodes from './pages/Series/BreakingBad/SeasonEpisodes/SeasonEpisodes';
import EpisodePage from './pages/Series/GameOfThrones/EpisodePage/EpisodePage';
import BreakingBadEpisodePage from './pages/Series/BreakingBad/EpisodePage/EpisodePage';
import HouseOfTheDragonEpisodePage from './pages/Series/HouseOfTheDragon/EpisodePage/EpisodePage';
import SeveranceSeasonDetail from './pages/Series/Severance/SeasonDetail/SeasonDetail';
import SeveranceEpisodePage from './pages/Series/Severance/EpisodePage/EpisodePage';
import PluribusSeasonDetail from './pages/Series/Pluribus/SeasonDetail/SeasonDetail';
import PluribusEpisodePage from './pages/Series/Pluribus/EpisodePage/EpisodePage';
import FromSeasonDetail from './pages/Series/From/SeasonDetail/SeasonDetail';
import FromEpisodePage from './pages/Series/From/EpisodePage/EpisodePage';
import ItWelcomeToDerrySeasonDetail from './pages/Series/ItWelcomeToDerry/SeasonDetail/SeasonDetail';
import ItWelcomeToDerryEpisodePage from './pages/Series/ItWelcomeToDerry/EpisodePage/EpisodePage';
import StrangerThingsSeasonDetail from './pages/Series/StrangerThings/SeasonDetail/SeasonDetail';
import StrangerThingsEpisodePage from './pages/Series/StrangerThings/EpisodePage/EpisodePage';
import TheBoys from './pages/Series/TheBoys/TheBoys';
import TheBoysSeasonDetail from './pages/Series/TheBoys/SeasonDetail/SeasonDetail';
import TheBoysEpisodePage from './pages/Series/TheBoys/EpisodePage/EpisodePage';
import Characters from './pages/Series/GameOfThrones/Characters/Characters';
import WesterosMap from './pages/Series/GameOfThrones/WorldMap/WorldMap';
import History from './pages/Series/GameOfThrones/History/History';
import ProductionDetail from './pages/ProductionDetail/ProductionDetail';
import Series from './pages/Series/Series';
import Movies from './pages/Movies/Movies';
import DunePartTwo from './pages/Movies/DunePartTwo/DunePartTwo';
import TheBatman from './pages/Movies/TheBatman/TheBatman';
import BladeRunner2049 from './pages/Movies/BladeRunner2049/BladeRunner2049';
import Interstellar from './pages/Movies/Interstellar/Interstellar';
import BlackSwan from './pages/Movies/BlackSwan/BlackSwan';
import MulhollandDrive from './pages/Movies/MulhollandDrive/MulhollandDrive';
import Parasite from './pages/Movies/Parasite/Parasite';
import Zodiac from './pages/Movies/Zodiac/Zodiac';
import TheFall from './pages/Movies/TheFall/TheFall';
import AnatomyOfAFall from './pages/Movies/AnatomyOfAFall/AnatomyOfAFall';
import RequiemForADream from './pages/Movies/RequiemForADream/RequiemForADream';
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
import Account from './pages/Account/Account';
import MotionLab from './pages/MotionLab/MotionLab';
import { LangGate, LegacyRedirect } from './shared/i18n/LangGate';
import { initMotion } from './motion/setup';
import {
  armCinematic,
  isCinematicArmed,
  isCinematicHeroPath,
  isInPageNavArmed,
  isBlogFlipArmed,
  isBlogReturnArmed,
} from './motion/cinematic';

// Route değişiminde: sayfa anında en üste döner (useLayoutEffect — eski scroll
// pozisyonu tek frame bile görünmesin) ve yeni sayfa app zemininden (--bg)
// kısa bir opacity fade ile belirir — arkada görsel olsa da geçiş koyu renk
// üstünden yumuşar. prefers-reduced-motion'da fade atlanır.
// Community içi geçiş (sekme değişimi, feed↔thread detay): sol/sağ menü ekranda
// SABİT kalmalı (PRD) — sayfa fade'i onları da yakıp söndürürdü, o yüzden
// yalnız fade atlanır (scroll sıfırlama aynen çalışır). İlk giriş fade'i korunur.
// /portal/... de aynı CommunityLayout'un içindedir (Portal = Oda).
const COMMUNITY_PATH = /^\/(?:[a-z]{2}\/)?(?:community|portal)(?:\/|$)/;

function PageTransition({ children }) {
  const { pathname } = useLocation();
  const pageRef = useRef(null);
  const prevPathname = useRef(null);

  useLayoutEffect(() => {
    // Blog'dan geri dönüşte scroll'u RelatedContent kendisi geri yükler
    // (bırakılan konum) — burada başa sarmak küçülen klonun ineceği kartı
    // ekrandan çıkarırdı.
    if (isBlogReturnArmed()) return;
    // Cinematic Hero'lu yapım sayfasına HER giriş şerit reveal alır (yalnız
    // carousel değil): bayrak burada kurulur, Hero mount'ta okur, aşağıdaki
    // sayfa fade'i de bu yüzden atlanır.
    if (isCinematicHeroPath(pathname)) armCinematic();
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
    const withinCommunity = COMMUNITY_PATH.test(prevPathname.current ?? '') && COMMUNITY_PATH.test(pathname);
    prevPathname.current = pathname;
    if (withinCommunity || isCinematicArmed() || isInPageNavArmed() || isBlogFlipArmed() || isBlogReturnArmed()) {
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
          {/* Admin — dil prefix'ine dahil değil, path'ler değişmedi */}
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
          {/* Dil-prefixli uygulama — path'ler /:lang'e göre relative */}
          <Route path="/:lang" element={<LangGate />}>
            <Route index element={<Home />} />
            <Route path="series/game-of-thrones" element={<GameOfThrones />} />
            <Route path="series/game-of-thrones/seasons" element={<SeasonEpisodes />} />
            <Route
              path="series/game-of-thrones/seasons/:seasonNumber/episodes/:episodeNumber"
              element={<EpisodePage />}
            />
            <Route path="series/game-of-thrones/characters" element={<Characters />} />
            <Route path="series/game-of-thrones/westeros" element={<WesterosMap />} />
            <Route path="series/game-of-thrones/history" element={<History />} />
            <Route path="series/breaking-bad" element={<BreakingBad />} />
            <Route path="series/breaking-bad/seasons" element={<BreakingBadSeasonEpisodes />} />
            <Route
              path="series/breaking-bad/seasons/:seasonNumber/episodes/:episodeNumber"
              element={<BreakingBadEpisodePage />}
            />
            <Route path="series/breaking-bad/seasons/:seasonNumber" element={<SeasonDetail />} />
            <Route path="series/house-of-the-dragon" element={<HouseOfTheDragon />} />
            <Route path="series/house-of-the-dragon/seasons" element={<Placeholder titleKey="series.seasonsHeading" />} />
            <Route
              path="series/house-of-the-dragon/seasons/:seasonNumber/episodes/:episodeNumber"
              element={<HouseOfTheDragonEpisodePage />}
            />
            <Route path="series/house-of-the-dragon/seasons/:seasonNumber" element={<HouseOfTheDragonSeasonDetail />} />
            <Route path="series/severance" element={<Severance />} />
            <Route
              path="series/severance/seasons/:seasonNumber/episodes/:episodeNumber"
              element={<SeveranceEpisodePage />}
            />
            <Route path="series/severance/seasons/:seasonNumber" element={<SeveranceSeasonDetail />} />
            <Route path="series/pluribus" element={<Pluribus />} />
            <Route
              path="series/pluribus/seasons/:seasonNumber/episodes/:episodeNumber"
              element={<PluribusEpisodePage />}
            />
            <Route path="series/pluribus/seasons/:seasonNumber" element={<PluribusSeasonDetail />} />
            <Route path="series/from" element={<From />} />
            <Route
              path="series/from/seasons/:seasonNumber/episodes/:episodeNumber"
              element={<FromEpisodePage />}
            />
            <Route path="series/from/seasons/:seasonNumber" element={<FromSeasonDetail />} />
            <Route path="series/it-welcome-to-derry" element={<ItWelcomeToDerry />} />
            <Route
              path="series/it-welcome-to-derry/seasons/:seasonNumber/episodes/:episodeNumber"
              element={<ItWelcomeToDerryEpisodePage />}
            />
            <Route path="series/it-welcome-to-derry/seasons/:seasonNumber" element={<ItWelcomeToDerrySeasonDetail />} />
            <Route path="series/stranger-things" element={<StrangerThings />} />
            <Route
              path="series/stranger-things/seasons/:seasonNumber/episodes/:episodeNumber"
              element={<StrangerThingsEpisodePage />}
            />
            <Route path="series/stranger-things/seasons/:seasonNumber" element={<StrangerThingsSeasonDetail />} />
            <Route path="series/the-boys" element={<TheBoys />} />
            <Route
              path="series/the-boys/seasons/:seasonNumber/episodes/:episodeNumber"
              element={<TheBoysEpisodePage />}
            />
            <Route path="series/the-boys/seasons/:seasonNumber" element={<TheBoysSeasonDetail />} />
            <Route path="series/:slug" element={<ProductionDetail type="series" />} />
            <Route path="series" element={<Series />} />
            <Route path="movies/dune-part-two" element={<DunePartTwo />} />
            <Route path="movies/the-batman" element={<TheBatman />} />
            <Route path="movies/blade-runner-2049" element={<BladeRunner2049 />} />
            <Route path="movies/interstellar" element={<Interstellar />} />
            <Route path="movies/black-swan" element={<BlackSwan />} />
            <Route path="movies/mulholland-drive" element={<MulhollandDrive />} />
            <Route path="movies/parasite" element={<Parasite />} />
            <Route path="movies/zodiac" element={<Zodiac />} />
            <Route path="movies/the-fall" element={<TheFall />} />
            <Route path="movies/anatomy-of-a-fall" element={<AnatomyOfAFall />} />
            <Route path="movies/requiem-for-a-dream" element={<RequiemForADream />} />
            <Route path="movies/:slug" element={<ProductionDetail type="movie" />} />
            <Route path="movies" element={<Movies />} />
            {/* Yol-siz layout route: /community ve /portal aynı CommunityLayout
                örneğini paylaşır — aralarında geçişte sol/sağ menü remount olmaz. */}
            <Route element={<CommunityLayout />}>
              <Route path="community" element={<Feed />} />
              <Route path="community/profile" element={<ProfileView />} />
              <Route path="community/discussion" element={<Feed surface="DISCUSSION" />} />
              <Route path="community/theories" element={<Feed surface="THEORY" />} />
              <Route path="community/fan-art" element={<Feed surface="FAN_ART" />} />
              {/* Thread detay — layout İÇİNDE: sol/sağ menü sabit kalır, yalnız
                  orta sütundaki Feed unmount olup yerine ThreadDetail gelir (PRD).
                  Birincil: hibrit URL (id ile sorgulanır, slug süs). Eski
                  /community/<yüzey>/:slug linkleri ThreadDetail'de kanonik
                  URL'e replace edilir — paylaşılmış linkler kırılmaz. */}
              <Route path="portal/:portalSlug" element={<Portal />} />
              <Route path="portal/:portalSlug/post/:idSlug" element={<ThreadDetail />} />
              <Route path="community/discussion/:slug" element={<ThreadDetail />} />
              <Route path="community/theories/:slug" element={<ThreadDetail />} />
              <Route path="community/fan-art/:slug" element={<ThreadDetail />} />
            </Route>
            <Route path="news" element={<News />} />
            <Route path="blog/:slug" element={<BlogPostRoute />} />
            <Route path="blog" element={<Blog />} />
            <Route path="support" element={<Placeholder titleKey="navbar.support" />} />
            <Route path="coming-soon" element={<Placeholder titleKey="navbar.comingSoon" />} />
            <Route path="shop" element={<Placeholder titleKey="navbar.shop" />} />
            {/* TEK wildcard route (kullanıcı isteği, 2026-08-31: "Spotify gibi
                sol bar yerinde kalmalı") — "account" ve "account/lists/:id"
                ayrı <Route> girdileri olsaydı React Router aralarında geçişte
                <Account/> öğesini REMOUNT ederdi (farklı route id, element
                aynı olsa bile) ve sidebar/oturum kontrolü sıfırdan çalışırdı.
                Tek girdi olunca Account hiç unmount olmuyor, DashboardView
                URL'den (useLocation, bkz. kendi yorumu) liste id'sini okuyup
                paneli değiştiriyor. */}
            <Route path="account/*" element={<Account />} />
            {/* Geçici — PinLoad video mekanizması denemesi, yerleşim onaylanınca kaldırılacak */}
            <Route path="motion-lab" element={<MotionLab />} />
          </Route>

          {/* Prefix'siz eski path'ler — kök "/", "/series/breaking-bad" vb. */}
          <Route path="*" element={<LegacyRedirect />} />
        </Routes>
      </PageTransition>
    </BrowserRouter>
  );
}

export default App;
