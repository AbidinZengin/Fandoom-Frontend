# TR/EN i18n — FE Routing + Altyapı Uygulama Planı

Tarih: 2026-08-21
İlgili: `docs/plans/2026-08-13-i18n-tr-en-design.md` (mimari karar — kolon
ikizleme, kapsam matrisi, backend sözleşmesi). Bu doküman o kararın FE
uygulama detayını netleştirir.

## Bağlam

- Backend'de `title_tr`/`title_en` şeması ve `Accept-Language` desteği
  henüz yok — kullanıcı endpoint sözleşmelerini backend'e ayrıca
  iletecek. Bu yüzden **bugünkü kapsam sadece FE altyapısı**: routing,
  i18next kurulumu, dil switcher, ve paylaşılan chrome (Navbar/Footer)
  + Home'un statik metni. Gerçek prod içerik (Series/Episode/Blog/Genre)
  backend hazır olana kadar tek dilde kalmaya devam eder.
- **Varsayılan dil: EN** (kullanıcı kararı — 2026-08-13 dokümanındaki
  TR-öncelikli varsayımdan farklı, bu doküman güncel kaynaktır).
- Admin paneli (`/admin/*`) kapsam dışı — SEO'ya konu değil, route'ları
  değişmez.

## 1) Routing İskeleti

`App.jsx`'teki `<Routes>` üç gruba ayrılır:

```
<Routes>
  {/* Admin — DOKUNULMAZ */}
  <Route path="/admin/login" ... />
  ... (mevcut admin route'ları aynen)

  {/* Dil-prefixli uygulama */}
  <Route path="/:lang" element={<LangGate />}>
    <Route index element={<Home />} />
    <Route path="series/game-of-thrones" element={<GameOfThrones />} />
    ... (mevcut ~20 route, path'ler relative — baştaki "/" kaldırılır)
  </Route>

  {/* Eski/prefix'siz path yakalayıcı */}
  <Route path="*" element={<LegacyRedirect />} />
</Routes>
```

**`LangGate`** (`src/shared/i18n/LangGate.jsx`): `:lang` param'ını okur.
- `tr`/`en` değilse → `<Navigate to={`/en${location.pathname}`} replace />`
  (örn. `/blog` yanlışlıkla `lang="blog"` diye eşleşirse burada
  yakalanıp `/en/blog`'a döner — çünkü Home index route olduğu için
  geçersiz bir `:lang` değeri route ağacında sessizce Home'a düşebilir).
- Geçerliyse `i18n.changeLanguage(lang)` çağırır (`useEffect`, `[lang]`
  bağımlılığı) ve `<Outlet />` render eder.

**`LegacyRedirect`**: `useLocation()`'dan pathname okur,
`/en${pathname}`'e `replace` ile yönlendirir. Kök `/`, `/series/breaking-bad`
gibi tüm prefix'siz eski path'ler segment eşleşmesi gereği doğal olarak
buraya düşer.

Admin route'ları tamamı statik segment olduğu için React Router v6'nın
skorlama mantığı bunları `/:lang/*` dinamik dalına karşı otomatik
önceliklendirir.

## 2) Link/Navigate Deseni (24 dosya)

Mevcut kod mutlak path kullanıyor (`<Link to="/series/breaking-bad">`,
`navigate('/blog/foo')`). Prefix eklenince bunlar dili kaybeder.

`src/shared/i18n/` içinde iki ince sarmalayıcı:

- **`useLang()`**: `useLocation()`'dan pathname'in ilk segmentini okur,
  `tr`/`en` değilse `'en'` döner. Route ağacına bağımlı değil
  (`useParams` değil) — Navbar/Footer gibi `<Routes>` dışında render
  edilen component'lerde de çalışır.
- **`<LocalizedLink to="...">`**: `react-router-dom`'un `Link`'ini
  sarar, `to` mutlak ise `useLang()`'den aldığı prefix'i başa ekler.
- **`useLocalizedNavigate()`**: `useNavigate()`'i sarar, aynı prefix
  mantığını `navigate(path)` çağrısına uygular.

24 dosyada değişiklik mekanik: import satırı değişir
(`Link` → `LocalizedLink as Link`, `useNavigate` → `useLocalizedNavigate`),
path string'lerinin kendisi DOKUNULMAZ.

## 3) i18next Kurulumu + Sözlük + Dil Switcher

- **`src/shared/i18n/i18n.js`**: `i18next` + `react-i18next` init.
  `lng` browser algılamasından değil `LangGate`'in
  `i18n.changeLanguage(lang)` çağrısından gelir — URL tek doğruluk
  kaynağı. `fallbackLng: 'en'`.
- **`src/shared/i18n/locales/{en,tr}.json`**: namespace'e göre iç içe
  (`navbar`, `footer`, `home`). Bugün ~30-40 key, ileride yeni
  namespace'lerle büyür.
- **Provider**: `main.jsx`'te `<I18nextProvider i18n={i18n}>`
  `<BrowserRouter>`'ın dışında.
- **`LanguageSwitcher`**: Navbar içinde TR/EN toggle. `useLang()` ile
  mevcut dili okur, tıklanınca path'in ilk segmentini diğer dille
  değiştirip `navigate(newPath)` (push) çağırır.

## 4) Kapsam Dışı (bugün) + Doğrulama

**Kapsam dışı:**
- Prod içerik çevirisi (backend şeması bekliyor).
- Kalan ~27 dosyadaki statik metin (GoT, Breaking Bad, Blog, Admin) —
  aynı desenle ayrı görev olarak ilerlenecek.
- Admin dil desteği.
- Breaking Bad özel font TR diakritik riski (içerik çevrilmediği için
  tetiklenmiyor).

**Doğrulama:**
1. `npm run lint` temiz.
2. Dev sunucusunda manuel gezinme: `/` → `/en`, switcher ile `/tr`
   geçişi, eski path redirect, admin route'ları etkilenmiyor.
3. `npm run capture -- /en` ve `/tr` ile Navbar/Footer/Home screenshot
   karşılaştırması (TR metin taşması kontrolü).
4. `npm run build` temiz.
