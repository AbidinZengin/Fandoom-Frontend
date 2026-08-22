import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { FacetDropdown } from './FacetDropdown/FacetDropdown';
import { SORT_OPTIONS } from './filterDefaults';
import styles from './FilterPanel.module.css';

// Sağdan kayan filtre drawer'ı — Navbar'ın mobil menü overlay'iyle AYNI
// iskelet (body scroll-lock, Escape/backdrop ile kapanış, GSAP stagger
// giriş), tam-ekran değil sağa sabitlenmiş panel. `value` son UYGULANMIŞ
// filtre; panel kendi taslağını tutar, Apply'a kadar dışarı sızmaz —
// Cancel/backdrop/Escape taslağı atar.
export function FilterPanel({ open, facets, value, onApply, onResetAll, onClose }) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState(value);
  const backdropRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (open) {
      setDraft(value);
      setMounted(true);
    }
  }, [open, value]);

  // Body scroll-lock + Escape — Navbar overlay deseninin birebir aynısı.
  useEffect(() => {
    if (!mounted) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mounted, onClose]);

  // Giriş/çıkış — utility register (0.3-0.4s), Hero'nun sinematik temposu
  // değil: bu bir araç paneli. Backdrop + panel birlikte, içerik biraz
  // gecikmeli stagger'la takip eder (Navbar data-menu-item ile aynı aile).
  useEffect(() => {
    if (!mounted) return undefined;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set(panelRef.current, { xPercent: 100 });
        gsap.set(backdropRef.current, { opacity: 0 });
        gsap
          .timeline()
          .to(backdropRef.current, { opacity: 1, duration: 0.28, ease: 'power1.out' }, 0)
          .to(panelRef.current, { xPercent: 0, duration: 0.4, ease: 'power3.out' }, 0)
          .from('[data-panel-item]', { opacity: 0, y: 16, duration: 0.35, ease: 'power2.out', stagger: 0.05 }, 0.12);
      });
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(panelRef.current, { xPercent: 0 });
        gsap.set(backdropRef.current, { opacity: 1 });
      });
    });
    return () => ctx.revert();
  }, [mounted]);

  const requestClose = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMounted(false);
      onClose();
      return;
    }
    const ctx = gsap.context(() => {
      gsap.to(panelRef.current, { xPercent: 100, duration: 0.3, ease: 'power2.in' });
      gsap.to(backdropRef.current, {
        opacity: 0,
        duration: 0.22,
        ease: 'power1.in',
        onComplete: () => {
          setMounted(false);
          onClose();
        },
      });
    });
    return () => ctx.revert();
  };

  if (!mounted) return null;

  const patch = (key, val) => setDraft((d) => ({ ...d, [key]: val }));

  const activeDraftCount =
    (draft.format ? 1 : 0) +
    (draft.franchise ? 1 : 0) +
    draft.genre.length +
    draft.mood.length +
    (draft.spoilerFree ? 1 : 0);

  return (
    <div className={styles.overlay}>
      <div className={styles.overlay__backdrop} ref={backdropRef} onClick={requestClose} />

      <div className={styles.panel} ref={panelRef} role="dialog" aria-modal="true" aria-label={t('blog.filtersTitle')}>
        <div className={styles.panel__head} data-panel-item>
          <h2 className={styles.panel__title}>{t('blog.filtersTitle')}</h2>
          <button
            type="button"
            className={styles.panel__close}
            onClick={requestClose}
            aria-label={t('blog.closeFiltersAriaLabel')}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={styles.panel__body}>
          <div className={styles.panel__section} data-panel-item>
            <span className={styles.panel__sectionLabel}>{t('blog.sortBy')}</span>
            <div className={styles.panel__pills}>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={styles.panel__pill}
                  data-active={draft.sort === opt.value || undefined}
                  onClick={() => patch('sort', opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div data-panel-item>
            <FacetDropdown
              label={t('blog.formatLabel')}
              mode="single"
              options={facets?.formats ?? []}
              value={draft.format}
              onChange={(v) => patch('format', v)}
            />
          </div>

          <div data-panel-item>
            <FacetDropdown
              label={t('blog.franchiseLabel')}
              mode="single"
              options={facets?.franchises ?? []}
              value={draft.franchise}
              onChange={(v) => patch('franchise', v)}
            />
          </div>

          <div data-panel-item>
            <FacetDropdown
              label={t('blog.genreLabel')}
              mode="multi"
              options={facets?.genres ?? []}
              value={draft.genre}
              onChange={(v) => patch('genre', v)}
            />
          </div>

          <div data-panel-item>
            <FacetDropdown
              label={t('blog.moodLabel')}
              mode="multi"
              options={facets?.moods ?? []}
              value={draft.mood}
              onChange={(v) => patch('mood', v)}
            />
          </div>

          <label className={styles.panel__toggleRow} data-panel-item>
            <span>{t('blog.spoilerFreeOnly')}</span>
            <span className={styles.toggle} data-checked={draft.spoilerFree || undefined}>
              <input
                type="checkbox"
                checked={draft.spoilerFree}
                onChange={(e) => patch('spoilerFree', e.target.checked)}
              />
              <span className={styles.toggle__knob} />
            </span>
          </label>
        </div>

        <div className={styles.panel__footer} data-panel-item>
          <button
            type="button"
            className={styles.panel__cancel}
            onClick={() => {
              // Sadece taslağı temizleyip Apply'ı ayrı bir adıma bırakmak
              // kullanıcıya "Reset çalışmıyor" hissi verdi (panel Apply'sız
              // kapanınca dışarıdaki uygulanmış filtre/chip'ler değişmeden
              // kalıyordu). Reset artık TEK tıkla FilterResults'taki "Clear
              // all" ile AYNI şeyi yapar: taslağı temizler, uygulanmış
              // filtreyi sıfırlar VE küratörlü hub'a döner (onApply DEĞİL —
              // "Reset" boş filtreyle browse moduna girmek değil, filtreden
              // tamamen çıkmak demektir).
              setDraft(EMPTY_FILTERS);
              onResetAll();
              requestClose();
            }}
            disabled={activeDraftCount === 0}
          >
            {t('blog.reset')}
          </button>
          <button
            type="button"
            className={styles.panel__apply}
            onClick={() => {
              onApply(draft);
              requestClose();
            }}
          >
            {t('blog.applyFilters')}
          </button>
        </div>
      </div>
    </div>
  );
}
