import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { login, register } from '../../../shared/api/auth';
import { ApiError } from '../../../shared/api/client';
import styles from './AuthView.module.css';

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.5-3.5 4.5-5 7-5s5.5 1.5 7 5" />
    </svg>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M9.6 5.3C10.4 5.1 11.2 5 12 5c6.5 0 10 6.5 10 6.5a15 15 0 0 1-3.4 4.3M6.6 6.6A15 15 0 0 0 2 11.5S5.5 18 12 18c1.1 0 2.1-.15 3-.4" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.87c2.27-2.09 3.58-5.17 3.58-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.11C3.25 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.6H1.28A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.28 5.4l3.99-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0 7.31 0 3.25 2.7 1.28 6.6l3.99 3.11C6.22 6.87 8.87 4.76 12 4.76Z"
      />
    </svg>
  );
}

// POST /api/auth/register token DÖNMEZ (UserDetailResponse) — kayıt
// başarılı olur olmaz aynı bilgilerle login() çağrılır, oturum ondan açılır.
export function AuthView({ onAuthenticated }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError(null);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(username, password);
      onAuthenticated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('account.auth.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('account.auth.passwordMismatch'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await register(username, email, password);
      await login(username, password);
      onAuthenticated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('account.auth.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.authView}>
      <div className={styles.authView__vignette} aria-hidden="true" />

      <div className={styles.authView__card}>
        <div className={styles.authView__badge} aria-hidden="true">
          <UserIcon />
        </div>

        {mode === 'signin' ? (
          <>
            <h1 className={styles.authView__title}>{t('account.auth.signInTitle')}</h1>
            <p className={styles.authView__subtitle}>{t('account.auth.signInSubtitle')}</p>

            <form className={styles.authView__form} onSubmit={handleSignIn}>
              <label className={styles.authView__field}>
                <span className={styles.authView__fieldIcon}>
                  <UserIcon />
                </span>
                <input
                  className={styles.authView__input}
                  type="text"
                  placeholder={t('account.auth.usernameOrEmailPlaceholder')}
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </label>

              <label className={styles.authView__field}>
                <span className={styles.authView__fieldIcon}>
                  <LockIcon />
                </span>
                <input
                  className={styles.authView__input}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('account.auth.passwordPlaceholder')}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.authView__eyeToggle}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={t('account.auth.passwordPlaceholder')}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </label>

              <div className={styles.authView__row}>
                <label className={styles.authView__checkboxLabel}>
                  <input type="checkbox" />
                  {t('account.auth.rememberMe')}
                </label>
                <a className={styles.authView__forgotLink} href="#forgot-password">
                  {t('account.auth.forgotPassword')}
                </a>
              </div>

              {error && <p className={styles.authView__error}>{error}</p>}

              <button type="submit" className={styles.authView__submit} disabled={submitting}>
                {t('account.auth.signInCta')} →
              </button>
            </form>

            <div className={styles.authView__divider}>
              <span>{t('account.auth.orDivider')}</span>
            </div>

            <button type="button" className={styles.authView__google} disabled>
              <GoogleIcon />
              {t('account.auth.googleCta')}
            </button>

            <p className={styles.authView__switchText}>
              {t('account.auth.noAccount')}{' '}
              <button type="button" className={styles.authView__switchLink} onClick={() => switchMode('signup')}>
                {t('account.auth.signUpLink')}
              </button>
            </p>
          </>
        ) : (
          <>
            <h1 className={styles.authView__title}>{t('account.auth.signUpTitle')}</h1>
            <p className={styles.authView__subtitle}>{t('account.auth.signUpSubtitle')}</p>

            <form className={styles.authView__form} onSubmit={handleSignUp}>
              <label className={styles.authView__field}>
                <span className={styles.authView__fieldIcon}>
                  <UserIcon />
                </span>
                <input
                  className={styles.authView__input}
                  type="text"
                  placeholder={t('account.auth.usernamePlaceholder')}
                  autoComplete="username"
                  minLength={3}
                  maxLength={50}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </label>

              <label className={styles.authView__field}>
                <span className={styles.authView__fieldIcon}>
                  <MailIcon />
                </span>
                <input
                  className={styles.authView__input}
                  type="email"
                  placeholder={t('account.auth.emailPlaceholder')}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className={styles.authView__field}>
                <span className={styles.authView__fieldIcon}>
                  <LockIcon />
                </span>
                <input
                  className={styles.authView__input}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('account.auth.passwordPlaceholder')}
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.authView__eyeToggle}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={t('account.auth.passwordPlaceholder')}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </label>

              <label className={styles.authView__field}>
                <span className={styles.authView__fieldIcon}>
                  <LockIcon />
                </span>
                <input
                  className={styles.authView__input}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('account.auth.confirmPasswordPlaceholder')}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </label>

              {error && <p className={styles.authView__error}>{error}</p>}

              <button type="submit" className={styles.authView__submit} disabled={submitting}>
                {t('account.auth.signUpCta')} →
              </button>
            </form>

            <p className={styles.authView__switchText}>
              {t('account.auth.haveAccount')}{' '}
              <button type="button" className={styles.authView__switchLink} onClick={() => switchMode('signin')}>
                {t('account.auth.signInLink')}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
