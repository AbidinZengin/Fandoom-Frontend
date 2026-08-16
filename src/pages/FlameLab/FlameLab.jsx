import { Flame } from './Flame/Flame';
import styles from './FlameLab.module.css';

// Geçici deneme route'u (/flame-lab) — alev shader'ı beğenilene kadar burada
// tunelanır, onaylanınca Flame/ klasörü asıl yerine taşınıp bu sayfa silinir.
export default function FlameLab() {
  return (
    <main className={styles.lab}>
      <Flame />
    </main>
  );
}
