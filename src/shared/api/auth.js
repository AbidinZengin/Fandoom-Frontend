import { apiClient } from './client';
import { clearStoredAuth, setStoredAuth } from './authStorage';

// POST /api/auth/login — AuthResponse: { username, role, token }. Rol JWT
// içinde taşınmıyor (backend: token sadece jti/subject/exp içerir), bu
// yüzden döner dönmez username/role/token birlikte saklanır.
// Body alanı `usernameOrEmail` (backend'de `username`'dan yeniden adlandırıldı,
// bkz. CustomUserDetailsService — hem username hem email ile giriş kabul eder).
export async function login(usernameOrEmail, password) {
  const auth = await apiClient.post('/auth/login', { usernameOrEmail, password });
  setStoredAuth(auth);
  return auth;
}

// POST /api/auth/register (PUBLIC) — RegisterRequest{ username, email,
// password } → UserDetailResponse (token DÖNMEZ). Kayıt sonrası oturum
// açmak için ayrıca login() çağrılır (bkz. Account/AuthView.jsx).
export async function register(username, email, password) {
  return apiClient.post('/auth/register', { username, email, password });
}

// GET /api/auth/me — sayfa yenilendiğinde rolü tazelemek için kullanılır;
// localStorage'daki eski role DB'de değişmiş olabilir, buna güvenilmez.
export async function getCurrentUser() {
  return apiClient.get('/auth/me');
}

export function logout() {
  clearStoredAuth();
}
