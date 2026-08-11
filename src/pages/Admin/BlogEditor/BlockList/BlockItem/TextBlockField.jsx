import { useEffect, useRef } from 'react';
import styles from './TextBlockField.module.css';

// blogPostStyles'ın tip class'ıyla (story__heading/quote/body) birlikte
// kullanılır — bu component SADECE textarea'yı görsel olarak "düz metin"
// gibi gösteren resetleri taşır (border/background/padding yok), gerçek
// tipografi caller'ın verdiği className'den gelir. Yükseklik içeriğe göre
// otomatik büyür (autosize) — kutu değil, akan metin hissi için.
export function TextBlockField({ className, style, value, onChange, onBlur, placeholder }) {
  const ref = useRef(null);

  const measure = () => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  };

  // Yazarken (value değişince) yeniden ölçer — ama bu TEK BAŞINA yetmezdi:
  // bloğun GENİŞLİĞİ resize tutamacıyla değiştirildiğinde metin daha çok
  // satıra sarıyor ama yükseklik sabit kalıp fazlalık kırpılıyordu
  // (kullanıcı raporu: "yatayda paragrafı kısaltırsam metin yok oluyor").
  // ResizeObserver GENİŞLİK değişimini de yakalar, nedeni ne olursa olsun
  // (resize tutamacı, font boyutu, canvas yeniden boyutlanması) her
  // durumda doğru yüksekliğe kilitler.
  useEffect(() => {
    measure();
  }, [value]);

  useEffect(() => {
    if (!ref.current) return undefined;
    const observer = new ResizeObserver(() => measure());
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <textarea
      ref={ref}
      className={`${className} ${styles.textField}`}
      style={style}
      placeholder={placeholder ?? 'Enter text…'}
      value={value}
      maxLength={5000}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      // Grammarly (ve benzeri yazım eklentileri) metin alanının üzerine
      // kendi kutusunu/simgelerini bindirip komşu bloklara tıklamayı
      // engelliyordu (kullanıcı raporu: "çizgili alan yüzünden başka
      // componentlere geçemiyorum") — standart devre dışı bırakma attr'ları.
      data-gramm="false"
      data-gramm_editor="false"
      data-enable-grammarly="false"
    />
  );
}
