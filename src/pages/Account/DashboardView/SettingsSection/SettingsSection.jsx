import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SettingsSection.module.css';

const INITIAL_SETTINGS = {
  spoilerShield: false,
  productUpdates: true,
  commentMentions: true,
  weeklyDigest: false,
  loginAlerts: true,
  newDeviceApproval: true,
  publicWatchlist: false,
  publicCharacters: false,
};

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <label className={styles.settings__row}>
      <span className={styles.settings__rowText}>
        <span className={styles.settings__rowLabel}>{label}</span>
        {description && <span className={styles.settings__rowDescription}>{description}</span>}
      </span>
      <span className={styles.settings__toggle}>
        <input
          type="checkbox"
          className={styles.settings__toggleInput}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className={styles.settings__toggleTrack}>
          <span className={styles.settings__toggleKnob} />
        </span>
      </span>
    </label>
  );
}

// Prototip — hiçbir toggle backend'e yazılmaz, Save sadece bir toast gösterir
// (bkz. docs/plans/2026-08-29-account-page-design.md, Settings bölümü).
export function SettingsSection() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [savedToastVisible, setSavedToastVisible] = useState(false);

  const patch = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const handleCancel = () => setSettings(INITIAL_SETTINGS);

  const handleSave = () => {
    setSavedToastVisible(true);
    setTimeout(() => setSavedToastVisible(false), 2000);
  };

  return (
    <section className={styles.settings}>
      <div className={styles.settings__group}>
        <ToggleRow
          label={t('account.settings.spoilerShieldHeading')}
          description={t('account.settings.spoilerShieldDesc')}
          checked={settings.spoilerShield}
          onChange={(v) => patch('spoilerShield', v)}
        />
      </div>

      <div className={styles.settings__group}>
        <h2 className={styles.settings__groupHeading}>{t('account.settings.notificationsHeading')}</h2>
        <ToggleRow
          label={t('account.settings.productUpdates')}
          checked={settings.productUpdates}
          onChange={(v) => patch('productUpdates', v)}
        />
        <ToggleRow
          label={t('account.settings.commentMentions')}
          checked={settings.commentMentions}
          onChange={(v) => patch('commentMentions', v)}
        />
        <ToggleRow
          label={t('account.settings.weeklyDigest')}
          checked={settings.weeklyDigest}
          onChange={(v) => patch('weeklyDigest', v)}
        />
      </div>

      <div className={styles.settings__group}>
        <h2 className={styles.settings__groupHeading}>{t('account.settings.securityHeading')}</h2>
        <ToggleRow
          label={t('account.settings.loginAlerts')}
          checked={settings.loginAlerts}
          onChange={(v) => patch('loginAlerts', v)}
        />
        <ToggleRow
          label={t('account.settings.newDeviceApproval')}
          checked={settings.newDeviceApproval}
          onChange={(v) => patch('newDeviceApproval', v)}
        />
      </div>

      <div className={styles.settings__group}>
        <h2 className={styles.settings__groupHeading}>{t('account.settings.visibilityHeading')}</h2>
        <ToggleRow
          label={t('account.settings.publicWatchlist')}
          checked={settings.publicWatchlist}
          onChange={(v) => patch('publicWatchlist', v)}
        />
        <ToggleRow
          label={t('account.settings.publicCharacters')}
          checked={settings.publicCharacters}
          onChange={(v) => patch('publicCharacters', v)}
        />
      </div>

      <div className={styles.settings__actions}>
        {savedToastVisible && <span className={styles.settings__toast}>{t('account.settings.savedToast')}</span>}
        <button type="button" className={styles.settings__cancel} onClick={handleCancel}>
          {t('account.settings.cancel')}
        </button>
        <button type="button" className={styles.settings__save} onClick={handleSave}>
          {t('account.settings.save')}
        </button>
      </div>
    </section>
  );
}
