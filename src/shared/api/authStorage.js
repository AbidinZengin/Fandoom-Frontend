// Admin oturumunun (token + role) tek saklama noktası — localStorage.
// client.js (header enjeksiyonu) ve auth.js (login/logout) burayı paylaşır,
// birbirini import etmez (döngüsel bağımlılık önlenir).
const STORAGE_KEY = 'fandoom_admin_auth';

export function getStoredAuth() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredAuth(auth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY);
}
