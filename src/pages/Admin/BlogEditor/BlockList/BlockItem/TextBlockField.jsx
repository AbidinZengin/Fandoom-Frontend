import { useEffect, useRef } from 'react';
import styles from './TextBlockField.module.css';

// blogPostStyles'ın tip class'ıyla (story__heading/quote/body) birlikte
// kullanılır — bu component SADECE textarea'yı görsel olarak "düz metin"
// gibi gösteren resetleri taşır (border/background/padding yok), gerçek
// tipografi caller'ın verdiği className'den gelir. Yükseklik varsayılan
// olarak içeriğe göre otomatik büyür (autosize) — kutu değil, akan metin
// hissi için. `autosize={false}` (PageBuilder'ın kullanıcı N/S tutamacıyla
// SABİT bir yükseklik verdiği TEXT block'ları için) bunu kapatır: textarea
// artık kendi scrollHeight'ına göre büyümez, verilen kutuyu (height:100%)
// doldurur, taşan metin textarea'nın kendi native scroll'una düşer.
export function TextBlockField({ className, style, value, onChange, onBlur, placeholder, readOnly, autosize = true }) {
  const ref = useRef(null);

  const measure = () => {
    if (!ref.current || !autosize) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, autosize]);

  useEffect(() => {
    if (!ref.current || !autosize) return undefined;
    const observer = new ResizeObserver(() => measure());
    observer.observe(ref.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autosize]);

  return (
    <textarea
      ref={ref}
      className={`${className} ${styles.textField}`}
      style={autosize ? style : { ...style, height: '100%' }}
      placeholder={placeholder ?? 'Enter text…'}
      value={value}
      maxLength={5000}
      rows={1}
      readOnly={readOnly}
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
