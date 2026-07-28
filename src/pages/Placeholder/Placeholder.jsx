import { Footer } from '../../components/Footer/Footer';

export default function Placeholder({ title }) {
  return (
    <>
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: 'var(--fg-muted)', fontWeight: 700 }}>
          {title} — coming soon
        </h1>
      </div>
      <Footer />
    </>
  );
}
