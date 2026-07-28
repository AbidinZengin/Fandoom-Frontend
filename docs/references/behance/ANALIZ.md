# Behance Referans Analizi — Jenerik İçerik Sayfası İskeletleri

> Kaynaklar (tümü Behance): Manuel Rovira "Game of Thrones" (#77914079),
> "GOT player design" (#94080921), "The Hobbit — Web & Mobile Experience"
> (#80311765). Görseller CDN'den indirildi, `got/ hobbit/ player/`
> klasörlerinde. Bu analiz GoT/Hobbit'e **özel değil** — her ikisi de
> aynı arketip iskeletin iki markalı örneği. Fandoom'da herhangi bir
> yapım (dizi/film) sayfasına birebir uyarlanabilir jenerik şablonlar.

---

## 1. Doğrulanmış Somut Spec'ler (GoT stil rehberi modülü — mod_12)

Tasarımın kendi stil sayfasından **ölçülmüş** değerler:

- **Font:** `Constantia` (engraved/oturaklı serif). Fandoom marka fontu
  Montserrat — bu bir çatışma; aşağıda "Uyarlama" bkz.
- **Tip skalası (px):** `12 / 14 / 18 / 40 / 80` — beş kademe, gövde ile
  display arasında sert kontrast (18 → 40 → 80 sıçraması).
- **Renk paleti (4 ton):** `#FFFFFF` · `~#949494` (orta gri) ·
  `~#333333` (koyu gri) · yakın-siyah zemin. **Accent renk YOK** —
  tüm sistem grayscale; renk yalnızca fotoğraftan gelir.

Hobbit ise aynı iskeleti farklı serifle + WB marka çerçevesiyle kullanıyor
(GoT'ta HBO, Hobbit'te Warner kalkanı). Yani iskelet marka-bağımsız.

---

## 2. Kalıcı Chrome (her sayfada birebir tekrar eden kabuk)

Bu iskeletin imzası: içerik değişse de **çerçeve sabit**.

**İnce çerçeve (frame):**
- Viewport'un ~40-60px içine çekilmiş 1px'lik ince dikdörtgen kenarlık.
- Köşelerde ve orta-üstte **süsleme (filigree/heraldik ornament)** —
  medieval kıvrımlı ayraçlar. Bölüm başlıklarında da aynı ornament.

**Üst bar (top nav):**
- Sol: logo. · Yanında dil seçici (`En`).
- Orta: **bağlam etiketi** (aktif sayfa adı: Home / Episodes / Map…),
  iki yanında ok/tire süsü (`‹‹ · Home · ··›`).
- Sağ: arama (🔍) + hamburger (3 dikey çizgi, ses dalgası gibi).

**Alt bar (bottom bar):**
- Sol: ses aç/kapa (🔊). · Orta: scrubber / prev-next ornament.
- Sağ: network logosu (HBO / WB) — Fandoom'da kendi logomuz.

**Bölüm watermark:** Her ekranın arkasında dev, çok düşük opaklıkta
ghost metin (HOME, NEWS, FEMALE, DESKTOP…) — derinlik katmanı.

**Sayaçlar & navigasyon:** `01 / 26`, `105 / 118` biçiminde konumlayıcı;
prev/next okları hep ince tire süslemeleriyle.

---

## 3. Jenerik Sayfa İskeletleri (arketip envanteri)

Her biri **herhangi bir yapım** için içerik-agnostik şablon:

### S1 — Hero / Landing
Full-bleed sinematik görsel veya **animasyonlu loop/video** (GoT hero'su
GIF). Merkezde `▶ PLAY / Watch Trailer` + ornament ayraç, altında ikincil
tab'lar (Official Trailer 01/02). Sağ üstte sezon/sürüm rozeti. Kompozisyon
**merkez hizalı**, ağır alt karartma (vignette).

### S2 — Menü Overlay
Tam ekran karartma. Ortada **dikey menü listesi** (Home, Episodes,
Characters, Houses, Cast, News, Images, Trailers, Extras, Store). Arkada
aktif öğenin dev ghost watermark'ı. Kapatma `✕` sağ üst.

### S3 — Arama Overlay
İnce alt-çizgili tek `Search` alanı, italik placeholder, arkada dev
"SEARCH" ghost watermark. Minimal.

### S4 — İçerik İndeksi / Seçici (Episodes • Movies)
Full-bleed karakter/still hero + `Select Season ‹ VII ›` + dev başlık
(bölüm adı) + numara pill'leri (`01…07`) + prev/next + `Explore` CTA.
Hobbit varyantı: alt bar'da 3 film sekmesi (chapter selector).

### S5 — Detay / Sinopsis (iki desen)
- **Editoryal çok-kolon** (GoT Explore): sol = galeri thumb'lar + haber
  kartı; orta = görsel + dairesel `▶ Teaser` + künye (Directed/Written/
  Edit/Music/Cinematography/Duration); sağ = Synopsis uzun metin + pull-quote.
- **Uzun-form makale** (Hobbit): dar merkez kolon, **drop-cap** (dev ilk
  harf), bölüm başlıkları (Background, Story, Prologue…), akıcı okuma
  ritmi. Long-scroll one-page'in gövdesi bu.

### S6 — Karakterler
- **Coverflow carousel:** 5 dikey portre çerçevesi; ortadaki aktif
  (parlak/büyük), yanlar soluk/greyscale.
- **Filtreli grid:** üstte `All Season / All Houses … Female Characters`
  filtre bar'ı; dikey B&W portre kartları, hafif **kademeli (stagger)**
  dikey offset. İsim kartın altında.
- **Karakter bio:** solda full görsel + alıntı; sağda `Bio / Histories /
  Wallpapers` tab + biyografi + hane/faksiyon amblemi.

### S7 — Kadro (Cast)
Dağınık (scattered), farklı offset'lerde yüzen renkli oyuncu fotoğrafları
→ tıklayınca full-bleed portre + `Rol / OYUNCU ADI` overlay + `01/64`
sayaç + altta yatay thumbnail şeridi + prev/next.

### S8 — Hane / Faksiyon (Houses)
Merkez amblem/sancak + `02/12` sayaç + iki yanda önceki/sonraki faksiyon
adı + dev serif ad (HOUSE STARK) + motto (WINTER IS COMING) + `Info`.
Arkada soluk sembol yaratığı (kurt/ejderha) ghost.

### S9 — Galeri / Görseller
Mobil-öncelikli: farklı yükseklikte **yüzen telefon mockup'ları**
(stagger). Desktop: full-bleed still viewer + `105/118` sayaç + caption +
`Season` dropdown + `Download Image ↓`.

### S10 — Posterler / Wallpaper
Full-bleed poster + merkez serif başlık + `01/26` sayaç + `Season`
dropdown + `Download Wallpaper` + prev/next + `Back ✕`.

### S11 — Harita (opsiyonel/IP'ye özel)
İnteraktif dünya haritası, konum pin'leri, seçilince yan panelde
lokasyon kartı (görsel + açıklama). Fandoom'da yalnızca haritası olan
yapımlara.

### S12 — Outro / Kredi
Logo + teşekkür metni + slogan + tasarımcı/konsept künyesi + network logo.

---

## 4. Etkileşim & Motion İpuçları (bu iskelette tipik)

- Full-bleed görsellerde **alttan/üstten siyaha gradyan maske**
  (metin okunabilirliği).
- Ghost watermark'lar scroll'a bağlı yavaş **parallax**.
- Carousel/coverflow: aktif öğe scale + brightness up, yanlar down.
- Prev/next ve sayaçlar hep ornament tire animasyonuyla.
- Hover: hafif zoom + parlaklık; grid kartlarında bilgi overlay.
- Long-scroll one-page: bölümler arası ince dikey bağlantı çizgisi +
  merkez ornament "devam" işareti (Hobbit'te bölümler arası ⌄ ok).
- Lenis smooth-scroll bu tarzın varsayılan beklentisi (bizde zaten var).

---

## 5. Fandoom'a Uyarlama Notları (marka çatışmaları — kullanıcı kararı)

1. **Font:** [KARAR] Montserrat KALIR — iskelet/topografi ödünç alınır,
   tipografi serife çevrilmez. _(2026-07 kullanıcı kararı)_
2. **Renk:** [KARAR] brand-gradient İNCE ACCENT olarak kullanılır
   (CTA/hover/aktif state/ince çizgi), geniş yüzeye yayılmaz; renk
   ağırlıklı olarak fotoğraftan gelir. _(2026-07 kullanıcı kararı)_
3. **Tip skalası:** Referans 12/14/18/40/80. Bizim `theme.css`
   `--text-*` skalasıyla karşılaştırılıp hizalanmalı; 80px hero
   başlık üst sınırımızdan agresif olabilir.
4. **Chrome:** İnce ornament frame + üst/alt bar deseni Fandoom
   Navbar/Footer'a uyarlanabilir; ornament yoğunluğu marka kararı.
5. **Long-scroll one-page hedefi:** S1(hero) → S5(uzun-form sinopsis) →
   S6/S7(karakter/kadro) → S9(galeri) → S12(outro) dizilimi ilk
   prototip için doğal iskelet.
