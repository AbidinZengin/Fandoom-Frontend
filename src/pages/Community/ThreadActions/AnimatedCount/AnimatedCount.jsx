import { useState } from 'react';
import styles from './AnimatedCount.module.css';

// Sayaç değişince eski değer çıkar, yenisi girer (artışta aşağıdan-yukarı,
// azalışta yukarıdan-aşağı). İlk render animasyonsuz. `text` gösterilen
// biçimli sayı ("1.2K"), `count` değişimi ve yönü belirleyen ham değer.
// Saf CSS keyframe — paket/GSAP yok, sadece transform + opacity.
export function AnimatedCount({ count, text }) {
  const [shown, setShown] = useState({ count, text, leaving: null, dir: 1, animate: false });

  // Render sırasında türetilmiş state: prop değişimini effect beklemeden yakalar.
  if (count !== shown.count) {
    setShown({ count, text, leaving: shown.text, dir: count > shown.count ? 1 : -1, animate: true });
  } else if (text !== shown.text) {
    // Sayı aynı, biçim değişti (dil değişimi) — animasyon yok, sadece yenile.
    setShown((s) => ({ ...s, text }));
  }

  return (
    <span className={styles.count}>
      {shown.leaving !== null && (
        <span
          className={styles.count__out}
          data-dir={shown.dir}
          aria-hidden="true"
          onAnimationEnd={() => setShown((s) => ({ ...s, leaving: null }))}
        >
          {shown.leaving}
        </span>
      )}
      <span
        key={shown.count}
        className={styles.count__in}
        data-dir={shown.dir}
        data-animate={shown.animate || undefined}
      >
        {text}
      </span>
    </span>
  );
}
