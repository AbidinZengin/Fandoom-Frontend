import { useEffect, useState } from 'react';
import { fetchPages, captureReference, generateComponent as generateComponentOnServer, DesignServerError } from '../../../../../shared/api/designServer';
import { generateComponent } from '../../../../../shared/builder/codegen/generateComponent';
import styles from './CodegenPanel.module.css';

const NAME_PATTERN = /^[A-Z][A-Za-z0-9]*$/;

// PageBuilder Faz 2 — "Kodu Üret" akışı. Tuvaldeki tasarımı VAR OLAN bir
// sayfanın altına yeni bir component olarak yazar (bkz.
// docs/plans/2026-08-15-pagebuilder-codegen-design.md). Hedef sayfayı
// SEÇMEK zorunlu — component-bazlı çalışıyoruz, boş bir sayfa/route
// üretimi bu fazın kapsamında YOK (kullanıcı kararı).
//
// referenceImage/onReferenceImage YUKARIDAN (PageBuilder.jsx) kontrollü —
// bu panel'in KENDİSİ değil, Canvas.jsx de aynı görüntüyü arka plan olarak
// çizmesi gerektiği için state iki kardeş component arasında paylaşılıyor.
export function CodegenPanel({ orderedBlocks, blocksById, canvasWidths, canvasHeights, referenceImage, onReferenceImage, blocksPath, blocksForGenerate }) {
  // pages: [{ folder, route }] — SADECE react-router'a kayıtlı GERÇEK
  // sayfalar (design-server'ın App.jsx'i taraması, bkz. parseRoutesFromApp
  // yorumu). Eskiden src/pages altındaki HER .jsx klasörü (sayfa İÇİNDEKİ
  // nested component'ler dahil) düz bir listede karışıyordu — kullanıcı
  // raporu: "hedef sayfada neden componentler var".
  const [pages, setPages] = useState([]);
  const [pagesError, setPagesError] = useState('');
  const [targetDir, setTargetDir] = useState('');

  // Referans sayfası Hedef sayfa'dan BAĞIMSIZ bir seçim — kullanıcı
  // düzeltmesi: "otomatik hedef page'i referans alacağım diye bir şey yok,
  // istediğim referansı seçebilmeliyim". Elle slug girmek istemiyor
  // (önceki rapor) ama seçim yine de AYRI — aynı sayfa listesinden ikinci
  // bir dropdown.
  const [referenceDir, setReferenceDir] = useState('');
  const [captureStatus, setCaptureStatus] = useState('idle');
  const [captureError, setCaptureError] = useState('');

  const [componentName, setComponentName] = useState('');
  const [generateStatus, setGenerateStatus] = useState('idle');
  const [generateMessage, setGenerateMessage] = useState('');

  useEffect(() => {
    fetchPages()
      .then(setPages)
      .catch((err) =>
        setPagesError(err instanceof DesignServerError ? err.message : 'Sayfa listesi alınamadı — design-server çalışıyor mu? (npm run design-server)')
      );
  }, []);

  const route = pages.find((p) => p.folder === referenceDir)?.route ?? '';

  const handleCapture = async () => {
    if (!route) return;
    setCaptureStatus('loading');
    setCaptureError('');
    try {
      const { image } = await captureReference(route, canvasWidths.base);
      onReferenceImage(image);
      setCaptureStatus('idle');
    } catch (err) {
      setCaptureStatus('error');
      setCaptureError(err instanceof DesignServerError ? err.message : 'Ekran görüntüsü alınamadı — design-server çalışıyor mu? (npm run design-server)');
    }
  };

  const handleGenerate = async () => {
    if (!targetDir || !NAME_PATTERN.test(componentName)) return;
    setGenerateStatus('loading');
    setGenerateMessage('');
    try {
      const { jsx, css } = generateComponent({ orderedBlocks, blocksById, componentName, targetDir, canvasWidths, canvasHeights });
      const { path } = await generateComponentOnServer({ targetDir, name: componentName, jsx, css, blocksPath, blocks: blocksForGenerate });
      setGenerateStatus('success');
      setGenerateMessage(`Oluşturuldu: ${path}/${componentName}.jsx — parent sayfaya import etmeyi unutma.`);
    } catch (err) {
      setGenerateStatus('error');
      setGenerateMessage(
        err instanceof DesignServerError ? err.message : 'Kod üretilemedi — design-server çalışıyor mu? (npm run design-server)'
      );
    }
  };

  return (
    <div className={styles.panel}>
      <section className={styles.section}>
        <span className={styles.sectionLabel}>Hedef sayfa</span>
        <p className={styles.hint}>Yeni component'in İÇİNE nested olacağı var olan sayfa — o sayfaya sonradan elle import edilir.</p>
        {pagesError && <p className={styles.error}>{pagesError}</p>}
        <select value={targetDir} onChange={(e) => setTargetDir(e.target.value)}>
          <option value="">Sayfa seç…</option>
          {pages.map((p) => (
            <option key={p.folder} value={p.folder}>
              {p.route}
            </option>
          ))}
        </select>
      </section>

      <section className={styles.section}>
        <span className={styles.sectionLabel}>Referans (opsiyonel)</span>
        <p className={styles.hint}>Ekran görüntüsü tuvalin arkasına referans olarak basılır — Hedef sayfa'dan BAĞIMSIZ, istediğin sayfayı seçebilirsin.</p>
        {pagesError && <p className={styles.error}>{pagesError}</p>}
        <div className={styles.row}>
          <select value={referenceDir} onChange={(e) => setReferenceDir(e.target.value)}>
            <option value="">Sayfa seç…</option>
            {pages.map((p) => (
              <option key={p.folder} value={p.folder}>
                {p.route}
              </option>
            ))}
          </select>
          <button type="button" onClick={handleCapture} disabled={!route || captureStatus === 'loading'}>
            {captureStatus === 'loading' ? 'Yükleniyor…' : referenceImage ? 'Yenile' : 'Referans Al'}
          </button>
        </div>
        {captureStatus === 'error' && <p className={styles.error}>{captureError}</p>}
        {referenceImage && <p className={styles.hint}>Referans tuvale basıldı.</p>}
      </section>

      <section className={styles.section}>
        <span className={styles.sectionLabel}>Kodu Üret</span>
        <input
          type="text"
          placeholder="Component adı (PascalCase, ör. IntroBanner)"
          value={componentName}
          onChange={(e) => setComponentName(e.target.value)}
        />
        <button
          type="button"
          className={styles.generateButton}
          onClick={handleGenerate}
          disabled={!targetDir || !NAME_PATTERN.test(componentName) || generateStatus === 'loading'}
        >
          {generateStatus === 'loading' ? 'Üretiliyor…' : 'Kodu Üret'}
        </button>
        {generateMessage && <p className={generateStatus === 'error' ? styles.error : styles.success}>{generateMessage}</p>}
      </section>
    </div>
  );
}
