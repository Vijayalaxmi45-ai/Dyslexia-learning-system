import { useMemo, useState } from 'react';
import { api } from '@/api/client';
import { useAuth } from '@/context/AuthContext';

const BANK = {
  easy: [
    { q: 'Which helps reduce visual stress when reading?', options: ['Smaller font only', 'Colored overlays', 'Skipping lines'], a: 1 },
    { q: 'Breaking instructions into single steps supports:', options: ['Memory', 'Ignoring tasks', 'Faster skipping'], a: 0 },
    { q: 'A Pomodoro session often uses:', options: ['5 min work', '25 min work', '3 hours work'], a: 1 },
  ],
  medium: [
    { q: 'Phonological awareness relates most to:', options: ['Letter sounds', 'Desk color', 'Screen brightness'], a: 0 },
    { q: 'Guided reading rulers mainly help with:', options: ['Line tracking', 'Math symbols', 'File naming'], a: 0 },
    { q: 'Mind maps are useful before:', options: ['Sleep only', 'Structured writing', 'Deleting files'], a: 1 },
  ],
  hard: [
    { q: 'Dyslexia-friendly practice often pairs reading with:', options: ['Only silent speed drills', 'Multisensory cues', 'Avoiding audio'], a: 1 },
    { q: 'Working memory load is reduced by:', options: ['Long unstructured lists', 'External checklists', 'Removing goals'], a: 1 },
    { q: 'Executive function supports:', options: ['Planning steps', 'Ignoring sequences', 'Removing routines'], a: 0 },
  ],
} as const;

export function Quiz() {
  const { user } = useAuth();
  const raw = user?.difficultyLevel;
  const level: keyof typeof BANK = raw === 'easy' || raw === 'hard' ? raw : 'medium';
  const questions = useMemo(() => BANK[level] || BANK.medium, [level]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  function pick(i: number) {
    if (done) return;
    if (i === questions[idx].a) setScore((s) => s + 1);
    if (idx + 1 >= questions.length) {
      setDone(true);
    } else {
      setIdx((x) => x + 1);
    }
  }

  async function saveScore() {
    if (!user) {
      setNote('Sign in to save your score globally.');
      return;
    }
    setSaving(true);
    setNote(null);
    try {
      const { data } = await api.post('/quiz-score', {
        quizId: `skills-${level}`,
        score,
        total: questions.length,
        details: { level },
      });
      setNote(`Saved. Suggested next difficulty: ${data.suggestedDifficulty}`);
    } catch {
      setNote('Could not save score.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container-page" style={{ paddingTop: '1.5rem', maxWidth: 640 }}>
      <h1 style={{ marginTop: 0 }}>Skills quiz</h1>
      <p style={{ color: 'var(--muted)' }}>
        Questions adapt to your profile (<strong>{level}</strong>). Your recent performance updates difficulty automatically.
      </p>
      <div className="glass" style={{ padding: '1.5rem', marginTop: '1rem' }}>
        {!done ? (
          <>
            <p style={{ fontWeight: 700 }}>
              Question {idx + 1} / {questions.length}
            </p>
            <h2 style={{ marginTop: 0 }}>{questions[idx].q}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {questions[idx].options.map((opt, i) => (
                <button key={opt} type="button" className="btn-ghost" style={{ justifyContent: 'flex-start' }} onClick={() => pick(i)}>
                  {opt}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 style={{ marginTop: 0 }}>Results</h2>
            <p style={{ fontSize: '1.25rem' }}>
              You scored <strong>{score}</strong> / {questions.length}
            </p>
            <button type="button" className="btn-primary" onClick={saveScore} disabled={saving}>
              {saving ? 'Saving…' : 'Save score'}
            </button>
            {note && <p style={{ marginTop: '0.75rem' }}>{note}</p>}
            <button
              type="button"
              className="btn-ghost"
              style={{ marginTop: '1rem' }}
              onClick={() => {
                setIdx(0);
                setScore(0);
                setDone(false);
                setNote(null);
              }}
            >
              Retry
            </button>
          </>
        )}
      </div>
    </div>
  );
}
