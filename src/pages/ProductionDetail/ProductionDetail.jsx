import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Footer } from '../../components/Footer/Footer';
import { fetchProductionDetail, resolveGenreNames, theories } from './ProductionDetail.data';
import { themeBySlug, defaultTheme } from './ProductionDetail.theme';

export default function ProductionDetail({ type }) {
  const { slug } = useParams();
  const [production, setProduction] = useState(null);
  const [genreNames, setGenreNames] = useState([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setProduction(null);
    setGenreNames([]);
    setNotFound(false);

    fetchProductionDetail(type, slug)
      .then((data) => {
        if (cancelled) return null;
        setProduction(data);
        return resolveGenreNames(data.genreIds);
      })
      .then((names) => {
        if (!cancelled && names) setGenreNames(names);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });

    return () => {
      cancelled = true;
    };
  }, [type, slug]);

  const theme = themeBySlug[slug] ?? defaultTheme;

  // Yapım temasını global CSS değişkenlerine basar (learned-rules: "Yapım
  // sayfaları TAM TEMA kurar"), sayfadan çıkınca önceki değerlere döner.
  useEffect(() => {
    if (!production) return undefined;
    const root = document.documentElement;
    const prev = {
      bg: root.style.getPropertyValue('--bg'),
      accent: root.style.getPropertyValue('--accent'),
      cardBg: root.style.getPropertyValue('--card-bg'),
    };

    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--card-bg', theme.bg);

    return () => {
      root.style.setProperty('--bg', prev.bg || '#050505');
      root.style.setProperty('--accent', prev.accent || '#a02cd8');
      root.style.setProperty('--card-bg', prev.cardBg || '#101012');
    };
  }, [production, theme]);

  if (notFound) {
    return (
      <>
        <p style={{ padding: 60, textAlign: 'center' }}>Title not found.</p>
        <Footer />
      </>
    );
  }

  if (!production) {
    return null;
  }

  const relatedTheories = theories.filter((t) => t.productionSlug === slug);

  return (
    <>
      <section
        style={{
          minHeight: '50vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '80px clamp(20px, 4vw, 56px) 40px',
          background: theme.gradient,
        }}
      >
        {/* WebGL centerpiece for this production goes here — paused pending 3D concept per show */}
        <span style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: theme.accent, fontWeight: 700 }}>
          {type}
        </span>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', margin: '8px 0 0', color: theme.fg }}>
          {production.title}
        </h1>
        <p style={{ maxWidth: 560, marginTop: 14, color: 'var(--fg-dim)', lineHeight: 1.6 }}>
          {production.synopsis}
        </p>
        {genreNames.length > 0 && (
          <p style={{ marginTop: 10, fontSize: 12, color: 'var(--fg-muted)' }}>{genreNames.join(' · ')}</p>
        )}
      </section>

      <section style={{ padding: '32px clamp(20px, 4vw, 56px)' }}>
        <h2 style={{ fontSize: 22, marginBottom: 16 }}>Theories</h2>
        {relatedTheories.length === 0 && <p style={{ color: 'var(--fg-muted)' }}>No theories yet.</p>}
        {relatedTheories.map((t) => (
          <div key={t.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>{t.title}</h3>
            <p style={{ margin: 0, color: 'var(--fg-dim)', fontSize: 13.5 }}>{t.excerpt}</p>
          </div>
        ))}
      </section>

      <p style={{ padding: '0 clamp(20px, 4vw, 56px)' }}>
        <Link to="/" style={{ color: 'var(--accent)', fontSize: 13 }}>&larr; Back to Home</Link>
      </p>

      <Footer />
    </>
  );
}
