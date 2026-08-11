import { apiClient } from './client';
import { clearStoredAuth, setStoredAuth } from './authStorage';

// POST /api/auth/login — AuthResponse: { username, role, token }. Rol JWT
// içinde taşınmıyor (backend: token sadece jti/subject/exp içerir), bu
// yüzden döner dönmez username/role/token birlikte saklanır.
export async function login(username, password) {
  const auth = await apiClient.post('/auth/login', { username, password });
  setStoredAuth(auth);
  return auth;
}

// GET /api/auth/me — sayfa yenilendiğinde rolü tazelemek için kullanılır;
// localStorage'daki eski role DB'de değişmiş olabilir, buna güvenilmez.
export async function getCurrentUser() {
  return apiClient.get('/auth/me');
}

export function logout() {
  clearStoredAuth();
}
