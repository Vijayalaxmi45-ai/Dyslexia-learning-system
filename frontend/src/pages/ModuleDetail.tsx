import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MODULES } from '@/data/modules';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { TextToSpeechButton } from '@/components/TextToSpeech';

export function ModuleDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const mod = id ? MODULES[id] : undefined;
  const [pct, setPct] = useState(33);
  const [msg, setMsg] = useState<string | null>(null);

  if (!mod) {
    return (
      <div className="container-page">
        <p>Module not found.</p>
        <Link to="/learning">Back</Link>
      </div>
    );
  }

  const active = mod;

  async function saveProgress(next: number) {
    setMsg(null);
    if (!user) {
      setMsg('Sign in to save progress to the cloud.');
      setPct(next);
      return;
    }
    try {
      await api.post('/progress', { moduleId: active.id, percentComplete: next, meta: { source: 'module-detail' } });
      setPct(next);
      setMsg('Saved.');
    } catch {
      setMsg('Could not save progress.');
    }
  }

  return (
    <div className="container-page" style={{ paddingTop: '1.5rem' }}>
      <Link to="/learning" style={{ color: 'var(--muted)' }}>
        ← All modules
      </Link>
      <div className="glass" style={{ padding: '1.5rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '2.5rem' }}>{mod.icon}</span>
          <h1 style={{ margin: 0 }}>{mod.title}</h1>
          <TextToSpeechButton text={`${mod.title}. ${mod.fullDescription}`} />
        </div>
        <p style={{ color: 'var(--muted)', maxWidth: '42rem' }}>{mod.fullDescription}</p>

        <h2 style={{ marginTop: '1.5rem' }}>Strategies</h2>
        <ul style={{ paddingLeft: '1.2rem' }}>
          {mod.strategies.map((s) => (
            <li key={s.id} style={{ marginBottom: '0.75rem' }}>
              <strong>{s.name}</strong> — {s.desc}
            </li>
          ))}
        </ul>

        <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 700 }}>Mark progress:</span>
          {[33, 66, 100].map((n) => (
            <button key={n} type="button" className={n <= pct ? 'btn-primary' : 'btn-ghost'} onClick={() => saveProgress(n)}>
              {n}%
            </button>
          ))}
        </div>
        {msg && <p style={{ marginTop: '0.75rem', fontWeight: 600 }}>{msg}</p>}
      </div>
    </div>
  );
}
