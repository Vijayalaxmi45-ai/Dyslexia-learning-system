import { Link } from 'react-router-dom';
import { MODULE_LIST } from '@/data/modules';
import { TextToSpeechButton } from '@/components/TextToSpeech';

export function Learning() {
  return (
    <div className="container-page" style={{ paddingTop: '1.5rem' }}>
      <h1 style={{ marginTop: 0 }}>Learning modules</h1>
      <p style={{ color: 'var(--muted)', maxWidth: '40rem' }}>
        Pick a track to explore strategies. Progress syncs to your account when you are logged in.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem',
        }}
      >
        {MODULE_LIST.map((m) => (
          <div key={m.id} className="glass" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '2rem' }}>{m.icon}</div>
            <h2 style={{ margin: 0 }}>{m.title}</h2>
            <p style={{ color: 'var(--muted)', flex: 1, margin: 0 }}>{m.description}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <Link to={`/learning/${m.id}`} className="btn-primary" style={{ color: '#fff', textDecoration: 'none' }}>
                Open
              </Link>
              <TextToSpeechButton text={`${m.title}. ${m.description}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
