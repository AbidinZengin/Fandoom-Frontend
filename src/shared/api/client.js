import { getStoredAuth, clearStoredAuth } from './authStorage';
import { SUPPORTED_LANGS, DEFAULT_LANG } from '../i18n/constants';

// Ortak fetch istemcisi — backend REST API'sine (Spring Boot) tüm çağrılar
// buradan geçer. Base path '/api', dev'de vite.config.js proxy'siyle
// backend'e (http://localhost:8080) yönlendirilir.
const BASE_URL = '/api';

// Plain modül (hook değil) — mevcut dili useLang() gibi route context'inden
// değil, doğrudan URL'den okur. /:lang route ağacı dışındaki sayfalar
// (ör. /admin/...) DEFAULT_LANG'a düşer; admin uçları zaten iki dili birden
// döndürüp/alıyor, tek-dil resolver'ından etkilenmez.
export function currentApiLang() {
  const firstSegment = window.location.pathname.split('/')[1];
  return SUPPORTED_LANGS.includes(firstSegment) ? firstSegment : DEFAULT_LANG;
}

// Backend'in ApiErrorResponse'unu (GlobalExceptionHandler) taşır — status,
// message'ın yanında validasyon hatalarını da (fieldErrors, 400'lerde) korur.
// Salt-okunur çağıranlar sadece .message okumaya devam edebilir (Error'dan
// türediği için geriye dönük uyumlu); ileride bir yazma formu fieldErrors'a
// ihtiyaç duyarsa client.js'e tekrar dokunmaya gerek kalmaz.
export class ApiError extends Error {
  constructor(message, { status, fieldErrors } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors ?? null;
  }
}

async function request(path, options = {}) {
  const token = getStoredAuth()?.token;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': currentApiLang(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    // Geliştirme sırasında hızlı teşhis için — DevTools Network panelinde
    // Response gezmek yerine hata direkt konsola düşer (kullanıcı isteği).
    // eslint-disable-next-line no-console
    console.error(`API error ${res.status} on ${path}:`, body);

    // Token süresi dolduğunda (JWT 1 saatlik) admin sayfada kalıp sessizce
    // 401 alıyordu, "kaydetmiyor" gibi yanlış okunuyordu (kullanıcı raporu).
    // Bayat token temizlenir — bir sonraki korumalı sayfa girişinde
    // RequireAuth otomatik login'e yönlendirir; burada yönlendirme
    // YAPILMAZ çünkü çağıran component'in kendi hata mesajını (fieldErrors
    // vb.) göstermesine izin verilir.
    if (res.status === 401) clearStoredAuth();

    throw new ApiError(body?.message ?? `İstek başarısız: ${res.status}`, {
      status: res.status,
      fieldErrors: body?.fieldErrors,
    });
  }

  if (res.status === 204) return null;
  return res.json();
}

export const apiClient = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
