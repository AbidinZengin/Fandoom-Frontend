import { apiClient } from '../../shared/api/client';

// Genel sayfasının sayıları — her uçtan yalnız `totalElements` okunur
// (size=1: gövde minimum). /productions cursor tabanlı olduğu için toplam
// vermez; dizi/film sayıları kendi uçlarından alınır.
export async function fetchOverviewCounts() {
  const [series, movies, blogs] = await Promise.all([
    apiClient.get('/series?size=1'),
    apiClient.get('/movies?size=1'),
    apiClient.get('/blogs?size=1'),
  ]);

  return {
    series: series.totalElements,
    movies: movies.totalElements,
    blogs: blogs.totalElements,
  };
}
