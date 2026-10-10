// YouTube IFrame Player API'yi sayfa başına BİR kez yükler (npm paketi değil,
// YouTube'un resmi script'i). Birden çok çağrı aynı promise'i paylaşır.
let apiPromise = null;

export function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error('YouTube IFrame API yüklenemedi'));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}
