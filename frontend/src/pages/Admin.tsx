import { useEffect, useState } from 'react';
import { api } from '@/api/client';

type Row = {
  _id: string;
  name: string;
  email: string;
  role: string;
  difficultyLevel?: string;
  counts?: { progress: number; quizzes: number; assessments: number };
};

export function Admin() {
  const [users, setUsers] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ id: string; body: unknown } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<Row[]>('/admin/users');
        if (!cancelled) setUsers(data);
      } catch {
        if (!cancelled) setErr('Unable to load users (admin only).');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadProgress(id: string) {
    try {
      const { data } = await api.get(`/admin/user/${id}/progress`);
      setDetail({ id, body: data });
    } catch {
      setDetail({ id, body: { error: 'Failed to load' } });
    }
  }

  return (
    <div className="container-page" style={{ paddingTop: '1.5rem' }}>
      <h1 style={{ marginTop: 0 }}>Admin</h1>
      <p style={{ color: 'var(--muted)' }}>Users and activity counts. Set ADMIN_EMAIL on the server so the first matching registration becomes admin.</p>
      {err && <p style={{ color: '#dc2626' }}>{err}</p>}
      <div className="glass" style={{ overflowX: 'auto', padding: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
              <th style={{ padding: '0.5rem' }}>Name</th>
              <th style={{ padding: '0.5rem' }}>Email</th>
              <th style={{ padding: '0.5rem' }}>Role</th>
              <th style={{ padding: '0.5rem' }}>Difficulty</th>
              <th style={{ padding: '0.5rem' }}>Activity</th>
              <th style={{ padding: '0.5rem' }} />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '0.65rem' }}>{u.name}</td>
                <td style={{ padding: '0.65rem' }}>{u.email}</td>
                <td style={{ padding: '0.65rem' }}>{u.role}</td>
                <td style={{ padding: '0.65rem' }}>{u.difficultyLevel || '—'}</td>
                <td style={{ padding: '0.65rem', fontSize: '0.9rem' }}>
                  P {u.counts?.progress ?? 0} · Q {u.counts?.quizzes ?? 0} · A {u.counts?.assessments ?? 0}
                </td>
                <td style={{ padding: '0.65rem' }}>
                  <button type="button" className="btn-ghost" onClick={() => loadProgress(u._id)}>
                    Progress
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="glass" style={{ padding: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>User {detail.id}</h2>
            <button type="button" className="btn-ghost" onClick={() => setDetail(null)}>
              Close
            </button>
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(detail.body, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
