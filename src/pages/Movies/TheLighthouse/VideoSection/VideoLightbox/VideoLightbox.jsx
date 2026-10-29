import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import PosterImage from '../PosterImage/PosterImage';
import { loadYouTubeApi } from './youtubeApi';
import {
  CloseIcon,
  EnterFullscreenIcon,
  ExitFullscreenIcon,
  GearIcon,
  MuteIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  VolumeIcon,
} from './VideoIcons';
import styles from './VideoLightbox.module.css';

// YT.PlayerState sabitleri
const STATE_ENDED = 0;
const STATE_PLAYING = 1;
const STATE_BUFFERING = 3;

// Hız menüsü: yalnız YouTube'un belgelenmiş getAvailablePlaybackRates() listesinde
// olanlar gösterilir.
const SPEED_STEPS = [0.5, 1, 1.25, 1.5, 2];
// Oynarken bu kadar süre hareket olmazsa bar gizlenir.
const IDLE_MS = 2500;
const FULLSCREEN_SUPPORTED = typeof document !== 'undefined' && document.fullscreenEnabled;

const FLIP_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

// Süre --duration-base token'ından okunur (CSS animasyonlarıyla aynı kalsın).
const flipDuration = () =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duration-base')) * 1000 || 600;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const FULL_FRAME = { transform: 'translate(0px, 0px) scale(1)' };

// Çerçevenin son kutusunu kartın kutusuna oturtan kare. İkisi de 16:9 olduğu için
// tek tip ölçek yeter (kırpma/clip gerekmez).
function originFrame(end, origin) {
  const scale = origin.width / end.width;
  const dx = origin.left + origin.width / 2 - (end.left + end.width / 2);
  const dy = origin.top + origin.height / 2 - (end.top + end.height / 2);
  return { transform: `translate(${dx}px, ${dy}px) scale(${scale})` };
}

