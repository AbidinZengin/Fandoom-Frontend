import { useNavigate } from 'react-router-dom';
import { logout } from '../../../shared/api/auth';
import { getStoredAuth } from '../../../shared/api/authStorage';
import styles from './AccountBlock.module.css';

// Rail'in altına sabitlenen hesap bloğu — rail açılıp kapansa da yerinde
// durur; kapalıyken yalnız avatar, açıkken ad/rol/çıkış görünür.
export default function AccountBlock() {
  const navigate = useNavigate();
  const auth = getStoredAuth();
  const initial = auth?.username?.[0]?.toUpperCase() ?? '?';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={styles['accountBlock']}>
      <span className={styles['accountBlock__avatar']} aria-hidden="true">
        {initial}
      </span>
      <span className={styles['accountBlock__info']}>
        <span className={styles['accountBlock__name']}>{auth?.username}</span>
        <span className={styles['accountBlock__role']}>{auth?.role}</span>
      </span>
      <button type="button" className={styles['accountBlock__logout']} onClick={handleLogout}>
        Çıkış
      </button>
    </div>
  );
}
