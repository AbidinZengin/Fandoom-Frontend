import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { getProductionBySlug } from '../data/productions';
import { theories } from '../data/content';

export default function ProductionDetail() {
  const { slug } = useParams();
  const production = getProductionBySlug(slug);

  useEffect(() => {
    if (!production) return;
    const root = document.documentElement;
    const prev = {
      bg: root.style.getPropertyValue('--bg'),
      accent: root.style.getPropertyValue('--accent'),
      cardBg: root.style.getPropertyValue('--card-bg'),
    };

    root.style.setProperty('--bg', production.theme.bg);
    root.style.setProperty('--accent', production.theme.accent);
    root.style.setProperty('--card-bg', production.theme.bg);

    return () => {
      root.style.setProperty('--bg', prev.bg || '#050505');
      root.style.setProperty('--accent', prev.accent || '#a02cd8');
      root.style.setProperty('--card-bg', prev.cardBg || '#101012');
    };
  }, [production]);

  if (!production) {
    return (
      <>
        <Navbar />
        <p style={{ padding: 60, textAlign: 'center' }}>Title not found.</p>
        <Footer />
      </>
    );
  }

  const relatedTheories = theories.filter((t) => t.productionSlug === slug);

  return (
    <>
      <Navbar />
      <section
        style={{
          minHeight: '50vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '80px clamp(20px, 4vw, 56px) 40px',
          background: production.posterGradient,
        }}
      >
        {/* WebGL centerpiece for this production goes here — paused pending 3D concept per show */}
        <span style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: production.theme.accent, fontWeight: 700 }}>
          {production.type}
        </span>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', margin: '8px 0 0', color: production.theme.fg }}>
          {production.title}
        </h1>
        <p style={{ maxWidth: 560, marginTop: 14, color: 'var(--fg-dim)', lineHeight: 1.6 }}>
          {production.synopsis}
        </p>
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
