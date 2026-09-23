import { useEffect, useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './CharacterBio.module.css';

// Kullanıcı referansı (Figma Make çıktısı "Karakter blokları tasarımı" +
// kendi ekran görüntüleri): tam-viewport split-screen DEĞİL, ORTALANMIŞ bir
// KART — sayfa değişmez, kart Characters grid'inin üstünde açılır/kapanır.
// House/Allegiance/Status meta grid'i ve "Related Character" bloğu BİLEREK
// yok (kullanıcı kararı: backend'de bu alanlar hiç yok — learned-rules
// karakter-yapı: haneden bağımsız). Tipografi referans zip'in Cinzel/Crimson'ı
// DEĞİL — bu sayfa artık GoT temasını taşıdığı için (bkz. Characters.jsx tema
// effect'i) EpisodeStory/RelatedContent'in kendi kurduğu marka deseni
// kullanılır: gövde Montserrat, başlık+alıntı `--font-got` (kullanıcı
// referansı: EpisodeStory "THE CLOSING TURN" ekran görüntüsü).
//
// Açılış/kapanış animasyonunu Characters.jsx (flip-clone) yönetir — bu
// component `visible` prop'una göre kendi fade-out/in'ini (arka plan
// karartması), mount anında ise `onMeasured` callback'iyle görsel kutusunun
// gerçek rect'ini parent'a bildirir (parent clone'u bu rect'e büyütür).
// İçerik yüksekliğe göre değiştiği için hedef analitik hesaplanmaz, ÖLÇÜLÜR.
export function CharacterBio({ character, index, visible, onMeasured, onRequestClose, onPrev, onNext }) {
  const { t } = useTranslation();
  const imgRef = useRef(null);

  useLayoutEffect(() => {
    if (imgRef.current) onMeasured(imgRef.current.getBoundingClientRect());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.id]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onRequestClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onRequestClose, onPrev, onNext]);

  return (
    <div className={styles.overlay} data-visible={visible ? '' : undefined} onClick={onRequestClose}>
      <div
        className={styles.card}
        data-side={index % 2 === 1 ? 'right' : 'left'}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {character.imageUrl && (
          <div className={styles.card__ambient} style={{ backgroundImage: `url(${character.imageUrl})` }} />
        )}

        <div className={styles.card__media}>
          {character.imageUrl && (
            <img
              ref={imgRef}
              className={styles.card__image}
              data-bio-image=""
              src={character.imageUrl}
              alt={character.name}
            />
          )}
          <div className={styles.card__meltInner} aria-hidden="true" />
          <div className={styles.card__meltEdges} aria-hidden="true" />
        </div>

        <div className={styles.card__panel}>
          <button type="button" className={styles.card__back} onClick={onRequestClose}>
            {t('series.backToCharacters')}
          </button>

          <div className={styles.card__body}>
            <span className={styles.card__label}>{t('series.characterBioLabel')}</span>
            <h1 className={styles.card__name}>{character.name}</h1>

            <div className={styles.card__divider} aria-hidden="true" />

            <p className={styles.card__text}>{character.description}</p>

            {character.quote && (
              <blockquote className={styles.card__quote}>
                <span className={styles.card__quoteRule} aria-hidden="true" />
                <p>&ldquo;{character.quote}&rdquo;</p>
                <cite>— {character.name}</cite>
              </blockquote>
            )}
          </div>

          <div className={styles.card__switcher}>
            <button type="button" className={styles.card__arrow} onClick={onPrev} aria-label={t('series.previousCharacter')}>
              ‹
            </button>
            <span className={styles.card__switcherName}>{character.name}</span>
            <button type="button" className={styles.card__arrow} onClick={onNext} aria-label={t('series.nextCharacter')}>
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
