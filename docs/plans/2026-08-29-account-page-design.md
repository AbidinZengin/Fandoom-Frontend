# Account Sayfası — Tasarım (2026-08-29)

## Kapsam
`/{lang}/account` route'u (App.jsx:219, şu an `Placeholder`) gerçek bir
Account sayfasına dönüşüyor. **Prototip** — backend'de normal kullanıcı
(register/login/watchlist/likes) modeli yok, tüm veri/oturum local
state + mock data (`Account.data.js`). Sayfa yenilenince oturum sıfırlanır
(kabul edilen sınırlama).

## Referanslar
1. Glassmorphic sign-in kart yapısı (mor gradient arka planı KULLANILMAZ,
   sadece kart/form iskeleti referans) — kullanıcı ekran görüntüsü.
2. Nested sidebar settings nav (Account > Profile/Display Name/...) —
   kullanıcı ekran görüntüsü.
3. Toggle-switch settings modal (Notifications/Security, Cancel/Save) —
   kullanıcı ekran görüntüsü.

## Marka kuralı istisnası (KRİTİK — bilinçli, kullanıcı onaylı)
CLAUDE.md `--brand-gradient` zorunluluğuna bu sayfada **tam istisna**:
sayfa tamamen siyah/beyaz/gri (`--bg`, `--card-bg`, `--fg*`, `--border`).
Gradient, `--brand-red/magenta/pink/purple`, `--accent` hiçbir yerde
kullanılmaz. Kullanıcının kendi seçtiği "accent color" özelleştirmesi
(Settings'te vurgu rengi seçici) bilinçli olarak bu turda ERTELENDİ —
ileride ayrı bir iyileştirme görevi olarak ele alınabilir, o zaman bu
istisna yeniden değerlendirilir.

## Route & State
```
src/pages/Account/
  Account.jsx              — session state: null=AuthView, dolu=DashboardView
  Account.module.css
  Account.data.js          — mock user, mock saved/followed/liked prodüksiyon
                              listesi (shared/api/productions.js'ten gerçek
                              prodüksiyon referanslarıyla), mock rozet/karakter
  AuthView/
    AuthView.jsx + .module.css   — mode: 'signin' | 'signup' local state
  DashboardView/
    DashboardView.jsx + .module.css   — activeSection local state, sidebar+panel
    ProfileSection/
    ContentSection/          — İzlenen&Kayıtlı / Takip Edilenler / Beğeniler (3 alt-tab)
    CharactersSection/        — Karakterler & Rozetler
    SettingsSection/
```
`App.jsx:219`: `<Route path="account" element={<Placeholder .../>} />` →
`<Route path="account" element={<Account />} />` (tek satır değişir).

## Auth View
- Tam ekran, `--bg` zemin + hafif siyah-gri radial vignette (mor glow yerine).
- Kart: `border-radius: var(--radius-lg)`, `background: rgba(255,255,255,0.04)`,
  `backdrop-filter: blur(20px)`, `border: 1px solid rgba(255,255,255,0.08)`.
- Üstte dairesel rozet (FandoomLogo monokrom), başlık, alt yazı.
- **Sign In (varsayılan):** ikonlu email/password input (göz-toggle),
  Remember me + Forgot password (işlevsiz), pill-shape beyaz/siyah primary
  buton "Sign In →", "or" divider, outline "Sign in with Google" (işlevsiz),
  alt: "Don't have an account? Sign up" → `mode: 'signup'` çapraz-fade.
- **Create Account:** Name/Email/Password/Confirm Password, "Create Account →",
  alt: "Already have an account? Sign in" → geri döner.
- Submit (her iki formda) → herhangi bir değer kabul edilir, `setSession(mock)`.

## Dashboard Shell
Sidebar (sol, ~240px, referans 2 dili — düz `--bg`, aktif=beyaz/kalın,
pasif=gri, nested alt-item ince sol çizgi indent):
```
Profil
İçeriklerim ▾
  ├─ İzlenen & Kayıtlı
  ├─ Takip Edilenler
  └─ Beğeniler
Karakterler & Rozetler
Settings
──────────
Log out (kırmızımsı-gri link → session=null)
```
İçerik paneli (sağ): `activeSection`'a göre render, hafif camsı kart
(`rgba(255,255,255,0.03)`, düşük blur — okunabilirlik önceliği).
Responsive (≤900px): sidebar → üstte yatay scroll chip-tab şeridi,
nested grup düzleşir (İzlenen/Takip/Beğeniler ayrı chip).

## Section İçerikleri

**Profil**
- Banner (4-5 hazır preset, mock seçilebilir) + avatar rozeti + isim +
  Fandom Kimliği etiketi (mock user'ın favori tür alanına göre
  `Account.data.js`'de sabit hesaplanır, örn. "Sınıf: Büyücü")
- Aktivite özeti: 4 stat kartı (üyelik tarihi, yorum, teori, beğeni sayısı)
- Devam Et: tek prodüksiyon kartı, "Sezon 2 · Bölüm 4" + progress bar (mock %),
  hover'da "Sonraki Bölüme Git" → gerçek `SeasonEpisodes`/`EpisodePage` route

**İçeriklerim** (3 alt-tab, ortak kart-grid şablonu: poster+başlık+tip)
- İzlenen & Kayıtlı / Takip Edilenler / Beğeniler
- Kart hover → Quick Action butonu ("İzlemeye Devam Et" / "Detaya Git"),
  gerçek `ProductionDetail`/season route'una link

**Karakterler & Rozetler**
- Kürsü (Top 3): statik podyum kompozisyonu (1. büyük ortada, 2-3. küçük yanda)
- Rozet ızgarası: kazanılan=renkli, kilitli=`grayscale(1)`+düşük opacity,
  hover tooltip ("Lore Master için 3 teori daha yaz")

**Settings** (referans 3 toggle dili)
- Spoiler Shield (en üstte, vurgulu) — işlevsiz UI
- Bildirimler (Product updates / Comment mentions / Weekly digest)
- Güvenlik (Login alerts / New device approval)
- Görünürlük (izleme listesi/karakterler herkese açık mı) — işlevsiz UI
- Cancel/Save (Save → sadece toast, gerçek kayıt yok)

## Stil/Token
- Renk: `--bg`, `--card-bg`, `--fg`, `--fg-dim`, `--fg-muted`, `--fg-faint`,
  `--border` — brand-gradient/renkler YOK (bkz. istisna notu).
- Glass kart rengi (`rgba(255,255,255,0.03–0.06)` + blur) tek kullanımlık,
  token'a taşınmaz.
- Spacing/Radius/Duration: mevcut skaladan (`--radius-lg`, `--radius-pill`,
  `--space-lg/xl/2xl`, `--duration-fast/micro`). Skalaya uymayan ölçü
  çıkarsa teslimde bildirilir, sessizce icat edilmez.
- Tipografi: `--font-display`/`--font-body` (Montserrat), stat başlıklarında
  `--text-h2` + `--tracking-label` mikro-etiket konvansiyonu.
- Motion: Auth↔Dashboard ve Sign In↔Sign Up geçişleri bu turda CSS
  transition; GSAP crossfade `motion-expert` aşamasında eklenecek.

## Ertelenen (bu turda YOK, ileride ayrı görev)
- Katkı Isı Haritası (contribution heatmap)
- Özel Listeler (Custom Vault / kullanıcı tanımlı liste)
- Accent Color seçici (Settings) — monokrom istisnayla çelişir, kullanıcı
  onayıyla erteledi
- Gerçek backend entegrasyonu (register/login/watchlist/likes API'leri)
- **Topluluk grubu** (Teorilerim & Taslaklarım / Yorum Geçmişim /
  Kaydettiklerim-Bookmarks / Bana Gelen Yanıtlar): `community/discussion`,
  `community/theories`, `community/fan-art` route'ları hâlâ `Placeholder`
  (App.jsx) — gerçek teori/yorum içeriği yok. Bu sayfalar gerçek içerik
  kazanmadan Account'ta bunların mock listesini kurmak var olmayan bir
  özelliğin üstüne inşa etmek olur. Profil'deki Aktivite özeti'nde
  yorum/teori SAYACI (dekoratif rakam) kalır, ayrıntılı liste sayfaları
  Community/Theories gerçek içerik kazanınca ayrı bir görev olarak eklenir.
