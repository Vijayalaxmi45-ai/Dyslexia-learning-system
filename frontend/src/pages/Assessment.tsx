import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const QUESTIONS = [
  'Is reading a full page of text very tiring for you?',
  'Do you often confuse left and right directions?',
  'Do you find it hard to learn the times tables?',
  'Is spelling even easy words difficult for you?',
  'Do you skip lines or lose your place while reading?',
  'Is it hard for you to copy notes from a screen or board?',
  "Do you feel that letters 'move' or 'blur' on the page?",
  'Do you prefer to answer questions out loud rather than writing them?',
  "Do you often misread words that look similar (e.g., 'was' and 'saw')?",
  'Do you find it difficult to remember a sequence of instructions?',
  'Do you struggle to finish reading assignments on time?',
  'Do you often find your mind wandering during long reading tasks?',
];

export function Assessment() {
  const { token } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ analysis: string; suggestions: string[] } | null>(null);

  const progress = useMemo(() => (QUESTIONS.length ? (step / QUESTIONS.length) * 100 : 0), [step]);

  async function finish(finalAnswers: boolean[]) {
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
      const url = base ? `${base}/api/predict` : '/api/predict';
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ answers: finalAnswers }),
      });
      const data = await res.json();
      setResult({ analysis: data.analysis, suggestions: data.suggestions || [] });
    } catch {
      setResult({ analysis: 'Something went wrong. Please try again.', suggestions: [] });
    } finally {
      setLoading(false);
    }
  }

  function answer(yes: boolean) {
    const next = [...answers, yes];
    setAnswers(next);
    if (step + 1 >= QUESTIONS.length) {
      setStep(step + 1);
      void finish(next);
    } else {
      setStep((s) => s + 1);
    }
  }

  function restart() {
    setStep(0);
    setAnswers([]);
    setResult(null);
  }

  return (
    <div className="container-page" style={{ paddingTop: '1.5rem', maxWidth: 720 }}>
      <h1 style={{ marginTop: 0 }}>Screening assessment</h1>
      <p style={{ color: 'var(--muted)' }}>Answer yes or no. Sign in to save results to your dashboard.</p>

      <div className="glass" style={{ padding: '1.5rem', marginTop: '1rem', position: 'relative' }}>
        <div
          style={{
            height: 10,
            borderRadius: 999,
            background: 'var(--border)',
            overflow: 'hidden',
            marginBottom: '1rem',
          }}
        >
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--gradient)', transition: 'width 0.3s' }} />
        </div>

        {loading && <p>Analyzing…</p>}

        {!result && !loading && step < QUESTIONS.length && (
          <>
            <h2 style={{ lineHeight: 1.4 }}>{QUESTIONS[step]}</h2>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              <button type="button" className="btn-primary" onClick={() => answer(true)}>
                Yes
              </button>
              <button type="button" className="btn-ghost" onClick={() => answer(false)}>
                No
              </button>
            </div>
            <p style={{ color: 'var(--muted)', marginTop: '1rem' }}>
              Question {step + 1} of {QUESTIONS.length}
            </p>
          </>
        )}

        {result && (
          <>
            <h2 style={{ marginTop: 0 }}>Result</h2>
            <p style={{ fontSize: '1.1rem' }}>{result.analysis}</p>
            <h3>Suggestions</h3>
            <ul>
              {result.suggestions.map((s) => (
                <li key={s} style={{ marginBottom: '0.35rem' }}>
                  {s.replace(/\*\*/g, '')}
                </li>
              ))}
            </ul>
            <button type="button" className="btn-primary" onClick={restart}>
              Restart
            </button>
          </>
        )}
      </div>
    </div>
  );
}
