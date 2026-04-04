import { Link } from 'react-router-dom';

export function Landing() {
  return (
    <div className="container-page" style={{ paddingTop: '2rem' }}>
      <section className="glass" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        <h1 style={{ marginTop: 0, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>Learn in your own way</h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem', maxWidth: '36rem' }}>
          A supportive hub for reading, writing, focus, and screening—with progress saved securely in the cloud when you
          sign in.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Link to="/register" className="btn-primary" style={{ color: '#fff', textDecoration: 'none' }}>
            Create account
          </Link>
          <Link to="/learning" className="btn-ghost" style={{ textDecoration: 'none' }}>
            Browse modules
          </Link>
          <Link to="/assessment" className="btn-ghost" style={{ textDecoration: 'none' }}>
            Screening test
          </Link>
        </div>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {[
          { t: 'Personalized dashboard', d: 'Track quizzes, screening history, and module progress.' },
          { t: 'Adaptive quizzes', d: 'Difficulty adjusts from your recent performance.' },
          { t: 'Accessibility tools', d: 'Text-to-speech, reading assistant, and focus aids.' },
        ].map((x) => (
          <div key={x.t} className="glass" style={{ padding: '1.25rem' }}>
            <h3 style={{ marginTop: 0 }}>{x.t}</h3>
            <p style={{ color: 'var(--muted)', marginBottom: 0 }}>{x.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
