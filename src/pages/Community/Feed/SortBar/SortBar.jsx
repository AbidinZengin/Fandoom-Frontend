import { useTranslation } from 'react-i18next';
import { SORT_OPTIONS } from '../Feed.data';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';

// learned-rules [[topluluk-feed]]: en fazla 3-4 sıralama seçeneği, net
// varsayılan (Hot).
export function SortBar({ sort, onChange }) {
  const { t } = useTranslation();

  const items = SORT_OPTIONS.map((option) => ({ key: option, label: t(`community.feed.sort.${option}`) }));

  return <SegmentedControl items={items} activeKey={sort} onSelect={onChange} size="sm" />;
}
