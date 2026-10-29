import { Suspense, lazy, useEffect, useLayoutEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useParams } from 'react-router-dom';
import gsap from 'gsap';
import { Navbar } from './components/Navbar/Navbar';
import Home from './pages/Home/Home';
import News from './pages/News/News';
import CommunityLayout from './pages/Community/CommunityLayout';
import Feed from './pages/Community/Feed/Feed';
import ThreadDetail from './pages/Community/ThreadDetail/ThreadDetail';
import Portal from './pages/Community/Portal/Portal';
import PortalsIndex from './pages/Community/PortalsIndex/PortalsIndex';
import ProfileView from './pages/Community/ProfileView/ProfileView';
import UserProfile from './pages/Community/UserProfile/UserProfile';
import Library from './pages/Community/Library/Library';
import Lists from './pages/Community/Lists/Lists';
import ListDetailPage from './pages/Community/Lists/ListDetailPage';
import Settings from './pages/Community/Settings/Settings';
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
import Invincible from './pages/Series/Invincible/Invincible';
import InvincibleSeasonDetail from './pages/Series/Invincible/SeasonDetail/SeasonDetail';
import InvincibleEpisodePage from './pages/Series/Invincible/EpisodePage/EpisodePage';
import Silo from './pages/Series/Silo/Silo';
import SiloSeasonDetail from './pages/Series/Silo/SeasonDetail/SeasonDetail';
import SiloEpisodePage from './pages/Series/Silo/EpisodePage/EpisodePage';
import TheLastOfUs from './pages/Series/TheLastOfUs/TheLastOfUs';
import TheLastOfUsSeasonDetail from './pages/Series/TheLastOfUs/SeasonDetail/SeasonDetail';
import TheLastOfUsEpisodePage from './pages/Series/TheLastOfUs/EpisodePage/EpisodePage';
import Euphoria from './pages/Series/Euphoria/Euphoria';
import EuphoriaSeasonDetail from './pages/Series/Euphoria/SeasonDetail/SeasonDetail';
import EuphoriaEpisodePage from './pages/Series/Euphoria/EpisodePage/EpisodePage';
import TheTerror from './pages/Series/TheTerror/TheTerror';
import TheTerrorSeasonDetail from './pages/Series/TheTerror/SeasonDetail/SeasonDetail';
import TheTerrorEpisodePage from './pages/Series/TheTerror/EpisodePage/EpisodePage';
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
import Midsommar from './pages/Movies/Midsommar/Midsommar';
import Pearl from './pages/Movies/Pearl/Pearl';
import Nightcrawler from './pages/Movies/Nightcrawler/Nightcrawler';
import TaxiDriver from './pages/Movies/TaxiDriver/TaxiDriver';
import GoneGirl from './pages/Movies/GoneGirl/GoneGirl';
import TheShining from './pages/Movies/TheShining/TheShining';
import AClockworkOrange from './pages/Movies/AClockworkOrange/AClockworkOrange';
import EyesWideShut from './pages/Movies/EyesWideShut/EyesWideShut';
import Obsession from './pages/Movies/Obsession/Obsession';
import TheLighthouse from './pages/Movies/TheLighthouse/TheLighthouse';
import WutheringHeights from './pages/Movies/WutheringHeights/WutheringHeights';
import Frankenstein from './pages/Movies/Frankenstein/Frankenstein';
import ProjectHailMary from './pages/Movies/ProjectHailMary/ProjectHailMary';
import TheSilenceOfTheLambs from './pages/Movies/TheSilenceOfTheLambs/TheSilenceOfTheLambs';
import Enemy from './pages/Movies/Enemy/Enemy';
import GirlInterrupted from './pages/Movies/GirlInterrupted/GirlInterrupted';
import Sinister from './pages/Movies/Sinister/Sinister';
import Weapons from './pages/Movies/Weapons/Weapons';
import CallMeByYourName from './pages/Movies/CallMeByYourName/CallMeByYourName';
import Challengers from './pages/Movies/Challengers/Challengers';
import Mickey17 from './pages/Movies/Mickey17/Mickey17';
import TheOdyssey from './pages/Movies/TheOdyssey/TheOdyssey';
import Memento from './pages/Movies/Memento/Memento';
import AmericanPsycho from './pages/Movies/AmericanPsycho/AmericanPsycho';
import Blog from './pages/Blog/Blog';
import BlogPost from './pages/Blog/BlogPost/BlogPost';
import SeriesHeroList from './pages/Admin/SeriesHeroList/SeriesHeroList';
import SeriesHeroEditor from './pages/Admin/SeriesHeroEditor/SeriesHeroEditor';
import PageBuilder from './pages/Admin/PageBuilder/PageBuilder';
import AdminLayout from './pages/Admin/AdminLayout/AdminLayout';
import { RequireAuth } from './pages/Admin/RequireAuth';

