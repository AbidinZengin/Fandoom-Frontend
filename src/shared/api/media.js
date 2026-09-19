import { getStoredAuth } from './authStorage';

// POST /api/media/images ve /api/media/videos (multipart) —
// MediaUploadResponse: { url, publicId }. Limitler backend'de: görsel <= 10 MB,
// video <= 50 MB (mp4/webm/quicktime), aşılırsa 400. apiClient.post JSON body
// varsayar, bu yüzden burada doğrudan fetch kullanılır (Content-Type tarayıcı
// tarafından boundary'li olarak otomatik ayarlanmalı — elle set edilirse
// boundary eksik kalır). Bu yüzden Authorization header'ı da apiClient'ın
// yaptığı gibi burada elle eklenir.
async function uploadMedia(path, file, folder, failureLabel) {
  const formData = new FormData();
  formData.append('file', file);
  if (folder) formData.append('folder', folder);

  const token = getStoredAuth()?.token;
  const res = await fetch(path, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `${failureLabel} (${res.status})`);
  }
  return res.json();
}

export function uploadImage(file, folder) {
  return uploadMedia('/api/media/images', file, folder, 'Görsel yüklenemedi');
}

export function uploadVideo(file, folder) {
  return uploadMedia('/api/media/videos', file, folder, 'Video yüklenemedi');
}
