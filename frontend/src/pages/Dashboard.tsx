import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { TextToSpeechButton } from '@/components/TextToSpeech';

type UserPayload = {
  user: {
    name: string;
    difficultyLevel?: string;
    lastQuizAverage?: number | null;
  };
  progress: { moduleId: string; percentComplete: number; updatedAt?: string }[];
  quizScores: { quizId: string; score: number; total: number; createdAt?: string }[];
  assessments: { score: number; interpretation: string; createdAt?: string }[];
};

export function Dashboard() {
  const { user, refreshUserData } = useAuth();
  const [data, setData] = useState<UserPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: d } = await api.get<UserPayload>('/user-data');
        if (!cancelled) setData(d);
      } catch {
        if (!cancelled) setErr('Could not load dashboard data.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = useMemo(() => {
    if (!data?.quizScores?.length) return [];
    return [...data.quizScores]
      .reverse()
      .slice(-12)
      .map((q, i) => ({
        name: `#${i + 1}`,
        pct: Math.round((q.score / q.total) * 100),
      }));
  }, [data]);

  const welcome = data?.user?.name || user?.name || 'Learner';

  return (
    <div className="container-page" style={{ paddingTop: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.25rem' }}>Welcome, {welcome}</h1>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Adaptive level: <strong>{data?.user?.difficultyLevel || user?.difficultyLevel || 'medium'}</strong>
            {data?.user?.lastQuizAverage != null && (
              <> · Recent quiz average: {Math.round((data.user.lastQuizAverage as number) * 100)}%</>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Link to="/assessment" className="btn-primary" style={{ color: '#fff', textDecoration: 'none' }}>
            New screening
          </Link>
          <Link to="/learning" className="btn-ghost" style={{ textDecoration: 'none' }}>
            Learning modules
          </Link>
          <button type="button" className="btn-ghost" onClick={() => refreshUserData()}>
            Refresh
          </button>
        </div>
      </div>

      {err && <p style={{ color: '#dc2626' }}>{err}</p>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="glass" style={{ padding: '1.25rem', minHeight: 260 }}>
          <h2 style={{ marginTop: 0 }}>Quiz performance</h2>
          {chartData.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>Complete a quiz to see your trend.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted)" />
                <YAxis domain={[0, 100]} stroke="var(--muted)" />
                <Tooltip />
                <Line type="monotone" dataKey="pct" stroke="#6366f1" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass" style={{ padding: '1.25rem' }}>
          <h2 style={{ marginTop: 0 }}>Module progress</h2>
          {!data?.progress?.length ? (
            <p style={{ color: 'var(--muted)' }}>Open a module and mark progress to see it here.</p>
          ) : (
            <ul style={{ paddingLeft: '1.1rem', margin: 0 }}>
              {data.progress.map((p) => (
                <li key={p.moduleId} style={{ marginBottom: '0.5rem' }}>
                  <strong>{p.moduleId}</strong> — {p.percentComplete}%
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="glass" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Screening history</h2>
          <TextToSpeechButton
            label="🔊 Summary"
            text={
              data?.assessments?.length
                ? `You have ${data.assessments.length} saved screenings. Latest: ${data.assessments[0].interpretation}`
                : 'No screenings saved yet. Complete a screening while logged in.'
            }
          />
        </div>
        {!data?.assessments?.length ? (
          <p style={{ color: 'var(--muted)' }}>No assessments yet. Run a screening while signed in to save results.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                  <th style={{ padding: '0.5rem' }}>Date</th>
                  <th style={{ padding: '0.5rem' }}>Score</th>
                  <th style={{ padding: '0.5rem' }}>Summary</th>
                </tr>
              </thead>
              <tbody>
                {data.assessments.map((a) => (
                  <tr key={String(a.createdAt)} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.65rem' }}>{a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}</td>
                    <td style={{ padding: '0.65rem' }}>{a.score}</td>
                    <td style={{ padding: '0.65rem' }}>{a.interpretation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
