import { useTranslation } from 'react-i18next';
import { CustomListsSection } from '../../Account/DashboardView/CustomListsSection/CustomListsSection';
import { Breadcrumb } from '../Breadcrumb/Breadcrumb';
import { RequireSession } from '../RequireSession/RequireSession';

// Özel listeler Community'nin orta kolonunda (/community/lists); kart linkleri
// kendi detay route'una (/community/lists/:id) gider. Breadcrumb detaydaki
// (Community › My Lists › liste) ile aynı dilde: geri dönüşte Community › My Lists.
// Fragment: breadcrumb `<main>`'in doğrudan çocuğu kalır (route geçişinde sabit).
export default function Lists() {
  const { t } = useTranslation();
  return (
    <RequireSession>
      <Breadcrumb items={[{ label: t('navbar.community'), to: '/community' }, { label: t('community.sidebar.listsHeading') }]} />
      <CustomListsSection listBasePath="/community/lists" />
    </RequireSession>
  );
}
