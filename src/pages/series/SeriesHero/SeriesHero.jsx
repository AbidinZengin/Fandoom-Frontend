import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import { fetchProductionDetail } from '../../../shared/api/productions';
import { resolveGenreNames } from '../../../shared/api/genres';
import imdbLogo from '../../../assets/logos/IMDB_Logo_2016.svg.webp';
import bbLogo from '../../../assets/logos/breaking-bad.svg';
import hotdLogo from '../../../assets/logos/house-of-the-dragon.webp';
import severanceLogo from '../../../assets/logos/severance.webp';
import gotLogo from '../../../assets/logos/got.webp';
import styles from './SeriesHero.module.css';

// Bilinen 4 yapımın resmi logosu — dizi Hero'larının aynısı. Kataloğa
// sonradan eklenen bir dizinin logo asset'i olmayacağı için hero__title
// HER ZAMAN (logo olsa da) ayrıca gösterilir — referans PageBuilder
// çıktısında da ikisi birlikte duruyor.
const KNOWN_LOGOS = {
  'breaking-bad': bbLogo,
  'house-of-the-dragon': hotdLogo,
  severance: severanceLogo,
  'game-of-thrones': gotLogo,
};

// Her yapımın logosu KENDİ Hero'sunda farklı yerde/boyutta durur (kullanıcı
// düzeltmesi: "ortada dursun diye yok, hepsinin heroda karşılıkları vardı").
// Değerler o Hero'ların kendi CSS'inden (cqw yüzdeleri, canvas genişliğine
// göre) görsel kutusuna ORANLANARAK çıkarıldı:
// - HouseOfTheDragon/Hero.module.css ve Severance/Hero.module.css'in
//   ≤900px kart versiyonu logoyu zaten ortalı, kart genişliğinin %58'i
//   yapmıştı (kullanıcı onaylı final değer) — birebir taşındı.
// - GameOfThrones/Hero logosu da kendi (farklı) hero'sunda ortalı — aynı
//   aile, biraz daha dar (%50) tutuldu.
// - BreakingBad/Hero.module.css'te logoBlock2 SOLA yaslı: left 11.73%
//   width 26.4% (canvas genişliğine göre) / imageBlock2 left 6.26% width
//   87.48% — logonun görsel kutusuna göre oranı: left ≈ %6.3, width ≈ %30.
const LOGO_LAYOUT = {
  'house-of-the-dragon': { top: '4%', left: '50%', width: '58%', transform: 'translateX(-50%)' },
  severance: { top: '4%', left: '50%', width: '58%', transform: 'translateX(-50%)' },
  'game-of-thrones': { top: '4%', left: '50%', width: '50%', transform: 'translateX(-50%)' },
  'breaking-bad': { top: '10%', left: '6.3%', width: '30%', transform: 'none' },
};

// Kullanıcının PageBuilder'da ürettiği SerieHero referansının BİREBİR
// taşınmış hâli (bkz. src/pages/Series/SerieHero — kullanıcı kararı: "tek
// fark arkadaki blur yok", o referansta zaten blur katmanı YOK). Sabit
// cqw canvas'ı YERİNE responsive CSS ile aynı anatomi kuruldu: 3px beyaz
// bordürlü tek görsel + üstüne bindirili logo/rozet/başlık/meta/sinopsis/
// butonlar, altında "FEATURED TITLES" numaralı poster şeridi — şeritteki
// bir postere tıklamak büyük kartı O yapıma göre günceller (PageBuilder
// çıktısı statik/tek örnekti, tıklanabilirlik burada eklendi).
export function SeriesHero({ items }) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [details, setDetails] = useState({});
  const [genreNames, setGenreNames] = useState([]);

  const featured = items.slice(0, 4);
  const slugKey = featured.map((it) => it.slug).join(',');

  // coverImageUrl/externalRating/genreIds/synopsis katalog listesinde YOK
  // (yalnız detay endpoint'inde) — 4 öğe için N+1 maliyeti kabul edilebilir
  // (ContentSection'daki lead-genre deseniyle aynı ilke).
  useEffect(() => {
    if (featured.length === 0) return undefined;
    let cancelled = false;
    Promise.all(
      featured.map((it) => fetchProductionDetail(it.type.toLowerCase(), it.slug).catch(() => null))
    ).then((results) => {
      if (cancelled) return;
      const map = {};
      featured.forEach((it, i) => {
        if (results[i]) map[it.slug] = results[i];
      });
      setDetails(map);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- slug seti belirleyici, items referansı değil
  }, [slugKey]);

  const current = featured[activeIndex % Math.max(featured.length, 1)];
  const detail = current ? details[current.slug] : null;

  // Tür yalnız aktif kart için çözülür (Highlights/ContentSection'daki
  // lead-only genre deseniyle aynı ilke).
  useEffect(() => {
    if (!detail?.genreIds?.length) {
      setGenreNames([]);
      return undefined;
    }
    let cancelled = false;
    resolveGenreNames(detail.genreIds).then((names) => {
      if (!cancelled) setGenreNames(names);
    });
    return () => {
      cancelled = true;
    };
  }, [detail]);

  if (!current) return null;

  const logo = KNOWN_LOGOS[current.slug];
  const coverImage = detail?.coverImageUrl ?? current.posterUrl;
  const year = current.releaseDate ? new Date(current.releaseDate).getFullYear() : null;

  return (
    <div className={styles.hero}>
      <div className={styles.hero__figure}>
        {coverImage && <img className={styles.hero__image} src={coverImage} alt="" />}

        {logo && <img className={styles.hero__logo} src={logo} alt="" style={LOGO_LAYOUT[current.slug]} />}

        {detail?.externalRating && (
          <div className={styles.hero__rating}>
            <span>{detail.externalRating}</span>
            <img src={imdbLogo} alt="IMDb" className={styles.hero__imdbLogo} />
          </div>
        )}

        <div className={styles.hero__scrim} />

        <div className={styles.hero__overlay}>
          <h2 className={styles.hero__title}>{current.title}</h2>

          <div className={styles.hero__metaRow}>
            {year && <span className={styles.hero__year}>{year}</span>}
            {genreNames.length > 0 && <span className={styles.hero__genre}>{genreNames.join(' · ')}</span>}
          </div>

          {detail?.synopsis && <p className={styles.hero__synopsis}>{detail.synopsis}</p>}

          <div className={styles.hero__ctaRow}>
            <Link className={styles.hero__ctaOutline} to={`/series/${current.slug}`}>
              {t('seriesHub.explore')}
            </Link>
            <button type="button" className={styles.hero__ctaGlass}>
              ▶ {t('seriesHub.watchTrailer')}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.hero__row}>
        <h3 className={styles.hero__rowLabel}>{t('seriesHub.featuredTitles')}</h3>
        <div className={styles.hero__rowTrack}>
          {featured.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={styles.hero__rowItem}
              data-active={i === activeIndex || undefined}
              aria-current={i === activeIndex}
              onClick={() => setActiveIndex(i)}
            >
              <span className={styles.hero__rowPoster}>
                {item.posterUrl && <img src={item.posterUrl} alt="" loading="lazy" />}
                <span className={styles.hero__rowNumber}>{String(i + 1).padStart(2, '0')}</span>
              </span>
              <span className={styles.hero__rowTitle}>{item.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
