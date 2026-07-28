---
name: visual-verify
description: >-
  Görsel doğrulama ve referans yakalama prosedürü. İki durumda kullan:
  (1) yeni component/section işine başlarken referans site/görüntü
  yakalayıp somut spec çıkarmak için, (2) her UI değişikliğinden sonra
  screenshot alıp referansla/öncekiyle karşılaştırmak için. "Güzel oldu"
  metni kanıt değildir — screenshot kanıttır. Dev sunucusunun açık
  olmasını gerektirir.
---

# Visual Verify — Referans Yakalama + Görsel Doğrulama

## Araçlar

```
npm run capture -- <route> [ad.png] [genişlik]    # kendi sayfamızdan screenshot
npm run capture-ref -- <url> <ad.png> [genişlik]  # referans siteden screenshot
```

- Çıktılar: `capture` → `.claude/scratchpad/screens/`,
  `capture-ref` → `.claude/scratchpad/refs/`
- Varsayılan genişlik 1440px; mobil kontrol için 390 geç.
- Dev sunucusu açık değilse script açık hata verir — önce `npm run dev`
  başlat (arka planda).

## Mod 1 — Referans yakalama (iş başlangıcında)

1. Kullanıcıdan referans URL/görüntü al; URL ise `capture-ref` ile yakala.
2. PNG'yi Read ile incele ve SOMUT spec çıkar:
   - Yerleşim: kolon sayısı, hizalama, section oranları
   - Tipografi: göreli boyut hiyerarşisi (h1 ≈ 2× gövde gibi)
   - Renk/atmosfer: koyu/açık, gradient, kontrast noktaları
   - Boşluk ritmi: sıkı mı ferah mı, section arası nefes
3. Spec'leri `theme.css` token'larına EŞLE (--text-h1, --space-2xl...).
   Eşleşmeyen değerleri kullanıcıya bildir.
4. Çıkan spec listesi plan önerisinin parçasıdır — onaya sunulur.

## Mod 2 — Doğrulama (UI değişikliği sonrası)

1. Değişen route'un screenshot'ını al (`npm run capture`).
2. PNG'yi Read ile incele; referans varsa yan yana değerlendir.
3. SOMUT fark listesi üret (izlenim değil, madde madde). Birincil soru
   "güzel mi?" değil, "referansa benziyor mu?"dur — farkları ölçüyle
   yaz ("başlık referansta ~80px, bizde 56px" gibi):
   - **Referans sadakati (BİRİNCİL):** oran, hiyerarşi, boşluk dengesi
     ve genel siluet eşleşiyor mu?
   - **learned-rules:** kayıtlı kurallardan ihlal var mı?
     (İhlal = otomatik FAIL)
   - Yerleşim kayması / taşma / kırılma var mı?
   - Tipografi hiyerarşisi: başlık/altbaşlık/gövde arasında net
     kontrast var mı?
   - Spacing ritmi: elemanlar arası boşluklar tutarlı mı, yoksa
     gelişigüzel mi hissettiriyor?
   - Token ihlali gözle görünüyor mu (tutarsız boşluk/radius)?
   - Boş/yüklenmemiş asset, eksik metin var mı?
   - Entegrasyon: component komşu section'ları veya sayfa layout'unu
     bozmuş mu?
   - Responsive: 390px capture'da kırılma var mı; CSS'te mantıklı
     `@media` blokları mevcut mu?
4. Fark varsa düzelt → tekrar capture. MAKS 2-3 revizyon turu; hâlâ
   kapanmayan fark varsa kullanıcıya seçenekleriyle sun.
5. Kullanıcıya SONUÇ screenshot'ını her zaman göster (dosya yolunu ver).

## Scroll-driven içerik uyarısı

`capture` script'i screenshot öncesi sayfayı kademeli gezerek
ScrollTrigger animasyonlarını tetikler; yine de scroll-driven bir
component'in ARA durumları tek fullPage screenshot'ta görünmez.
Kritik scroll anları için aynı route'u farklı genişlik/isimle birden
fazla kez yakala ve öyle değerlendir.
