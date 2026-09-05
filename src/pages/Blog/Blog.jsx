import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { isBlogReturnArmed } from '../../motion/cinematic';
import { Footer } from '../../components/Footer/Footer';
import { SpotlightCard } from './SpotlightCard/SpotlightCard';
import { TopBlogsRow } from './TopBlogsRow/TopBlogsRow';
import { SideList } from './SideList/SideList';
import { FilterPanel } from './FilterPanel/FilterPanel';
import { EMPTY_FILTERS } from './FilterPanel/filterDefaults';
import { FilterResults } from './FilterResults/FilterResults';
import { SeasonReviews } from './SeasonReviews/SeasonReviews';
import { getBlogFacets, getBlogFilterResults, getBlogHub } from './Blog.data';
import styles from './Blog.module.css';

const EMPTY_RESULTS = { items: [], page: 0, totalPages: 0, totalElements: 0, loading: false, error: false };

// Blog hub yüzeyi. Kullanıcı wireframe'inden ölçüldü: sol kolon (öne çıkan
// kutu + top 10 şeridi) / sağ kolon (featured + latest rayları). Editor's
// Pick ve Top 10 Blogs gerçek veriyle beslenir (Blog.data.js); FEATURED/
// LATEST şimdilik kapsam dışı — placeholder kalıyor.
//
// Filter paneli açılıp "Apply" ile bir sonuç seti uygulanınca (browseMode)
// bu küratörlü bölümlerin YERİNE GET /api/blogs/hub sonuç grid'i geçer
// (kullanıcı kararı) — "Clear all" ile küratörlü hâline döner.
export default function Blog() {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  const [hub, setHub] = useState({ spotlight: null, topBlogs: [] });

  const [facets, setFacets] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [browseMode, setBrowseMode] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [results, setResults] = useState(EMPTY_RESULTS);

  useEffect(() => {
    let cancelled = false;
    getBlogHub().then((data) => {
      if (!cancelled) setHub(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Panel içeriğini dolduran taxonomy — panel hiç açılmasa bile filtre
  // sayısı rozeti (Filter butonu) için de gerekli, o yüzden mount'ta çekilir.
  useEffect(() => {
    let cancelled = false;
    getBlogFacets().then((data) => {
      if (!cancelled) setFacets(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // browseMode'dayken filtre/sıralama kombinasyonu değişince baştan (page 0)
  // sonuç çekilir; "Load more" (handleLoadMore) bunun DIŞINDA ayrı sayfalar.
  // reloadToken: retry butonunun aynı sorguyu tekrar tetiklemesi için —
  // filtre/sort değişmeden yeniden denemek gerektiğinde artırılır.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!browseMode) return undefined;
    let cancelled = false;
    setResults((r) => ({ ...r, loading: true, error: false }));
    getBlogFilterResults(filters, 0)
      .then((res) => {
        if (cancelled) return;
        setResults({
          items: res.content,
          page: res.page,
          totalPages: res.totalPages,
          totalElements: res.totalElements,
          loading: false,
          error: false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setResults({ ...EMPTY_RESULTS, error: true });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    browseMode,
    reloadToken,
    filters.format,
    filters.franchise,
    filters.genre,
    filters.mood,
    filters.spoilerFree,
    filters.sort,
  ]);

  const handleLoadMore = () => {
    const nextPage = results.page + 1;
    setResults((r) => ({ ...r, loading: true }));
    getBlogFilterResults(filters, nextPage)
      .then((res) => {
        setResults((r) => ({
          items: [...r.items, ...res.content],
          page: res.page,
          totalPages: res.totalPages,
          totalElements: res.totalElements,
          loading: false,
          error: false,
        }));
      })
      .catch(() => {
        setResults((r) => ({ ...r, loading: false, error: true }));
      });
  };

  const handleRemoveFilter = (key, value) => {
    setFilters((f) => {
      if (key === 'genre' || key === 'mood') {
        return { ...f, [key]: f[key].filter((slug) => slug !== value) };
      }
      if (key === 'spoilerFree') return { ...f, spoilerFree: false };
      return { ...f, [key]: null };
    });
  };

  const handleClearAll = () => {
    setFilters(EMPTY_FILTERS);
    setBrowseMode(false);
  };

  const activeFilterCount =
    (filters.format ? 1 : 0) +
    (filters.franchise ? 1 : 0) +
    filters.genre.length +
    filters.mood.length +
    (filters.spoilerFree ? 1 : 0);

  // Her section kendi scroll konumunda reveal alır (learned-rules genel
  // kural: fade + hafif y, başlık→içerik kademeli) — [data-reveal-group]
  // her section'ın kendisi, doğrudan çocukları (başlık + içerik) stagger'lı
  // girer. RelatedContent.jsx'teki [data-reveal] deseniyle aynı aile.
  // Top 10 Blogs section'ı BURADAN kasıtlı çıkarıldı: TopBlogsRow artık
  // RelatedContent'teki gibi KENDİ imza-dalga giriş animasyonunu yönetiyor
  // (bkz. TopBlogsRow.jsx) — ikisi aynı anda çalışırsa "çift animasyon"
  // görünür.
  useEffect(() => {
    // Blog'a bir flip dönüşüyle gelindiyse (SpotlightCard/TopBlogsRow'dan
    // açılan bir yazıdan geri dönüş) giriş dalgası OYNAMAZ — sayfa "sıfırdan
    // açılış" değil, bırakılan yere dönüş (RelatedContent'teki aynı kural).
    if (isBlogReturnArmed()) return undefined;

    const ctx = gsap.context((self) => {
      const groups = self.selector('[data-reveal-group]');
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        groups.forEach((group) => {
          gsap.from(group.children, {
            opacity: 0,
            y: 24,
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.12,
            clearProps: 'opacity,transform',
            scrollTrigger: { trigger: group, start: 'top 85%', once: true },
          });
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(groups.flatMap((g) => [...g.children]), { opacity: 1, y: 0 });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <section className={styles.blog} ref={rootRef}>
        <header className={styles.blog__head}>
          <div>
            <span className={styles.blog__kicker}>Fandoom</span>
            <h1 className={styles.blog__heading}>{t('blog.heading')}</h1>
          </div>

          <button
            type="button"
            className={styles.blog__filter}
            onClick={() => setPanelOpen(true)}
            data-active={activeFilterCount > 0 || undefined}
          >
            {t('blog.filterButton')}
            {activeFilterCount > 0 && <span className={styles.blog__filterBadge}>{activeFilterCount}</span>}
          </button>
        </header>

        {browseMode ? (
          <FilterResults
            filters={filters}
            facets={facets}
            results={results}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAll}
            onSortChange={(sort) => setFilters((f) => ({ ...f, sort }))}
            onLoadMore={handleLoadMore}
            onRetry={() => setReloadToken((t) => t + 1)}
          />
        ) : (
          <div className={styles.blog__columns}>
            <div className={styles.blog__main}>
              <section data-reveal-group>
                <h2 className={styles.blog__sectionLabel}>{t('blog.editorsPick')}</h2>
                <SpotlightCard item={hub.spotlight} />
              </section>

              <section>
                <h2 className={styles.blog__sectionLabel}>{t('blog.topBlogs')}</h2>
                <TopBlogsRow items={hub.topBlogs} />
              </section>
            </div>

            <aside className={styles.blog__aside}>
              <section data-reveal-group>
                <h2 className={styles.blog__sectionLabel}>{t('blog.featured')}</h2>
                <SideList count={3} />
              </section>

              <section data-reveal-group>
                <h2 className={styles.blog__sectionLabel}>{t('blog.latest')}</h2>
                <SideList count={3} />
              </section>
            </aside>
          </div>
        )}

        <SeasonReviews />
      </section>

      <FilterPanel
        open={panelOpen}
        facets={facets}
        value={filters}
        onApply={(next) => {
          setFilters(next);
          setBrowseMode(true);
        }}
        onResetAll={handleClearAll}
        onClose={() => setPanelOpen(false)}
      />

      <Footer />
    </>
  );
}
