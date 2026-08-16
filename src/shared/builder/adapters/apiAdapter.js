import { apiClient } from '../../api/client';

// Backend'e (Spring Boot) yazan Storage Adapter — canlı içerik için
// (ör. Blog). apiClient'ı sarar, kendi hata tipini icat etmez: ApiError
// olduğu gibi çağırana fırlatılır (fieldErrors/status zaten orada taşınıyor).
export function createApiAdapter(endpoint) {
  return {
    load: (id) => apiClient.get(`${endpoint}/${id}`),
    save: (id, data) => apiClient.put(`${endpoint}/${id}`, data),
  };
}
