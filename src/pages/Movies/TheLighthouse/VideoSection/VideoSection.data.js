// VideoSection'ın veri katmanı — MOCK. Backend'de video entity'si yok;
// kullanıcı kararıyla (2026-10) şimdilik elle seçilmiş resmi YouTube
// videoları. Başlık/kanal bilgisi YouTube oEmbed'den alındı. Backend gelince
// yalnız bu dosya API çağrısına dönüşür, component aynı kalır.
const VIDEOS = [
  {
    id: 'lighthouse-trailer',
    youtubeId: 'Hyag7lR8CPA',
    title: 'The Lighthouse | Official Trailer HD | A24',
    channelName: 'A24',
    channelUrl: 'https://www.youtube.com/@A24',
  },
  {
    id: 'lighthouse-film4-interview',
    youtubeId: 'O9ukjPF3YdA',
    title: 'Robert Pattinson & Willem Dafoe talk The Lighthouse | Film4 Interview Special',
    channelName: 'Film4',
    channelUrl: 'https://www.youtube.com/@Film4YouTube',
  },
  {
    id: 'lighthouse-making-of',
    youtubeId: '8fV8KFWXWWU',
    title: 'Making The Lighthouse: Robert Pattinson, Willem Dafoe and Robert Eggers | On Acting',
    channelName: 'BAFTA Guru',
    channelUrl: 'https://www.youtube.com/@baftaguru',
  },
  {
    id: 'lighthouse-folklore-analysis',
    youtubeId: 'xutnBvTmDq4',
    title: 'The Lighthouse Analysis: Horror in Folklore',
    channelName: 'The Film Essay',
    channelUrl: 'https://www.youtube.com/@thefilmessay9832',
  },
];

export function getVideos() {
  return VIDEOS;
}