function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// Video lightbox'ı: karttan büyüyüp ekran ortasına oturur (Community Lightbox'ıyla
// aynı FLIP dili — kullanıcı kararı 2026-10: "tam ekran olmak yerine bizim
// tasarımımızla büyüsün"). Oynatıcı YouTube IFrame API ile `controls=0` kurulur ve
// KONTROLLER bizimdir; ama video kutusunun ÜSTÜNE hiçbir şey bindirilmez — bar
// çerçevenin ALTINDADIR, YouTube'un başlık/logosu videonun içinde olduğu gibi
// görünür ve "YouTube'da aç" bağlantısı sürekli ortadadır (YouTube API şartları:
// oynatıcı UI'ı/branding'i gizlenemez, üstü kapatılamaz).
// `getOriginRect(index)`: o videonun kartta durduğu kutu — açılışta çerçeve oradan
// büyür, kapanışta oraya döner.
export default function VideoLightbox({ videos, initialIndex, getOriginRect, onClose }) {
  const { t, i18n } = useTranslation();
  const [index, setIndex] = useState(initialIndex);
  const [closing, setClosing] = useState(false);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [speeds, setSpeeds] = useState(SPEED_STEPS);
  const [captions, setCaptions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [awake, setAwake] = useState(true);

  const rootRef = useRef(null);
  const frameRef = useRef(null);
  const mountRef = useRef(null);
  const closeRef = useRef(null);
  const menuWrapRef = useRef(null);
  const gearRef = useRef(null);
  const playerRef = useRef(null);
  const closingRef = useRef(false);
  const seekingRef = useRef(false);
  const loadedIdRef = useRef(videos[initialIndex].youtubeId);
  // Oynatıcı yeniden kurulurken (altyazı değişimi) kaldığı yerden devam etmesi için
  // güncel değerler ref'te de tutulur.
  const currentRef = useRef(0);
  const rateRef = useRef(1);
  const mutedRef = useRef(false);
  // new YT.Player() hemen döner ama metodları onReady'ye kadar yoktur: hazır olmayan
  // oynatıcıya (yeniden kurulum anı) komut gönderilmez.
  const readyRef = useRef(false);
  const idleTimerRef = useRef(null);
  // İşaretçi barın üstündeyken ya da klavye odağı barın içindeyken gizlenmez.
  const barBusyRef = useRef(false);

  const video = videos[index];

  // Açılış: çerçeve kartın konumundan büyüyerek yerine oturur. Boyanmadan önce
  // çalışır (layout effect), yoksa tam boy kare bir an görünürdü.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const origin = getOriginRect?.(initialIndex);
    if (!frame || !origin || prefersReducedMotion()) return undefined;
    const animation = frame.animate([originFrame(frame.getBoundingClientRect(), origin), FULL_FRAME], {
      duration: flipDuration(),
      easing: FLIP_EASE,
      fill: 'backwards',
    });
    return () => animation.cancel();
  }, [getOriginRect, initialIndex]);

  // Kapanış: çerçeve kendi kartına geri küçülür, zemin CSS'te solar (data-closing),
  // bitişi kökteki onAnimationEnd bildirir.
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    playerRef.current?.pauseVideo?.();
    const run = () => {
      if (prefersReducedMotion()) {
        onClose();
        return;
      }
      const frame = frameRef.current;
      const origin = getOriginRect?.(index);
      if (frame && origin) {
        // Açılış animasyonu bitmiş olsa da ölçüm son (transform'suz) kutuyu almalı.
        frame.getAnimations().forEach((animation) => animation.cancel());
        frame.animate([FULL_FRAME, originFrame(frame.getBoundingClientRect(), origin)], {
          duration: flipDuration(),
          easing: FLIP_EASE,
          fill: 'forwards',
        });
      }
      setClosing(true);
    };
    // Tam ekrandayken kapatılırsa önce tam ekrandan çıkılır, yerleşim oturunca
    // kartına geri küçülür (ölçüm tam ekran geometrisinde yapılmasın).
    if (document.fullscreenElement) {
      document
        .exitFullscreen()
        .catch(() => {})
        .then(() => requestAnimationFrame(run));
    } else {
      run();
    }
  }, [getOriginRect, index, onClose]);

  // Açılışta sayfa kaymasını kilitler, odağı kapat butonuna alır; kapanışta
  // önceki overflow değerini ve odağı tetikleyiciye geri verir.
  useEffect(() => {
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      trigger?.focus?.();
    };
  }, []);

  // Tam ekran durumu tarayıcıdan okunur (kullanıcı Esc ile de çıkabilir).
  useEffect(() => {
    const root = rootRef.current;
    const sync = () => setIsFullscreen(document.fullscreenElement === root);
    document.addEventListener('fullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      if (document.fullscreenElement === root) document.exitFullscreen().catch(() => {});
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      // Ayar menüsü açıksa Esc önce onu kapatır, lightbox'ı değil.
      if (menuOpen) {
        setMenuOpen(false);
        gearRef.current?.focus();
        return;
      }
      requestClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [requestClose, menuOpen]);

  // Menü dışına tıklayınca kapanır.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!menuWrapRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [menuOpen]);

  // Oynatıcı kurulumu: YT, verilen düğümü iframe ile DEĞİŞTİRİR — React'in kendi
  // düğümünü kaybetmemesi için buraya kapta imperatif oluşturulan bir çocuk verilir,
  // temizlikte kap boşaltılır (StrictMode çift mount'una dayanıklı). Altyazı değişince
  // (cc_load_policy yalnız kurulumda okunur) oynatıcı kaldığı saniyeden yeniden kurulur.
  useEffect(() => {
    let cancelled = false;
    const mount = mountRef.current;
    const target = document.createElement('div');
    mount.appendChild(target);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        playerRef.current = new YT.Player(target, {
          host: 'https://www.youtube-nocookie.com',
          width: '100%',
          height: '100%',
          videoId: loadedIdRef.current,
          playerVars: {
            autoplay: 1,
            start: Math.floor(currentRef.current),
            cc_load_policy: captions ? 1 : 0,
            cc_lang_pref: i18n.language.slice(0, 2),
            hl: i18n.language.slice(0, 2),
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              if (cancelled) return;
              readyRef.current = true;
              setDuration(event.target.getDuration());
              if (rateRef.current !== 1) event.target.setPlaybackRate(rateRef.current);
              if (mutedRef.current) event.target.mute();
              event.target.playVideo();
            },
            onStateChange: (event) => {
              if (cancelled) return;
              const state = event.data;
              setPlaying(state === STATE_PLAYING || state === STATE_BUFFERING);
              if (state === STATE_PLAYING) setStarted(true);
              if (state === STATE_ENDED) setStarted(false);
              const total = event.target.getDuration();
              if (total) setDuration(total);
            },
          },
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      readyRef.current = false;
      playerRef.current?.destroy?.();
      playerRef.current = null;
      mount.innerHTML = '';
    };
    // i18n.language kurulumda okunur; dil değişiminde yeniden kurmaya gerek yok.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captions]);

  // Önceki/sonraki: aynı oynatıcıda yeni video yüklenir (iframe yeniden kurulmaz).
  useEffect(() => {
    if (loadedIdRef.current === video.youtubeId) return;
    loadedIdRef.current = video.youtubeId;
    setStarted(false);
    setCurrent(0);
    currentRef.current = 0;
    setDuration(0);
    playerRef.current?.loadVideoById?.(video.youtubeId);
  }, [video.youtubeId]);

  // İlerleme çubuğu: oynarken çeyrek saniyede bir oynatıcıdan okunur.
  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => {
      const player = readyRef.current ? playerRef.current : null;
      if (!player || seekingRef.current) return;
      const time = player.getCurrentTime();
      currentRef.current = time;
      setCurrent(time);
      const total = player.getDuration();
      if (total) setDuration(total);
    }, 250);
    return () => clearInterval(timer);
  }, [playing]);

  // Bar oynarken boştayken gizlenir; işaretçi/odak hareketi uyandırır. Duraklatılmış
  // ya da başlamamış videoda her zaman görünür.
  const wake = useCallback(() => {
    setAwake(true);
    clearTimeout(idleTimerRef.current);
    const tick = () => {
      if (barBusyRef.current) idleTimerRef.current = setTimeout(tick, IDLE_MS);
      else setAwake(false);
    };
    idleTimerRef.current = setTimeout(tick, IDLE_MS);
  }, []);

  useEffect(() => {
    if (playing) wake();
    else clearTimeout(idleTimerRef.current);
    return () => clearTimeout(idleTimerRef.current);
  }, [playing, wake]);

  const readyPlayer = () => (readyRef.current ? playerRef.current : null);

  const togglePlay = () => {
    const player = readyPlayer();
    if (!player) return;
    if (playing) {
      player.pauseVideo();
      return;
    }
    // Bitmiş videoda "oynat" başa sarar.
    if (duration && current >= duration - 0.5) player.seekTo(0, true);
    player.playVideo();
  };

  const toggleMute = () => {
    const player = readyPlayer();
    if (!player) return;
    if (muted) player.unMute();
    else player.mute();
    mutedRef.current = !muted;
    setMuted(!muted);
  };

  // Menü açılırken oynatıcıdan güncel hız listesi okunur.
  const toggleMenu = () => {
    const player = readyPlayer();
    if (player && !menuOpen) {
      const rates = player.getAvailablePlaybackRates?.() ?? [1];
      setSpeeds(SPEED_STEPS.filter((step) => rates.includes(step)));
    }
    setMenuOpen((value) => !value);
  };

  const chooseSpeed = (next) => {
    const player = readyPlayer();
    if (!player) return;
    player.setPlaybackRate(next);
    rateRef.current = next;
    setRate(next);
  };

  const toggleCaptions = () => {
    // Oynatıcı yeniden kurulacağı için poster'a dönülür, hazır olunca devam eder.
    setStarted(false);
    setPlaying(false);
    setCaptions((value) => !value);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else rootRef.current?.requestFullscreen?.().catch(() => {});
  };

  const handleSeek = (event) => {
    const value = Number(event.target.value);
    setCurrent(value);
    currentRef.current = value;
    readyPlayer()?.seekTo(value, true);
  };

  const progress = duration ? Math.min(100, (current / duration) * 100) : 0;
  const youtubeUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`;
  const barVisible = !playing || awake || menuOpen;
  // Alt bar ve sağ üst ayar kümesi AYNI uyandırma/gizleme davranışını paylaşır.
  const chromeProps = {
    'data-hidden': !barVisible || undefined,
    onPointerEnter: () => {
      barBusyRef.current = true;
      wake();
    },
    onPointerLeave: () => {
      barBusyRef.current = false;
      wake();
    },
    onFocus: (event) => {
      if (event.target.matches(':focus-visible')) {
        barBusyRef.current = true;
        wake();
      }
    },
    onBlur: () => {
      barBusyRef.current = false;
    },
  };

  // Zemine (çerçeve/bar dışına) tıklayınca kapanır.
  return createPortal(
    <div
      ref={rootRef}
      className={styles.lightbox}
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      data-closing={closing || undefined}
      data-fullscreen={isFullscreen || undefined}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
      onAnimationEnd={(event) => {
        // Çocuk animasyonlarından gelen bubble'ı yok say — yalnız kökün kapanışı.
        if (closing && event.target === event.currentTarget) onClose();
      }}
    >
      <button
        ref={closeRef}
        type="button"
        className={`${styles.lightbox__button} ${styles.lightbox__close}`}
        onClick={requestClose}
        aria-label={t('series.videoClose')}
      >
        <CloseIcon />
      </button>

      <div className={styles.dialog}>
        <div className={styles.stage}>
          <div ref={frameRef} className={styles.dialog__frame}>
            <PosterImage key={video.youtubeId} youtubeId={video.youtubeId} className={styles.dialog__poster} />
            <div ref={mountRef} className={styles.dialog__player} data-started={started || undefined} />
          </div>

          {started && (
            <div
              className={styles.dialog__capture}
              data-idle={!barVisible || undefined}
              onPointerMove={wake}
              onClick={togglePlay}
              aria-hidden="true"
            />
          )}

          <div className={styles.bar} {...chromeProps}>
            <button
              type="button"
              className={styles.lightbox__button}
              onClick={() => setIndex(index - 1)}
              disabled={index === 0}
              aria-label={t('series.videoPrevious')}
            >
              <PreviousIcon />
            </button>
            <button
              type="button"
              className={`${styles.lightbox__button} ${styles.bar__play}`}
              onClick={togglePlay}
              aria-label={playing ? t('series.videoPause') : t('series.videoPlayAction')}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
              type="button"
              className={styles.lightbox__button}
              onClick={() => setIndex(index + 1)}
              disabled={index === videos.length - 1}
              aria-label={t('series.videoNext')}
            >
              <NextIcon />
            </button>

            <span className={styles.bar__time}>
              {formatTime(current)} / {formatTime(duration)}
            </span>

            <div className={styles.bar__seek}>
              <input
                type="range"
                className={styles.bar__slider}
                min={0}
                max={duration || 0}
                step={0.1}
                value={Math.min(current, duration || 0)}
                style={{ '--progress': `${progress}%` }}
                aria-label={t('series.videoSeek')}
                aria-valuetext={`${formatTime(current)} / ${formatTime(duration)}`}
                disabled={!duration}
                onPointerDown={() => {
                  seekingRef.current = true;
                }}
                onPointerUp={() => {
                  seekingRef.current = false;
                }}
                onChange={handleSeek}
              />
            </div>

          </div>

          <div className={styles.settings} {...chromeProps}>
            <div className={styles.menuWrap} ref={menuWrapRef}>
              <button
                ref={gearRef}
                type="button"
                className={`${styles.lightbox__button} ${styles.bar__text}`}
                onClick={toggleMenu}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                aria-label={t('series.videoSettings')}
              >
                <span className={styles.bar__gear}>
                  <GearIcon />
                </span>
                {rate !== 1 && <span>{rate}×</span>}
              </button>
              {menuOpen && (
                <div className={styles.menu}>
                  <div role="group" aria-label={t('series.videoSpeedLabel')}>
                    <p className={styles.menu__heading}>{t('series.videoSpeedLabel')}</p>
                    {speeds.map((step) => (
                      <button
                        key={step}
                        type="button"
                        className={styles.menu__item}
                        aria-pressed={rate === step}
                        onClick={() => chooseSpeed(step)}
                      >
                        {step === 1 ? t('series.videoSpeedNormal') : `${step}×`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              className={`${styles.lightbox__button} ${styles.bar__text}`}
              onClick={toggleCaptions}
              aria-pressed={captions}
              aria-label={t('series.videoCaptions')}
            >
              CC
            </button>
            <button
              type="button"
              className={styles.lightbox__button}
              onClick={toggleMute}
              aria-pressed={muted}
              aria-label={muted ? t('series.videoUnmute') : t('series.videoMute')}
            >
              {muted ? <MuteIcon /> : <VolumeIcon />}
            </button>
            {FULLSCREEN_SUPPORTED && (
              <button
                type="button"
                className={styles.lightbox__button}
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? t('series.videoExitFullscreen') : t('series.videoFullscreen')}
              >
                {isFullscreen ? <ExitFullscreenIcon /> : <EnterFullscreenIcon />}
              </button>
            )}
          </div>
        </div>

        <div className={styles.chrome} data-closing={closing || undefined}>
          <div className={styles.meta}>
            <h3 className={styles.meta__title}>{video.title}</h3>
            <p className={styles.meta__source}>
              <a className={styles.meta__link} href={video.channelUrl} target="_blank" rel="noopener noreferrer">
                {video.channelName}
              </a>
              <span aria-hidden="true">•</span>
              <a className={styles.meta__link} href={youtubeUrl} target="_blank" rel="noopener noreferrer">
                {t('series.videoOpenOnYoutube')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
