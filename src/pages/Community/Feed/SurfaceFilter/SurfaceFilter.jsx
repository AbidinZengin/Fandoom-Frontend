import { useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';

const TABS = [
  { key: 'all', labelKey: 'community.feed.tabAll', to: '/community' },
  { key: 'DISCUSSION', labelKey: 'navbar.discussion', to: '/community/discussion' },
  { key: 'THEORY', labelKey: 'navbar.theories', to: '/community/theories' },
  { key: 'FAN_ART', labelKey: 'navbar.fanArt', to: '/community/fan-art' },
];

// Tab aktifliği pathname sonuna göre belirlenir (lang prefix'ten bağımsız) —
// projede zaten Navbar'ın kullandığı desenin aynısı, NavLink değil.
// `portalSlug` verilirse (Portal sayfası) sekmeler /community route'larına değil
// aynı sayfada `?surface=` parametresine gider — paylaşılabilir URL, geri tuşu
// uyumlu; yalnız query değiştiği için sayfa başa sarılmaz.
export function SurfaceFilter({ portalSlug }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  const items = TABS.map((tab) => ({
    key: tab.key,
    to: portalSlug
      ? tab.key === 'all'
        ? `/portal/${portalSlug}`
        : `/portal/${portalSlug}?surface=${tab.key}`
      : tab.to,
    label: t(tab.labelKey),
  }));
  const activeKey = portalSlug
    ? TABS.find((tab) => tab.key === (searchParams.get('surface') ?? 'all'))?.key
    : TABS.find((tab) => pathname.endsWith(tab.to))?.key;

  return <SegmentedControl items={items} activeKey={activeKey} label={t('community.feed.tabAll')} />;
}
