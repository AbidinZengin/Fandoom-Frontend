import { CustomListsSection } from '../../Account/DashboardView/CustomListsSection/CustomListsSection';
import { RequireSession } from '../RequireSession/RequireSession';

// Özel listeler Community'nin orta kolonunda (/community/lists); kart linkleri
// kendi detay route'una (/community/lists/:id) gider.
export default function Lists() {
  return (
    <RequireSession>
      <CustomListsSection listBasePath="/community/lists" />
    </RequireSession>
  );
}
