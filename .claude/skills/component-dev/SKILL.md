---
name: component-dev
description: >-
  Yeni bir React component/section iskeletini Fandoom sözleşmesiyle kurar
  (Foo.jsx + Foo.css çifti, sayfa-altı klasör yerleşimi, token'lı stil).
  Kullanıcı "yeni component/section/sayfa ekle" dediğinde ve plan +
  referans spec'leri onaylandığında kullan. Motion EKLEMEZ — animasyon
  motion-expert'in işidir. Çıktısı screenshot'la "yön doğru mu?" onayına
  sunulur.
---

# Component İskeleti Kurma

## Ön koşul

- Plan (component listesi + referans spec'leri) kullanıcı tarafından
  onaylanmış olmalı.
- Referans görüntü `.claude/scratchpad/refs/` içinde hazır olmalı
  (yoksa önce `visual-verify` Mod 1).
- `learned-rules` okunmuş olmalı.

## Referans implementasyon

Önce mevcut bir sayfa component'ini UÇTAN UCA oku (örn.
`src/pages/Home/ContentSection/` veya `src/pages/GameOfThrones/Hero/`) —
dosya düzeni, isimlendirme ve CSS yaklaşımı ona benzesin.

## Yerleşim kararı (kod yazmadan önce)

- Sayfaya özel component → `src/pages/<Page>/<Component>/` altına.
- `src/components/`'a SADECE çok-sayfalı paylaşılan chrome girer;
  yeni component'in oraya girmesi gerektiğini düşünüyorsan SOR.
- Yeni sayfa → `src/pages/<Page>/<Page>.jsx + .css` + `App.jsx`'e route.

## Üretim sırası

1. `<Component>.jsx` — sadece yapı ve semantik HTML (section/article/
   nav/h1-h6 doğru kullan). Veri props ile gelir; `src/data` importu
   sayfaya aittir, component'e değil.
2. `<Component>.css` — SADECE `theme.css` token'ları (`--space-*`,
   `--radius-*`, `--text-*`, `--duration-*`, renkler). className:
   `block__element`.
3. Sayfaya/route'a bağla, gerçek `src/data` verisiyle render et.

## Katı kurallar

- Inline style YASAK; hardcoded px/hex YASAK — skalaya uymayan değer
  gerekiyorsa sessizce icat etme, teslim özetinde bildir.
- Bu aşamada animasyon/transition YOK (hover micro-feedback dahil değil —
  o da motion-expert'te değerlendirilir).
- Class component yasak; fonksiyonel component + hook.
- `src/data` şemasına alan ekleme/yeniden adlandırma YASAK.

## Çıktı — ucuz onay kapısı

`npm run lint` temiz olmalı. `npm run capture -- <route>` ile screenshot
al, referansla yan yana göster, **"yön doğru mu?" onayı iste**. Onay
gelmeden sonraki aşamaya GEÇME — yanlış yön burada ölmeli.

## Handoff

Onay sonrası → `motion-expert` (animasyon), ardından `visual-verify`
Mod 2 (karşılaştırma döngüsü).
