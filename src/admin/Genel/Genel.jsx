import { useEffect, useState } from 'react';
import CapsuleMeter from '../CapsuleMeter/CapsuleMeter';
import { DocIcon, FilmIcon, GlobeIcon } from '../icons';
import LinkCard from '../LinkCard/LinkCard';
import PageHeader from '../PageHeader/PageHeader';
import StatCard from '../StatCard/StatCard';
import { fetchOverviewCounts } from './Genel.data';
import styles from './Genel.module.css';

const METER_CELLS = 8;

export default function Genel() {
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchOverviewCounts()
      .then((data) => {
        if (!cancelled) setCounts(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const total = counts ? counts.series + counts.movies : null;
  // Kapsül çubuğu dizi payını gösterir (toplam yapım içinde dizi oranı).
  const seriesCells = counts && total > 0 ? Math.round((counts.series / total) * METER_CELLS) : 0;

  return (
    <div className={styles['genel']}>
      <PageHeader title="Genel" subtitle="Sitedeki içeriğin anlık durumu." />

      {error && <p className={styles['genel__error']}>Sayılar yüklenemedi, sayfayı yenile.</p>}

      <div className={styles['genel__grid']}>
        <div className={styles['genel__stats']}>
          <StatCard
            variant="emphasis"
            icon={<FilmIcon />}
            label="Yapımlar"
            value={total ?? '—'}
            hint={counts ? `${counts.series} dizi · ${counts.movies} film` : undefined}
          >
            {counts && (
              <CapsuleMeter
                total={METER_CELLS}
                filled={seriesCells}
                label={`Yapımların ${counts.series} / ${total} kadarı dizi`}
              />
            )}
          </StatCard>

          <StatCard icon={<DocIcon />} label="Bloglar" value={counts?.blogs ?? '—'} />
        </div>

        <div className={styles['genel__links']}>
          <LinkCard
            href="/"
            icon={<GlobeIcon />}
            title="Siteyi aç"
            description="Canlı siteyi yeni sekmede gör"
          />
        </div>
      </div>
    </div>
  );
}
