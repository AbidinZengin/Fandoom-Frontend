import { SettingsSection } from '../../Account/DashboardView/SettingsSection/SettingsSection';
import { RequireSession } from '../RequireSession/RequireSession';

// Hesap ayarları Community'nin orta kolonunda (/community/settings).
export default function Settings() {
  return (
    <RequireSession>
      <SettingsSection />
    </RequireSession>
  );
}
