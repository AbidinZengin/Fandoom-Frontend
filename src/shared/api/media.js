import { getStoredAuth } from './authStorage';

// POST /api/media/images (multipart) — MediaUploadResponse: { url, publicId }.
// apiClient.post JSON body varsayar, bu yüzden burada doğrudan fetch
// kullanılır (Content-Type tarayıcı tarafından boundary'li olarak
// otomatik ayarlanmalı — elle set edilirse boundary eksik kalır). Bu yüzden
// Authorization header'ı da apiClient'ın yaptığı gibi burada elle eklenir.
export async function uploadImage(file, folder) {
  const formData = new FormData();
  formData.append('file', file);
  if (folder) formData.append('folder', folder);

  const token = getStoredAuth()?.token;
  const res = await fetch('/api/media/images', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Görsel yüklenemedi (${res.status})`);
  }
  return res.json();
}
