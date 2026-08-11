import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../../shared/api/auth';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(username, password);
      navigate('/admin/blogs');
    } catch {
      setError('Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.login}>
      <form className={styles.login__form} onSubmit={handleSubmit}>
        <h1 className={styles.login__title}>Admin Login</h1>

        <label className={styles.login__field}>
          <span>Username</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className={styles.login__field}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className={styles.login__error}>{error}</p>}

        <button type="submit" className={styles.login__submit} disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </section>
  );
}
