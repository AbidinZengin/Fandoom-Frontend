import { Component } from 'react';
import styles from './PageBuilder.module.css';

// React'in class dışında error boundary API'si yok (CLAUDE.md'nin "class
// component yasak" kuralının BİLİNÇLİ istisnası — framework zorunluluğu).
// Undo/Redo yığınında ileride benzer bir kenar durumu çıkarsa artık tüm
// sayfa siyah ekrana düşmez, bu panel görünür ve "Yeniden dene" state'i
// resetleyip Canvas'ı yeniden mount eder.
export class PageBuilderErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className={styles.pageBuilder__status}>
          Bir şeyler ters gitti — düzenleyici durumu bozuldu.
          <button type="button" onClick={() => this.setState({ error: null })}>
            Yeniden dene
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
