// Ortak fetch istemcisi — backend REST API'sine (Spring Boot) tüm çağrılar
// buradan geçer. Base path '/api', dev'de vite.config.js proxy'siyle
// backend'e (http://localhost:8080) yönlendirilir.
const BASE_URL = '/api';

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
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
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