// Yeni admin paneli (src/admin) lazy-load — public bundle'a girmez.
const AdminShell = lazy(() => import('./admin/AdminShell/AdminShell'));
const AdminGenel = lazy(() => import('./admin/Genel/Genel'));
const AdminBlogList = lazy(() => import('./admin/Blogs/BlogList/BlogList'));
const AdminBlogEditor = lazy(() => import('./admin/Blogs/BlogEditor/BlogEditor'));
const AdminEntityRoute = lazy(() => import('./admin/entities/AdminEntityRoute/AdminEntityRoute'));
import Placeholder from './pages/Placeholder/Placeholder';
import Account from './pages/Account/Account';
import MotionLab from './pages/MotionLab/MotionLab';
import { LangGate, LegacyRedirect } from './shared/i18n/LangGate';
import { trackLocation } from './shared/navigation/returnTo';
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
  const { pathname, search } = useLocation();
  const pageRef = useRef(null);
  const prevPathname = useRef(null);

  // Giriş sonrası "geldiğin yere dön" için son içerik konumu (shared/navigation).
  useEffect(() => {
    trackLocation(pathname + search);
  }, [pathname, search]);

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

// Yeni admin paneli (/admin, /admin/blogs…) kendi kabuğunu taşır → public
// Navbar gizlenir. Eski araçlar (PageBuilder, SeriesHero) Navbar'lı kalır
// (PageBuilder `100vh - 56px`'e göre yazıldı).
function PublicNavbar() {
  const { pathname } = useLocation();
  const hasOwnShell = /^\/admin(\/(blogs|series|movies)(\/.*)?)?\/?$/.test(pathname);
  return hasOwnShell ? null : <Navbar />;
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
      <PublicNavbar />
      <PageTransition>
        <Routes>
          {/* Admin — dil prefix'ine dahil değil, path'ler değişmedi. Tek
              RequireAuth guard'ı (rol kontrollü) hepsini sarar; sidebar
              kabuğu (AdminLayout) yalnız liste/ana sayfalarda, tam ekran
              editörler kabuğun dışında. */}
          <Route element={<RequireAuth />}>
            <Route
              path="/admin"
              element={
                <Suspense fallback={null}>
                  <AdminShell />
                </Suspense>
              }
            >
              <Route index element={<AdminGenel />} />
              <Route path="blogs" element={<AdminBlogList />} />
              <Route path="blogs/new" element={<AdminBlogEditor />} />
              <Route path="blogs/:id" element={<AdminBlogEditor />} />
              {/* Kayıt defterindeki üst-seviye varlıklar ve iç içe alt varlıkları: yol
                  AdminEntityRoute içinde çözülür. Segmentler STATİK olmak zorunda: `*` ya da
                  `:entity` rotası, public `/:lang/series/:slug` ile (lang=admin) puan eşitliğine
                  düşüp ana sayfaya yönleniyordu. Yeni üst-seviye varlık = buraya bir satır. */}
              <Route path="series/*" element={<AdminEntityRoute />} />
              <Route path="movies/*" element={<AdminEntityRoute />} />
            </Route>
            <Route element={<AdminLayout />}>
              <Route path="/admin/series-hero" element={<SeriesHeroList />} />
            </Route>
            <Route path="/admin/page-builder" element={<PageBuilder />} />
            <Route path="/admin/series-hero/:seriesId" element={<SeriesHeroEditor />} />
          </Route>
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
            <Route path="series/invincible" element={<Invincible />} />
            <Route
              path="series/invincible/seasons/:seasonNumber/episodes/:episodeNumber"
              element={<InvincibleEpisodePage />}
            />
            <Route path="series/invincible/seasons/:seasonNumber" element={<InvincibleSeasonDetail />} />
            <Route path="series/silo" element={<Silo />} />
            <Route
              path="series/silo/seasons/:seasonNumber/episodes/:episodeNumber"
              element={<SiloEpisodePage />}
            />
            <Route path="series/silo/seasons/:seasonNumber" element={<SiloSeasonDetail />} />
            <Route path="series/the-last-of-us" element={<TheLastOfUs />} />
            <Route
              path="series/the-last-of-us/seasons/:seasonNumber/episodes/:episodeNumber"
              element={<TheLastOfUsEpisodePage />}
            />
            <Route path="series/the-last-of-us/seasons/:seasonNumber" element={<TheLastOfUsSeasonDetail />} />
            <Route path="series/euphoria" element={<Euphoria />} />
            <Route
              path="series/euphoria/seasons/:seasonNumber/episodes/:episodeNumber"
              element={<EuphoriaEpisodePage />}
            />
            <Route path="series/euphoria/seasons/:seasonNumber" element={<EuphoriaSeasonDetail />} />
            <Route path="series/the-terror" element={<TheTerror />} />
            <Route
              path="series/the-terror/seasons/:seasonNumber/episodes/:episodeNumber"
              element={<TheTerrorEpisodePage />}
            />
            <Route path="series/the-terror/seasons/:seasonNumber" element={<TheTerrorSeasonDetail />} />
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
            <Route path="movies/midsommar" element={<Midsommar />} />
            <Route path="movies/pearl" element={<Pearl />} />
            <Route path="movies/nightcrawler" element={<Nightcrawler />} />
            <Route path="movies/taxi-driver" element={<TaxiDriver />} />
            <Route path="movies/gone-girl" element={<GoneGirl />} />
            <Route path="movies/the-shining" element={<TheShining />} />
            <Route path="movies/a-clockwork-orange" element={<AClockworkOrange />} />
            <Route path="movies/eyes-wide-shut" element={<EyesWideShut />} />
            <Route path="movies/obsession" element={<Obsession />} />
            <Route path="movies/the-lighthouse" element={<TheLighthouse />} />
            <Route path="movies/wuthering-heights" element={<WutheringHeights />} />
            <Route path="movies/frankenstein" element={<Frankenstein />} />
            <Route path="movies/project-hail-mary" element={<ProjectHailMary />} />
            <Route path="movies/the-silence-of-the-lambs" element={<TheSilenceOfTheLambs />} />
            <Route path="movies/enemy" element={<Enemy />} />
            <Route path="movies/girl-interrupted" element={<GirlInterrupted />} />
            <Route path="movies/sinister" element={<Sinister />} />
            <Route path="movies/weapons" element={<Weapons />} />
            <Route path="movies/call-me-by-your-name" element={<CallMeByYourName />} />
            <Route path="movies/challengers" element={<Challengers />} />
            <Route path="movies/mickey-17" element={<Mickey17 />} />
            <Route path="movies/the-odyssey" element={<TheOdyssey />} />
            <Route path="movies/memento" element={<Memento />} />
            <Route path="movies/american-psycho" element={<AmericanPsycho />} />
            <Route path="movies/:slug" element={<ProductionDetail type="movie" />} />
            <Route path="movies" element={<Movies />} />
            {/* Yol-siz layout route: /community ve /portal aynı CommunityLayout
                örneğini paylaşır — aralarında geçişte sol/sağ menü remount olmaz. */}
            <Route element={<CommunityLayout />}>
              <Route path="community" element={<Feed />} />
              <Route path="community/profile" element={<ProfileView />} />
              <Route path="community/u/:username" element={<UserProfile />} />
              <Route path="community/library/:tab" element={<Library />} />
              <Route path="community/lists" element={<Lists />} />
              <Route path="community/lists/:id" element={<ListDetailPage />} />
              <Route path="community/settings" element={<Settings />} />
              <Route path="community/discussion" element={<Feed surface="DISCUSSION" />} />
              <Route path="community/theories" element={<Feed surface="THEORY" />} />
              <Route path="community/fan-art" element={<Feed surface="FAN_ART" />} />
              {/* Thread detay — layout İÇİNDE: sol/sağ menü sabit kalır, yalnız
                  orta sütundaki Feed unmount olup yerine ThreadDetail gelir (PRD).
                  Birincil: hibrit URL (id ile sorgulanır, slug süs). Eski
                  /community/<yüzey>/:slug linkleri ThreadDetail'de kanonik
                  URL'e replace edilir — paylaşılmış linkler kırılmaz. */}
              <Route path="portal" element={<PortalsIndex />} />
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
